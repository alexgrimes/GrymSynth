import {
  AudioPattern,
  PatternContext,
  MemorySearchParams,
  PatternMetadata,
} from "../../types/audio";
import { PatternRepository } from "../storage/PatternRepository";
import { FeatureVectorDatabase } from "../storage/FeatureVectorDatabase";
import { PatternRelationshipTracker } from "../learning/PatternRelationshipTracker";
import { HealthMonitor } from "../monitoring/HealthMonitor";

/**
 * Configuration for the Contextual Memory System
 */
export interface ContextualMemoryConfig {
  // Maximum number of patterns to keep in active memory
  maxActivePatterns: number;

  // How much to favor recent patterns (0-1)
  recencyBias: number;

  // How much to favor frequently accessed patterns (0-1)
  frequencyBias: number;

  // Duration after which memories start to decay (days)
  memoryDecayPeriod: number;
}

/**
 * System for managing contextual pattern memory and retrieval
 */
export class ContextualMemorySystem {
  private repository: PatternRepository;
  private vectorDb: FeatureVectorDatabase;
  private relationshipTracker: PatternRelationshipTracker;
  private healthMonitor: HealthMonitor;
  private config: ContextualMemoryConfig;

  // In-memory cache of active patterns
  private activePatterns: Map<
    string,
    {
      pattern: AudioPattern;
      lastAccessed: Date;
      accessCount: number;
    }
  > = new Map();

  constructor(
    repository: PatternRepository,
    vectorDb: FeatureVectorDatabase,
    relationshipTracker: PatternRelationshipTracker,
    healthMonitor: HealthMonitor,
    config?: Partial<ContextualMemoryConfig>
  ) {
    this.repository = repository;
    this.vectorDb = vectorDb;
    this.relationshipTracker = relationshipTracker;
    this.healthMonitor = healthMonitor;

    // Default configuration
    this.config = {
      maxActivePatterns: 100,
      recencyBias: 0.6,
      frequencyBias: 0.4,
      memoryDecayPeriod: 30,
      ...config,
    };
  }

  /**
   * Add a pattern to contextual memory
   */
  async addToMemory(
    pattern: AudioPattern,
    context?: PatternContext
  ): Promise<void> {
    try {
      // Store the pattern if it doesn't exist
      if (!(await this.repository.getPatternById(pattern.id))) {
        // Create metadata from context
        const metadata: PatternMetadata = {
          sourceId: context?.sourceId || "unknown",
          createdAt: new Date(),
          lastModified: new Date(),
          sessionId: context?.sessionId,
          userId: context?.userId,
          tags: context?.tags || [],
        };

        await this.repository.storePattern(pattern, metadata);
      }

      // Add to active patterns
      this.activePatterns.set(pattern.id, {
        pattern,
        lastAccessed: new Date(),
        accessCount: 1,
      });

      // Enforce maximum active patterns limit
      this.pruneActivePatterns();

      // Discover relationships if enabled
      if (pattern.features && pattern.features.length > 0) {
        this.relationshipTracker
          .discoverRelationships(pattern.id)
          .catch((error) => {
            console.error("Failed to discover relationships:", error);
          });
      }

      this.healthMonitor.recordMetric("memory.pattern.added", {
        patternId: pattern.id,
        patternType: pattern.type,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("memory.pattern.add_error", {
        patternId: pattern.id,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Access a pattern, updating its activity metrics
   */
  async accessPattern(patternId: string): Promise<AudioPattern | null> {
    try {
      // Check if pattern is in active memory
      const active = this.activePatterns.get(patternId);

      if (active) {
        // Update access metrics
        active.lastAccessed = new Date();
        active.accessCount++;

        return active.pattern;
      }

      // If not in active memory, try to load from repository
      const pattern = await this.repository.getPatternById(patternId);

      if (pattern) {
        // Add to active memory
        this.activePatterns.set(patternId, {
          pattern,
          lastAccessed: new Date(),
          accessCount: 1,
        });

        // Enforce maximum active patterns limit
        this.pruneActivePatterns();

        this.healthMonitor.recordMetric("memory.pattern.accessed", {
          patternId: pattern.id,
          patternType: pattern.type,
          fromRepository: true,
        });

        return pattern;
      }

      return null;
    } catch (error) {
      this.healthMonitor.recordMetric("memory.pattern.access_error", {
        patternId,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Find patterns in memory that match the specified context
   */
  async findPatternsByContext(
    context: Partial<PatternContext>,
    params?: MemorySearchParams
  ): Promise<AudioPattern[]> {
    try {
      // Build query from context
      const query: any = {};

      if (context.sourceId) {
        query.sourceId = context.sourceId;
      }

      if (context.sessionId) {
        query.sessionId = context.sessionId;
      }

      if (context.userId) {
        query.userId = context.userId;
      }

      if (context.tags && context.tags.length > 0) {
        query.tags = context.tags;
      }

      // Apply search parameters
      if (params) {
        if (params.patternType) {
          query.type = params.patternType;
        }

        if (params.confidenceThreshold) {
          query.confidenceThreshold = params.confidenceThreshold;
        }

        if (params.timeRange) {
          query.timeRange = params.timeRange;
        }

        if (params.frequencyRange) {
          query.frequencyRange = params.frequencyRange;
        }
      }

      // Query repository
      const patterns = await this.repository.queryPatterns(query);

      this.healthMonitor.recordMetric("memory.patterns.found", {
        contextKeys: Object.keys(context).join(","),
        count: patterns.length,
      });

      return patterns;
    } catch (error) {
      this.healthMonitor.recordMetric("memory.patterns.find_error", {
        context: JSON.stringify(context),
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Find patterns similar to a prototype pattern
   */
  async findSimilarPatterns(
    prototypePattern: Partial<AudioPattern>,
    limit: number = 10
  ): Promise<AudioPattern[]> {
    try {
      // If prototype has features, use them for similarity search
      if (prototypePattern.features && prototypePattern.features.length > 0) {
        return this.repository.findSimilarPatterns(prototypePattern.features, {
          maxResults: limit,
          similarityThreshold: 0.7,
        });
      }

      // Otherwise, use type and other attributes for query
      const query: any = {};

      if (prototypePattern.type) {
        query.type = prototypePattern.type;
      }

      if (prototypePattern.frequencyRange) {
        query.frequencyRange = {
          min: prototypePattern.frequencyRange.low * 0.8,
          max: prototypePattern.frequencyRange.high * 1.2,
        };
      }

      if (
        prototypePattern.startTime !== undefined &&
        prototypePattern.endTime !== undefined
      ) {
        const duration = prototypePattern.endTime - prototypePattern.startTime;

        query.durationRange = {
          min: duration * 0.7,
          max: duration * 1.3,
        };
      }

      // Query repository
      const patterns = await this.repository.queryPatterns({
        ...query,
        limit,
      });

      this.healthMonitor.recordMetric("memory.similar_patterns.found", {
        prototypeType: prototypePattern.type,
        count: patterns.length,
      });

      return patterns;
    } catch (error) {
      this.healthMonitor.recordMetric("memory.similar_patterns.find_error", {
        prototypeType: prototypePattern.type,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Prune active patterns to stay within the configured limit
   */
  private pruneActivePatterns(): void {
    if (this.activePatterns.size <= this.config.maxActivePatterns) {
      return;
    }

    // Calculate memory score for each pattern
    const patternScores: Array<{
      id: string;
      score: number;
    }> = [];

    const now = new Date();

    for (const [id, data] of this.activePatterns.entries()) {
      // Calculate recency score (0-1)
      const ageMs = now.getTime() - data.lastAccessed.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(
        0,
        1 - ageDays / this.config.memoryDecayPeriod
      );

      // Calculate frequency score (0-1)
      const frequencyScore = Math.min(1, data.accessCount / 10);

      // Calculate combined score
      const score =
        recencyScore * this.config.recencyBias +
        frequencyScore * this.config.frequencyBias;

      patternScores.push({ id, score });
    }

    // Sort by score (descending)
    patternScores.sort((a, b) => b.score - a.score);

    // Remove lowest-scoring patterns
    const patternsToRemove = patternScores.slice(this.config.maxActivePatterns);

    for (const { id } of patternsToRemove) {
      this.activePatterns.delete(id);
    }

    this.healthMonitor.recordMetric("memory.pruned", {
      removedCount: patternsToRemove.length,
      remainingCount: this.activePatterns.size,
    });
  }
}
