import {
  AudioPattern,
  PatternContext,
  PatternFeedback,
  PatternMetadata,
  PatternSimilarityOptions,
  RelationshipType,
  MemorySearchParams,
} from "../../types/audio";
import { PatternRepository } from "../storage/PatternRepository";
import { PatternLearningService } from "./PatternLearningService";
import { PatternRelationshipTracker } from "./PatternRelationshipTracker";
import { ContextualMemorySystem } from "../memory/ContextualMemorySystem";
import { AdaptiveConfidenceModeler } from "./AdaptiveConfidenceModeler";
import { HealthMonitor } from "../monitoring/HealthMonitor";

export interface LearningIntegrationConfig {
  enableBatchProcessing: boolean;
  batchSize: number;
  batchWindow: number;
  minConfidenceThreshold: number;
  performance: {
    maxProcessingTime: number;
    trackMetrics: boolean;
  };
}

/**
 * Service that orchestrates interactions between learning components
 * and integrates with existing systems.
 */
export class LearningIntegrationService {
  private repository: PatternRepository;
  private learningService: PatternLearningService;
  private relationshipTracker: PatternRelationshipTracker;
  private memorySystem: ContextualMemorySystem;
  private confidenceModeler: AdaptiveConfidenceModeler;
  private healthMonitor: HealthMonitor;
  private config: LearningIntegrationConfig;

  private batchQueue: {
    pattern: AudioPattern;
    context: PatternContext;
  }[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(
    repository: PatternRepository,
    learningService: PatternLearningService,
    relationshipTracker: PatternRelationshipTracker,
    memorySystem: ContextualMemorySystem,
    confidenceModeler: AdaptiveConfidenceModeler,
    healthMonitor: HealthMonitor,
    config: Partial<LearningIntegrationConfig> = {}
  ) {
    this.repository = repository;
    this.learningService = learningService;
    this.relationshipTracker = relationshipTracker;
    this.memorySystem = memorySystem;
    this.confidenceModeler = confidenceModeler;
    this.healthMonitor = healthMonitor;

    // Default configuration
    this.config = {
      enableBatchProcessing: true,
      batchSize: 10,
      batchWindow: 1000,
      minConfidenceThreshold: 0.6,
      performance: {
        maxProcessingTime: 200,
        trackMetrics: true,
      },
      ...config,
    };
  }

  /**
   * Process a new pattern - add to memory and establish relationships
   */
  async processNewPattern(
    pattern: AudioPattern,
    context: PatternContext
  ): Promise<AudioPattern> {
    const startTime = Date.now();
    try {
      // If batch processing is enabled, add to queue
      if (this.config.enableBatchProcessing) {
        this.addToBatchQueue(pattern, context);
        return pattern;
      }

      // Calculate initial confidence
      pattern.confidence = await this.confidenceModeler.calculateConfidence(pattern);

      // Store in memory system
      await this.memorySystem.addToMemory(pattern, context);

      // Discover and establish relationships
      await this.discoverRelationships(pattern);

      if (this.config.performance.trackMetrics) {
        const processingTime = Date.now() - startTime;
        this.healthMonitor.recordMetric("learning.pattern.processed", {
          patternId: pattern.id,
          processingTime,
          confidence: pattern.confidence,
        });
      }

      return pattern;
    } catch (error) {
      this.healthMonitor.recordMetric("learning.pattern.process_error", {
        patternId: pattern.id,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Process user feedback and distribute to relevant systems
   */
  async processFeedback(patternId: string, feedback: PatternFeedback): Promise<void> {
    const startTime = Date.now();
    try {
      // Process feedback through learning service
      await this.learningService.processFeedback(patternId, feedback);

      // Update confidence model
      const pattern = await this.memorySystem.accessPattern(patternId);
      if (pattern) {
        const newConfidence = await this.confidenceModeler.calculateConfidence(pattern);
        await this.repository.updatePattern(pattern.id, { confidence: newConfidence });
      }

      // Update relationships based on feedback
      if (feedback.affectSimilarPatterns) {
        await this.updateRelatedPatterns(patternId, feedback);
      }

      if (this.config.performance.trackMetrics) {
        const processingTime = Date.now() - startTime;
        this.healthMonitor.recordMetric("learning.feedback.processed", {
          patternId,
          processingTime,
          feedbackType: feedback.isCorrect ? "positive" : "negative",
        });
      }
    } catch (error) {
      this.healthMonitor.recordMetric("learning.feedback.process_error", {
        patternId,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Apply learning to improve pattern detection
   */
  async improvePatternDetection(patternType: string): Promise<void> {
    try {
      // Learn from historical data
      await this.confidenceModeler.learnFromHistory();

      // Get patterns of this type
      const patterns = await this.memorySystem.findPatternsByContext(
        { sessionId: '', userId: '', tags: [] },
        {
          patternType,
          confidenceThreshold: this.config.minConfidenceThreshold,
        }
      );

      // Update confidence scores
      for (const pattern of patterns) {
        const newConfidence = await this.confidenceModeler.calculateConfidence(pattern);
        await this.repository.updatePattern(pattern.id, { confidence: newConfidence });
      }

      // Update relationships
      await this.updateTypeRelationships(patternType);

      this.healthMonitor.recordMetric("learning.detection.improved", {
        patternType,
        patternCount: patterns.length,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("learning.detection.improve_error", {
        patternType,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Find contextually relevant patterns
   */
  async findContextuallyRelevantPatterns(
    context: Partial<PatternContext>,
    prototypePattern?: Partial<AudioPattern>
  ): Promise<AudioPattern[]> {
    try {
      let patterns: AudioPattern[];

      // If prototype pattern provided, find similar patterns
      if (prototypePattern?.features) {
        patterns = await this.memorySystem.findSimilarPatterns(prototypePattern, 20);
      } else {
        // Otherwise search by context
        patterns = await this.memorySystem.findPatternsByContext(context, {
          confidenceThreshold: this.config.minConfidenceThreshold,
        });
      }

      // Sort by confidence and relevance
      patterns.sort((a, b) => {
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;

        // If confidence is similar, consider time (more recent first)
        const aCreatedAt = a.startTime;
        const bCreatedAt = b.startTime;

        return bCreatedAt - aCreatedAt;
      });

      this.healthMonitor.recordMetric("learning.patterns.found", {
        contextSource: context.sourceId,
        count: patterns.length,
      });

      return patterns;
    } catch (error) {
      this.healthMonitor.recordMetric("learning.patterns.find_error", {
        contextSource: context.sourceId,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Add pattern to batch processing queue
   */
  private addToBatchQueue(pattern: AudioPattern, context: PatternContext): void {
    this.batchQueue.push({ pattern, context });

    // Start batch processing timer if not already running
    if (!this.batchTimeout && this.batchQueue.length === 1) {
      this.batchTimeout = setTimeout(
        () => this.processBatch(),
        this.config.batchWindow
      );
    }

    // Process immediately if queue is full
    if (this.batchQueue.length >= this.config.batchSize) {
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }
      this.processBatch();
    }
  }

  /**
   * Process batch of patterns
   */
  private async processBatch(): Promise<void> {
    const batch = this.batchQueue.splice(0, this.config.batchSize);
    this.batchTimeout = null;

    try {
      // Process patterns in parallel
      await Promise.all(
        batch.map(async ({ pattern, context }) => {
          pattern.confidence = await this.confidenceModeler.calculateConfidence(pattern);
          await this.memorySystem.addToMemory(pattern, context);
          await this.discoverRelationships(pattern);
        })
      );

      this.healthMonitor.recordMetric("learning.batch.processed", {
        batchSize: batch.length,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("learning.batch.error", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Discover and establish relationships for a pattern
   */
  private async discoverRelationships(pattern: AudioPattern): Promise<void> {
    try {
      const relationships = await this.relationshipTracker.discoverRelationships(
        pattern.id
      );

      for (const relationship of relationships) {
        await this.relationshipTracker.createRelationship(
          relationship.sourcePatternId,
          relationship.targetPatternId,
          relationship.type as RelationshipType,
          relationship.metadata
        );
      }
    } catch (error) {
      this.healthMonitor.recordMetric("learning.relationships.error", {
        patternId: pattern.id,
        error: String(error),
      });
    }
  }

  /**
   * Update patterns related to one that received feedback
   */
  private async updateRelatedPatterns(
    patternId: string,
    feedback: PatternFeedback
  ): Promise<void> {
    try {
      const relationships = await this.relationshipTracker.getRelationshipsForPattern(
        patternId
      );

      for (const relationship of relationships) {
        const relatedPattern = await this.memorySystem.accessPattern(
          relationship.targetPatternId
        );
        if (!relatedPattern) continue;

        // Adjust confidence based on relationship type and strength
        const confidenceAdjustment =
          feedback.isCorrect ? 0.1 * relationship.confidence : -0.1 * relationship.confidence;

        const newConfidence = Math.max(
          0.1,
          Math.min(0.9, relatedPattern.confidence + confidenceAdjustment)
        );

        await this.repository.updatePattern(relatedPattern.id, {
          confidence: newConfidence,
        });
      }
    } catch (error) {
      this.healthMonitor.recordMetric("learning.related_update.error", {
        patternId,
        error: String(error),
      });
    }
  }

  /**
   * Update relationships for all patterns of a specific type
   */
  private async updateTypeRelationships(patternType: string): Promise<void> {
    try {
      const patterns = await this.memorySystem.findPatternsByContext(
        { sessionId: '', userId: '', tags: [] },
        {
          patternType,
          confidenceThreshold: this.config.minConfidenceThreshold
        }
      );

      for (const pattern of patterns) {
        await this.discoverRelationships(pattern);
      }

      this.healthMonitor.recordMetric("learning.type_relationships.updated", {
        patternType,
        patternCount: patterns.length,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("learning.type_relationships.error", {
        patternType,
        error: String(error),
      });
    }
  }
}
