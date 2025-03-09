 import {
  AudioPattern,
  PatternMetadata,
  PatternSimilarityOptions,
  FrequencyRange,
} from "../../types/audio";
import { PatternRepository } from "../storage/PatternRepository";
import { FeatureVectorDatabase } from "../storage/FeatureVectorDatabase";
import { HealthMonitor } from "../monitoring/HealthMonitor";

export interface ConfidenceModelParams {
  learningRate: number;
  featureWeights: number[];
  contextWeights: Record<string, number>;
  temporalDecay: number;
  minConfidence: number;
  maxConfidence: number;
}

/**
 * Service responsible for dynamically calculating and adjusting confidence scores
 * for pattern detection based on features, context, and historical performance.
 */
export class AdaptiveConfidenceModeler {
  private repository: PatternRepository;
  private vectorDb: FeatureVectorDatabase;
  private healthMonitor: HealthMonitor;
  private modelParams: ConfidenceModelParams;

  constructor(
    repository: PatternRepository,
    vectorDb: FeatureVectorDatabase,
    healthMonitor: HealthMonitor,
    initialParams?: Partial<ConfidenceModelParams>
  ) {
    this.repository = repository;
    this.vectorDb = vectorDb;
    this.healthMonitor = healthMonitor;

    // Initialize with default parameters
    this.modelParams = {
      learningRate: 0.05,
      featureWeights: Array(10).fill(1.0), // Assume 10 features initially
      contextWeights: {
        noiseLevel: 0.8,
        sampleRate: 0.6,
        timeOfDay: 0.4,
        deviceType: 0.5,
      },
      temporalDecay: 0.001, // Daily decay rate
      minConfidence: 0.1,
      maxConfidence: 0.95,
      ...initialParams,
    };
  }

  /**
   * Calculate confidence for a pattern based on its features and metadata
   */
  async calculateConfidence(pattern: AudioPattern): Promise<number> {
    try {
      // Get pattern metadata
      const metadata = await this.repository.getPatternMetadata(pattern.id);

      // Base confidence from feature analysis
      const featureConfidence = await this.calculateFeatureConfidence(pattern);

      // Context-based adjustments
      const contextConfidence = metadata
        ? this.calculateContextConfidence(metadata)
        : 1.0;

      // Historical performance factor
      const historicalFactor = await this.getHistoricalPerformanceFactor(pattern);

      // Combine factors with weights
      const combinedConfidence =
        featureConfidence * 0.5 +
        contextConfidence * 0.3 +
        historicalFactor * 0.2;

      // Apply bounds
      const finalConfidence = Math.max(
        this.modelParams.minConfidence,
        Math.min(this.modelParams.maxConfidence, combinedConfidence)
      );

      this.healthMonitor.recordMetric("confidence.calculation", {
        patternId: pattern.id,
        featureConfidence,
        contextConfidence,
        historicalFactor,
        finalConfidence,
      });

      return finalConfidence;
    } catch (error) {
      this.healthMonitor.recordMetric("confidence.calculation.error", {
        patternId: pattern.id,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Update model parameters based on feedback and performance
   */
  async updateModelParameters(
    updates: Partial<ConfidenceModelParams>
  ): Promise<void> {
    try {
      // Validate updates
      if (updates.learningRate !== undefined) {
        if (updates.learningRate < 0 || updates.learningRate > 1) {
          throw new Error("Learning rate must be between 0 and 1");
        }
        this.modelParams.learningRate = updates.learningRate;
      }

      if (updates.featureWeights) {
        // Normalize feature weights
        const sum = updates.featureWeights.reduce((a, b) => a + b, 0);
        this.modelParams.featureWeights = updates.featureWeights.map(
          (w) => w / sum
        );
      }

      if (updates.contextWeights) {
        this.modelParams.contextWeights = {
          ...this.modelParams.contextWeights,
          ...updates.contextWeights,
        };
      }

      if (updates.temporalDecay !== undefined) {
        if (updates.temporalDecay < 0 || updates.temporalDecay > 1) {
          throw new Error("Temporal decay must be between 0 and 1");
        }
        this.modelParams.temporalDecay = updates.temporalDecay;
      }

      // Update confidence bounds
      if (updates.minConfidence !== undefined) {
        this.modelParams.minConfidence = updates.minConfidence;
      }
      if (updates.maxConfidence !== undefined) {
        this.modelParams.maxConfidence = updates.maxConfidence;
      }

      this.healthMonitor.recordMetric("confidence.model.updated", {
        updates: Object.keys(updates).join(","),
      });
    } catch (error) {
      this.healthMonitor.recordMetric("confidence.model.update.error", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Learn optimal parameters from historical performance
   */
  async learnFromHistory(): Promise<void> {
    try {
      // Get patterns from last 30 days with high confidence
      const recentPatterns = await this.repository.queryPatterns({
        timeRange: {
          min: Date.now() - 30 * 24 * 60 * 60 * 1000,
          max: Date.now(),
        },
        confidenceThreshold: 0.7,
      });

      if (recentPatterns.length === 0) {
        return;
      }

      // Calculate feature importance scores
      const featureScores = await this.calculateFeatureImportance(recentPatterns);

      // Update feature weights
      const totalScore = featureScores.reduce((a, b) => a + b, 0);
      this.modelParams.featureWeights = featureScores.map(
        (score) => score / totalScore
      );

      // Update context weights based on correlation with accuracy
      await this.updateContextWeights(recentPatterns);

      this.healthMonitor.recordMetric("confidence.model.learned", {
        patternCount: recentPatterns.length,
        featureWeights: this.modelParams.featureWeights.join(","),
        contextWeights: JSON.stringify(this.modelParams.contextWeights),
      });
    } catch (error) {
      this.healthMonitor.recordMetric("confidence.model.learn.error", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Calculate confidence score based on pattern features
   */
  private async calculateFeatureConfidence(
    pattern: AudioPattern
  ): Promise<number> {
    if (!pattern.features || pattern.features.length === 0) {
      return this.modelParams.minConfidence;
    }

    // Find similar patterns
    const similarPatterns = await this.repository.findSimilarPatterns(
      pattern.features,
      {
        similarityThreshold: 0.8,
        maxResults: 10,
      }
    );

    if (similarPatterns.length === 0) {
      return this.modelParams.minConfidence;
    }

    // Calculate average confidence of similar patterns
    const avgConfidence =
      similarPatterns.reduce((sum, p) => sum + p.confidence, 0) /
      similarPatterns.length;

    // Calculate feature vector similarity scores
    const similarities = await Promise.all(
      similarPatterns
        .filter((p) => p.features !== undefined)
        .map((p) =>
          this.vectorDb.calculateSimilarity(pattern.features!, p.features!)
        )
    );

    if (similarities.length === 0) {
      return avgConfidence;
    }

    // Weight confidence by similarity
    const weightedConfidence =
      similarities.reduce(
        (sum, sim, i) => sum + sim * similarPatterns[i].confidence,
        0
      ) / similarities.reduce((sum, sim) => sum + sim, 0);

    return (avgConfidence + weightedConfidence) / 2;
  }

  /**
   * Calculate confidence adjustment based on context
   */
  private calculateContextConfidence(metadata: PatternMetadata): number {
    if (!metadata.customProperties) {
      return 1.0; // Neutral adjustment if no context
    }

    let contextScore = 0;
    let totalWeight = 0;

    // Apply weighted scoring for each context factor
    for (const [factor, weight] of Object.entries(
      this.modelParams.contextWeights
    )) {
      const value = metadata.customProperties[factor];
      if (value !== undefined) {
        contextScore += this.getContextFactorScore(factor, value) * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? contextScore / totalWeight : 1.0;
  }

  /**
   * Get confidence adjustment factor based on historical performance
   */
  private async getHistoricalPerformanceFactor(
    pattern: AudioPattern
  ): Promise<number> {
    // Query patterns of the same type
    const typeStats = await this.repository.queryPatterns({
      type: pattern.type,
      confidenceThreshold: 0.7,
    });

    if (typeStats.length === 0) {
      return 1.0; // Neutral factor if no history
    }

    // Calculate accuracy from high confidence patterns
    const accuracyFactor =
      typeStats.filter((p) => p.confidence > 0.8).length / typeStats.length;

    // Get pattern metadata for age calculation
    const metadata = await this.repository.getPatternMetadata(pattern.id);
    if (!metadata) {
      return accuracyFactor;
    }

    // Apply temporal decay to older patterns
    const ageInDays =
      (Date.now() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.exp(-this.modelParams.temporalDecay * ageInDays);

    return accuracyFactor * decayFactor;
  }

  /**
   * Calculate importance scores for each feature
   */
  private async calculateFeatureImportance(
    patterns: AudioPattern[]
  ): Promise<number[]> {
    const validPatterns = patterns.filter(
      (p): p is AudioPattern & { features: number[] } => p.features !== undefined
    );

    if (validPatterns.length === 0) {
      return this.modelParams.featureWeights;
    }

    const featureCount = validPatterns[0].features.length;
    const scores = new Array(featureCount).fill(0);

    // Calculate correlation between each feature and pattern accuracy
    for (let i = 0; i < featureCount; i++) {
      const featureValues = validPatterns.map((p) => p.features[i]);
      const accuracyValues = validPatterns.map((p) => p.confidence);
      scores[i] = Math.abs(this.calculateCorrelation(featureValues, accuracyValues));
    }

    return scores;
  }

  /**
   * Update context weights based on pattern performance
   */
  private async updateContextWeights(patterns: AudioPattern[]): Promise<void> {
    const metadataList = await Promise.all(
      patterns.map((p) => this.repository.getPatternMetadata(p.id))
    );

    const validPairs = patterns.filter((_, i) => metadataList[i] !== null);
    const validMetadata = metadataList.filter(
      (m): m is PatternMetadata => m !== null
    );

    // Group patterns by context factors
    for (const factor of Object.keys(this.modelParams.contextWeights)) {
      const factorGroups = new Map<any, { correct: number; total: number }>();

      for (let i = 0; i < validPairs.length; i++) {
        const pattern = validPairs[i];
        const metadata = validMetadata[i];

        if (!metadata.customProperties?.[factor]) {
          continue;
        }

        const value = metadata.customProperties[factor];
        const group = factorGroups.get(value) || { correct: 0, total: 0 };
        group.total++;
        if (pattern.confidence > 0.7) {
          group.correct++;
        }
        factorGroups.set(value, group);
      }

      // Calculate predictive power of this factor
      let totalAccuracy = 0;
      let groupCount = 0;
      for (const group of factorGroups.values()) {
        if (group.total > 5) {
          totalAccuracy += group.correct / group.total;
          groupCount++;
        }
      }

      if (groupCount > 0) {
        this.modelParams.contextWeights[factor] = totalAccuracy / groupCount;
      }
    }
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_x2 = 0;
    let sum_y2 = 0;

    for (let i = 0; i < n; i++) {
      sum_x += x[i];
      sum_y += y[i];
      sum_xy += x[i] * y[i];
      sum_x2 += x[i] * x[i];
      sum_y2 += y[i] * y[i];
    }

    const denominator = Math.sqrt(
      (n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)
    );

    if (denominator === 0) return 0;

    return (n * sum_xy - sum_x * sum_y) / denominator;
  }

  private getContextFactorScore(factor: string, value: any): number {
    switch (factor) {
      case "noiseLevel":
        // Higher noise level = lower confidence
        return 1 - Math.min(1, Math.max(0, value / 100));

      case "sampleRate":
        // Higher sample rate = higher confidence up to optimal rate
        const optimalRate = 44100;
        return Math.min(1, value / optimalRate);

      case "timeOfDay":
        // Neutral scoring for time of day
        return 1.0;

      case "deviceType":
        // Could implement device-specific scoring based on known reliability
        return 1.0;

      default:
        return 1.0;
    }
  }
}
