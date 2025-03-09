import {
  AudioPattern,
  PatternFeedback,
  LearningMetrics,
  PatternMetadata,
} from "../../types/audio";
import { PatternRepository } from "../storage/PatternRepository";
import { PatternFeedbackService } from "../feedback/PatternFeedbackService";
import { FeatureVectorDatabase } from "../storage/FeatureVectorDatabase";
import { HealthMonitor } from "../monitoring/HealthMonitor";

/**
 * Configuration options for the Pattern Learning Service
 */
export interface LearningConfig {
  // How quickly the system adapts to new feedback (0-1)
  learningRate: number;

  // Minimum amount of feedback before applying pattern-wide adjustments
  minFeedbackThreshold: number;

  // Maximum similarity distance for considering patterns as related
  similarityThreshold: number;

  // How long feedback remains relevant (in days, 0 = forever)
  feedbackRelevancePeriod: number;

  // Whether to automatically propagate learnings to similar patterns
  enableAutoPropagation: boolean;
}

/**
 * Service responsible for processing feedback and improving pattern detection
 * through continuous learning from user interactions.
 */
export class PatternLearningService {
  private repository: PatternRepository;
  private feedbackService: PatternFeedbackService;
  private vectorDb: FeatureVectorDatabase;
  private healthMonitor: HealthMonitor;
  private config: LearningConfig;

  // Helper function to check if pattern has valid features
  private hasValidFeatures(
    pattern: AudioPattern
  ): pattern is AudioPattern & { features: number[] } {
    return Array.isArray(pattern.features) && pattern.features.length > 0;
  }

  constructor(
    repository: PatternRepository,
    feedbackService: PatternFeedbackService,
    vectorDb: FeatureVectorDatabase,
    healthMonitor: HealthMonitor,
    config?: Partial<LearningConfig>
  ) {
    this.repository = repository;
    this.feedbackService = feedbackService;
    this.vectorDb = vectorDb;
    this.healthMonitor = healthMonitor;

    // Default configuration
    this.config = {
      learningRate: 0.1,
      minFeedbackThreshold: 3,
      similarityThreshold: 0.85,
      feedbackRelevancePeriod: 90,
      enableAutoPropagation: true,
      ...config,
    };
  }

  /**
   * Process new feedback and apply learning to the system
   */
  async processFeedback(
    patternId: string,
    feedback: PatternFeedback
  ): Promise<void> {
    try {
      // Get the pattern
      const pattern = await this.repository.getPatternById(patternId);
      if (!pattern) {
        throw new Error(`Pattern not found: ${patternId}`);
      }

      // Record the feedback first
      await this.feedbackService.submitFeedback(patternId, feedback);

      // Apply initial corrections to the pattern itself
      await this.applyDirectCorrections(pattern, feedback);

      // Find and update similar patterns if enabled
      if (this.config.enableAutoPropagation) {
        await this.propagateLearningToSimilarPatterns(pattern, feedback);
      }

      // Update pattern type statistics
      await this.updatePatternTypeStatistics(pattern, feedback);

      // Record learning event
      this.healthMonitor.recordMetric("learning.feedback.processed", {
        patternId,
        isCorrect: feedback.isCorrect,
        patternType: pattern.type,
        correctedType: feedback.correctedType,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("learning.feedback.error", {
        patternId,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Apply direct corrections to the specified pattern
   */
  private async applyDirectCorrections(
    pattern: AudioPattern,
    feedback: PatternFeedback
  ): Promise<void> {
    if (feedback.isCorrect) {
      // Even if correct, we might adjust confidence upward slightly
      const newConfidence = Math.min(
        1.0,
        pattern.confidence + this.config.learningRate * 0.2
      );
      await this.repository.updatePattern(pattern.id, {
        confidence: newConfidence,
      });
      return;
    }

    // Prepare updates based on feedback
    const updates: Partial<AudioPattern> = {};

    // Update type if corrected
    if (feedback.correctedType && feedback.correctedType !== pattern.type) {
      updates.type = feedback.correctedType;
      updates.confidence = Math.max(
        0.1,
        pattern.confidence - this.config.learningRate * 0.5
      );
    }

    // Update time range if corrected
    if (feedback.correctedTimeRange) {
      updates.startTime = feedback.correctedTimeRange.start;
      updates.endTime = feedback.correctedTimeRange.end;
    }

    // Update frequency range if corrected
    if (feedback.correctedFrequencyRange) {
      updates.frequencyRange = {
        low: feedback.correctedFrequencyRange.low,
        high: feedback.correctedFrequencyRange.high,
      };
    }

    // Update confidence based on user feedback if provided
    if (feedback.userConfidence !== undefined) {
      updates.confidence = feedback.userConfidence;
    }

    // Apply updates if there are any
    if (Object.keys(updates).length > 0) {
      await this.repository.updatePattern(pattern.id, updates);

      this.healthMonitor.recordMetric("learning.pattern.updated", {
        patternId: pattern.id,
        updates: Object.keys(updates).join(","),
      });
    }
  }

  /**
   * Find similar patterns and propagate learnings
   */
  private async propagateLearningToSimilarPatterns(
    pattern: AudioPattern,
    feedback: PatternFeedback
  ): Promise<void> {
    if (!feedback.correctedType || !this.hasValidFeatures(pattern)) {
      return;
    }

    try {
      const similarPatterns = await this.repository.findSimilarPatterns(
        pattern.features,
        {
          similarityThreshold: this.config.similarityThreshold,
          maxResults: 20,
        }
      );

      // Filter out the original pattern
      const otherPatterns = similarPatterns.filter((p) => p.id !== pattern.id);

      if (otherPatterns.length === 0) {
        return;
      }

      this.healthMonitor.recordMetric("learning.similar_patterns.found", {
        originalId: pattern.id,
        count: otherPatterns.length,
      });

      let updatedCount = 0;

      for (const similarPattern of otherPatterns) {
        // Only update patterns of the same original type
        if (similarPattern.type !== pattern.type || !this.hasValidFeatures(similarPattern)) {
          continue;
        }

        const similarity = await this.vectorDb.calculateSimilarity(
          pattern.features,
          similarPattern.features
        );

        const adjustmentFactor = this.config.learningRate * similarity;
        const confidenceChange = feedback.correctedType !== similarPattern.type
          ? -adjustmentFactor
          : adjustmentFactor * 0.5;

        const newConfidence = Math.max(
          0.1,
          Math.min(0.9, similarPattern.confidence + confidenceChange)
        );

        const updates: Partial<AudioPattern> = {
          confidence: newConfidence,
        };

        if (
          feedback.correctedType !== similarPattern.type &&
          adjustmentFactor > 0.05
        ) {
          updates.type = feedback.correctedType;
        }

        await this.repository.updatePattern(similarPattern.id, updates);
        updatedCount++;
      }

      if (updatedCount > 0) {
        this.healthMonitor.recordMetric("learning.similar_patterns.updated", {
          originalId: pattern.id,
          count: updatedCount,
        });
      }
    } catch (error) {
      this.healthMonitor.recordMetric("learning.similar_patterns.error", {
        patternId: pattern.id,
        error: String(error),
      });
      console.error("Error updating similar patterns:", error);
    }
  }

  /**
   * Update statistics about pattern types to improve classification
   */
  private async updatePatternTypeStatistics(
    pattern: AudioPattern,
    feedback: PatternFeedback
  ): Promise<void> {
    try {
      const stats = await this.feedbackService.getPatternTypeStats(pattern.type);

      if (stats.totalFeedbackCount > this.config.minFeedbackThreshold) {
        const accuracy = stats.correctPatternCount / stats.totalFeedbackCount;

        if (accuracy < 0.5) {
          this.config.learningRate = Math.min(
            0.3,
            this.config.learningRate * 1.2
          );
        } else if (accuracy > 0.8) {
          this.config.learningRate = Math.max(
            0.05,
            this.config.learningRate * 0.9
          );
        }
      }

      this.healthMonitor.recordMetric("learning.type_stats.updated", {
        patternType: pattern.type,
        accuracy: stats.correctPatternCount / stats.totalFeedbackCount,
        learningRate: this.config.learningRate,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("learning.type_stats.error", {
        patternType: pattern.type,
        error: String(error),
      });
      console.error("Error updating pattern type statistics:", error);
    }
  }

  /**
   * Get learning metrics to track system improvement
   */
  async getLearningMetrics(): Promise<LearningMetrics> {
    try {
      const feedbackStats = await this.feedbackService.getFeedbackStats();
      const typeStats = await this.feedbackService.getPatternTypeStats();

      const typeAccuracy =
        typeStats.correctPatternCount / typeStats.totalFeedbackCount;

      const boundaryAccuracy =
        1 -
        (feedbackStats.timeRangeCorrectionCount +
          feedbackStats.frequencyRangeCorrectionCount) /
          (feedbackStats.totalFeedbackCount * 2);

      const improvementRate =
        feedbackStats.recentCorrectCount / feedbackStats.recentTotalCount -
        feedbackStats.historicalCorrectCount / feedbackStats.historicalTotalCount;

      return {
        totalFeedbackCount: feedbackStats.totalFeedbackCount,
        typeAccuracy,
        boundaryAccuracy,
        improvementRate,
        averageConfidence: feedbackStats.averageConfidence,
        learningCurve: feedbackStats.accuracyOverTime,
      };
    } catch (error) {
      this.healthMonitor.recordMetric("learning.metrics.error", {
        error: String(error),
      });
      throw error;
    }
  }
}
