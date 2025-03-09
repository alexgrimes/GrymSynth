import {
  AudioPattern,
  PatternSimilarityOptions,
  PatternMetadata,
} from "../../types/audio";
import { FeatureVectorDatabase } from "./FeatureVectorDatabase";
import { HealthMonitor } from "../monitoring/HealthMonitor";

/**
 * Configuration options for the Pattern Repository
 */
export interface PatternRepositoryConfig {
  // Dimensions of feature vectors
  vectorDimensions: number;

  // Threshold for pattern similarity matching
  similarityThreshold: number;

  // Maximum number of results to return from queries
  maxQueryResults: number;
}

/**
 * Repository for storing and querying audio patterns
 */
export class PatternRepository {
  private vectorDb: FeatureVectorDatabase;
  private healthMonitor: HealthMonitor;
  private config: PatternRepositoryConfig;

  // In-memory storage (would be replaced with real database in production)
  private patterns: Map<string, AudioPattern> = new Map();
  private metadata: Map<string, PatternMetadata> = new Map();

  constructor(
    vectorDb: FeatureVectorDatabase,
    healthMonitor: HealthMonitor,
    config: PatternRepositoryConfig
  ) {
    this.vectorDb = vectorDb;
    this.healthMonitor = healthMonitor;
    this.config = config;
  }

  /**
   * Initialize the repository
   */
  async initialize(): Promise<void> {
    try {
      await this.vectorDb.initialize();

      this.healthMonitor.recordMetric("repository.initialized", {
        vectorDimensions: this.config.vectorDimensions,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("repository.init_error", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Store a pattern and its metadata
   */
  async storePattern(
    pattern: AudioPattern,
    metadata: PatternMetadata
  ): Promise<void> {
    try {
      // Store pattern
      this.patterns.set(pattern.id, pattern);

      // Store metadata
      this.metadata.set(pattern.id, metadata);

      // Update vector index if pattern has features
      if (pattern.features && pattern.features.length > 0) {
        await this.vectorDb.upsertVector(pattern.id, pattern.features);
      }

      this.healthMonitor.recordMetric("repository.pattern.stored", {
        patternId: pattern.id,
        patternType: pattern.type,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("repository.pattern.store_error", {
        patternId: pattern.id,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Get a pattern by ID
   */
  async getPatternById(id: string): Promise<AudioPattern | null> {
    return this.patterns.get(id) || null;
  }

  /**
   * Get pattern metadata by ID
   */
  async getPatternMetadata(id: string): Promise<PatternMetadata | null> {
    return this.metadata.get(id) || null;
  }

  /**
   * Update an existing pattern
   */
  async updatePattern(
    id: string,
    updates: Partial<AudioPattern>
  ): Promise<void> {
    try {
      const pattern = await this.getPatternById(id);
      if (!pattern) {
        throw new Error(`Pattern not found: ${id}`);
      }

      // Apply updates
      Object.assign(pattern, updates);

      // Update storage
      this.patterns.set(id, pattern);

      // Update vector index if features changed
      if (updates.features && pattern.features) {
        await this.vectorDb.upsertVector(id, pattern.features);
      }

      // Update metadata
      const metadata = await this.getPatternMetadata(id);
      if (metadata) {
        metadata.lastModified = new Date();
        this.metadata.set(id, metadata);
      }

      this.healthMonitor.recordMetric("repository.pattern.updated", {
        patternId: id,
        updates: Object.keys(updates).join(","),
      });
    } catch (error) {
      this.healthMonitor.recordMetric("repository.pattern.update_error", {
        patternId: id,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Find patterns similar to a feature vector
   */
  async findSimilarPatterns(
    features: number[],
    options: PatternSimilarityOptions
  ): Promise<AudioPattern[]> {
    try {
      // Find similar vectors
      const similarVectors = await this.vectorDb.findSimilarVectors(
        features,
        options.similarityThreshold,
        options.maxResults
      );

      // Get patterns for the similar vectors
      const patterns = await Promise.all(
        similarVectors.map(async ({ id }) => this.getPatternById(id))
      );

      // Filter out nulls and sort by confidence
      const validPatterns = patterns
        .filter((p): p is AudioPattern => p !== null)
        .sort((a, b) => b.confidence - a.confidence);

      this.healthMonitor.recordMetric("repository.similar_patterns.found", {
        count: validPatterns.length,
      });

      return validPatterns;
    } catch (error) {
      this.healthMonitor.recordMetric("repository.similar_patterns.error", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Query patterns based on criteria
   */
  async queryPatterns(query: {
    type?: string;
    sourceId?: string;
    sessionId?: string;
    userId?: string;
    tags?: string[];
    timeRange?: { min: number; max: number };
    frequencyRange?: { min: number; max: number };
    confidenceThreshold?: number;
    limit?: number;
  }): Promise<AudioPattern[]> {
    try {
      // Get all patterns that match the criteria
      const matches = Array.from(this.patterns.values()).filter((pattern) => {
        // Check type
        if (query.type && pattern.type !== query.type) {
          return false;
        }

        // Check confidence
        if (
          query.confidenceThreshold &&
          pattern.confidence < query.confidenceThreshold
        ) {
          return false;
        }

        // Check time range
        if (query.timeRange) {
          const { min, max } = query.timeRange;
          if (pattern.startTime < min || pattern.endTime > max) {
            return false;
          }
        }

        // Check frequency range
        if (query.frequencyRange) {
          const { min, max } = query.frequencyRange;
          if (
            pattern.frequencyRange.low < min ||
            pattern.frequencyRange.high > max
          ) {
            return false;
          }
        }

        // Check metadata
        const metadata = this.metadata.get(pattern.id);
        if (metadata) {
          if (query.sourceId && metadata.sourceId !== query.sourceId) {
            return false;
          }

          if (query.sessionId && metadata.sessionId !== query.sessionId) {
            return false;
          }

          if (query.userId && metadata.userId !== query.userId) {
            return false;
          }

          if (query.tags && query.tags.length > 0) {
            if (
              !metadata.tags ||
              !query.tags.every((tag) => metadata.tags?.includes(tag))
            ) {
              return false;
            }
          }
        }

        return true;
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Apply limit
      const limit = query.limit || this.config.maxQueryResults;
      const results = matches.slice(0, limit);

      this.healthMonitor.recordMetric("repository.patterns.queried", {
        matchCount: matches.length,
        returnedCount: results.length,
      });

      return results;
    } catch (error) {
      this.healthMonitor.recordMetric("repository.patterns.query_error", {
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a pattern
   */
  async deletePattern(id: string): Promise<void> {
    try {
      this.patterns.delete(id);
      this.metadata.delete(id);

      this.healthMonitor.recordMetric("repository.pattern.deleted", {
        patternId: id,
      });
    } catch (error) {
      this.healthMonitor.recordMetric("repository.pattern.delete_error", {
        patternId: id,
        error: String(error),
      });
      throw error;
    }
  }
}
