import {
  AudioPattern,
  PatternRelationship,
  RelationshipType,
} from "../../types/audio";
import { PatternRepository } from "../storage/PatternRepository";
import { FeatureVectorDatabase } from "../storage/FeatureVectorDatabase";
import { HealthMonitor } from "../monitoring/HealthMonitor";

/**
 * Configuration for the relationship tracker
 */
export interface RelationshipTrackerConfig {
  // Similarity threshold for considering patterns related
  similarityThreshold: number;

  // How many related patterns to track per pattern
  maxRelationshipsPerPattern: number;

  // Minimum confidence for considering patterns in relationships
  minConfidenceThreshold: number;

  // Whether to automatically discover relationships
  enableAutoDiscovery: boolean;
}

/**
 * Service for tracking and managing relationships between audio patterns
 */
export class PatternRelationshipTracker {
  private repository: PatternRepository;
  private vectorDb: FeatureVectorDatabase;
  private healthMonitor: HealthMonitor;
  private config: RelationshipTrackerConfig;

  // Helper function to check if pattern has valid features
  private hasValidFeatures(
    pattern: AudioPattern
  ): pattern is AudioPattern & { features: number[] } {
    return Array.isArray(pattern.features) && pattern.features.length > 0;
  }

  // In-memory cache of recent relationships
  private relationshipCache: Map<string, Set<string>> = new Map();

  constructor(
    repository: PatternRepository,
    vectorDb: FeatureVectorDatabase,
    healthMonitor: HealthMonitor,
    config?: Partial<RelationshipTrackerConfig>
  ) {
    this.repository = repository;
    this.vectorDb = vectorDb;
    this.healthMonitor = healthMonitor;

    // Default configuration
    this.config = {
      similarityThreshold: 0.8,
      maxRelationshipsPerPattern: 10,
      minConfidenceThreshold: 0.5,
      enableAutoDiscovery: true,
      ...config,
    };
  }

  /**
   * Create a relationship between two patterns
   */
  async createRelationship(
    sourcePatternId: string,
    targetPatternId: string,
    type: RelationshipType,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Verify patterns exist
      const [sourcePattern, targetPattern] = await Promise.all([
        this.repository.getPatternById(sourcePatternId),
        this.repository.getPatternById(targetPatternId),
      ]);

      if (!sourcePattern || !targetPattern) {
        throw new Error("Source or target pattern not found");
      }

      // Calculate confidence based on pattern similarity if we have features
      let confidence = 0.8; // Default confidence

      if (
        this.hasValidFeatures(sourcePattern) &&
        this.hasValidFeatures(targetPattern)
      ) {
        confidence = await this.vectorDb.calculateSimilarity(
          sourcePattern.features,
          targetPattern.features
        );
      }

      // Create relationship object
      const relationship: PatternRelationship = {
        id: crypto.randomUUID(),
        sourcePatternId,
        targetPatternId,
        type,
        confidence,
        metadata: {
          ...metadata,
          sourceType: sourcePattern.type,
          targetType: targetPattern.type,
          createdAt: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store relationship
      await this.storeRelationship(relationship);

      // Update cache
      this.updateCache(relationship);

      this.healthMonitor.recordMetric("relationship.created", {
        sourceId: sourcePatternId,
        targetId: targetPatternId,
        type,
        confidence,
      });

      return relationship.id;
    } catch (error) {
      this.healthMonitor.recordMetric("relationship.create_error", {
        sourceId: sourcePatternId,
        targetId: targetPatternId,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Discover relationships between a pattern and others in the repository
   */
  async discoverRelationships(
    patternId: string
  ): Promise<PatternRelationship[]> {
    try {
      const pattern = await this.repository.getPatternById(patternId);
      if (!pattern || !pattern.features || pattern.features.length === 0) {
        throw new Error("Pattern not found or has no features");
      }

      // Find similar patterns
      const similarPatterns = await this.repository.findSimilarPatterns(
        pattern.features,
        {
          similarityThreshold: this.config.similarityThreshold,
          maxResults: this.config.maxRelationshipsPerPattern,
        }
      );

      // Filter out the original pattern
      const otherPatterns = similarPatterns.filter((p) => p.id !== patternId);

      const relationships: PatternRelationship[] = [];

      // Create relationships with each similar pattern
      for (const similarPattern of otherPatterns) {
        // Determine relationship type based on patterns
        let relationshipType = this.determineRelationshipType(
          pattern,
          similarPattern
        );

        // Calculate similarity if both patterns have valid features
        let similarity = this.config.similarityThreshold;
        if (
          this.hasValidFeatures(pattern) &&
          this.hasValidFeatures(similarPattern)
        ) {
          similarity = await this.vectorDb.calculateSimilarity(
            pattern.features,
            similarPattern.features
          );
        }

        if (similarity >= this.config.similarityThreshold) {
          const relationship = {
            id: crypto.randomUUID(),
            sourcePatternId: patternId,
            targetPatternId: similarPattern.id,
            type: relationshipType,
            confidence: similarity,
            metadata: {
              sourceType: pattern.type,
              targetType: similarPattern.type,
              similarity,
              discoveredAt: new Date().toISOString(),
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await this.storeRelationship(relationship);
          this.updateCache(relationship);
          relationships.push(relationship);
        }
      }

      this.healthMonitor.recordMetric("relationships.discovered", {
        patternId,
        count: relationships.length,
      });

      return relationships;
    } catch (error) {
      this.healthMonitor.recordMetric("relationships.discovery_error", {
        patternId,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Get all relationships for a pattern
   */
  async getRelationshipsForPattern(
    patternId: string
  ): Promise<PatternRelationship[]> {
    try {
      // Check cache first
      const cachedRelationshipIds = this.relationshipCache.get(patternId);

      if (cachedRelationshipIds) {
        const relationships = await Promise.all(
          Array.from(cachedRelationshipIds).map((id) =>
            this.getRelationshipById(id)
          )
        );

        return relationships.filter(
          (r): r is PatternRelationship => r !== null
        );
      }

      // If not in cache, load from storage
      return this.loadRelationshipsForPattern(patternId);
    } catch (error) {
      this.healthMonitor.recordMetric("relationships.get_error", {
        patternId,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Find patterns related to a pattern by specific relationship type
   */
  async findRelatedPatterns(
    patternId: string,
    type?: RelationshipType
  ): Promise<AudioPattern[]> {
    try {
      const relationships = await this.getRelationshipsForPattern(patternId);

      // Filter by type if specified
      const filteredRelationships = type
        ? relationships.filter((r) => r.type === type)
        : relationships;

      // Get related pattern IDs
      const relatedPatternIds = filteredRelationships.map((r) =>
        r.sourcePatternId === patternId ? r.targetPatternId : r.sourcePatternId
      );

      // Get patterns
      const patterns = await Promise.all(
        relatedPatternIds.map((id) => this.repository.getPatternById(id))
      );

      return patterns.filter((p): p is AudioPattern => p !== null);
    } catch (error) {
      this.healthMonitor.recordMetric("relationships.find_related_error", {
        patternId,
        type,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Determine the type of relationship between two patterns
   */
  private determineRelationshipType(
    pattern1: AudioPattern,
    pattern2: AudioPattern
  ): RelationshipType {
    // Same type patterns
    if (pattern1.type === pattern2.type) {
      return RelationshipType.SAME_TYPE;
    }

    // Check for temporal overlap
    if (this.patternsOverlap(pattern1, pattern2)) {
      return RelationshipType.OVERLAPPING;
    }

    // Check for sequential patterns
    if (this.patternsAreSequential(pattern1, pattern2)) {
      return RelationshipType.SEQUENTIAL;
    }

    // Default to similar
    return RelationshipType.SIMILAR;
  }

  /**
   * Check if two patterns overlap in time
   */
  private patternsOverlap(p1: AudioPattern, p2: AudioPattern): boolean {
    return p1.startTime <= p2.endTime && p1.endTime >= p2.startTime;
  }

  /**
   * Check if two patterns are sequential
   */
  private patternsAreSequential(p1: AudioPattern, p2: AudioPattern): boolean {
    const gap = Math.abs(p1.endTime - p2.startTime);
    return gap < 0.1; // 100ms threshold for sequential patterns
  }

  /**
   * Store a relationship in persistent storage
   */
  private async storeRelationship(
    relationship: PatternRelationship
  ): Promise<void> {
    // Implementation would store in database
    // Mock implementation for now
  }

  /**
   * Get a relationship by ID from storage
   */
  private async getRelationshipById(
    id: string
  ): Promise<PatternRelationship | null> {
    // Implementation would load from database
    // Mock implementation returns null
    return null;
  }

  /**
   * Load all relationships for a pattern from storage
   */
  private async loadRelationshipsForPattern(
    patternId: string
  ): Promise<PatternRelationship[]> {
    // Implementation would load from database
    // Mock implementation returns empty array
    return [];
  }

  /**
   * Update the relationship cache
   */
  private updateCache(relationship: PatternRelationship): void {
    // Add to source pattern's relationships
    let sourceRelationships = this.relationshipCache.get(
      relationship.sourcePatternId
    );
    if (!sourceRelationships) {
      sourceRelationships = new Set();
      this.relationshipCache.set(
        relationship.sourcePatternId,
        sourceRelationships
      );
    }
    sourceRelationships.add(relationship.id);

    // Add to target pattern's relationships
    let targetRelationships = this.relationshipCache.get(
      relationship.targetPatternId
    );
    if (!targetRelationships) {
      targetRelationships = new Set();
      this.relationshipCache.set(
        relationship.targetPatternId,
        targetRelationships
      );
    }
    targetRelationships.add(relationship.id);

    // Prune cache if needed
    this.pruneCache();
  }

  /**
   * Prune the relationship cache to prevent unbounded growth
   */
  private pruneCache(): void {
    const maxCacheSize = 1000; // Maximum number of patterns to cache relationships for

    if (this.relationshipCache.size > maxCacheSize) {
      // Remove oldest entries
      const entriesToRemove = Array.from(this.relationshipCache.keys()).slice(
        0,
        this.relationshipCache.size - maxCacheSize
      );

      for (const key of entriesToRemove) {
        this.relationshipCache.delete(key);
      }
    }
  }
}
