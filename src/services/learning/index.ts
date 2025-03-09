import {
  PatternLearningService,
  LearningConfig,
} from "./PatternLearningService";

import {
  PatternRelationshipTracker,
  RelationshipTrackerConfig,
} from "./PatternRelationshipTracker";

import {
  ContextualMemorySystem,
  ContextualMemoryConfig,
} from "../memory/ContextualMemorySystem";

import {
  PatternRepository,
  PatternRepositoryConfig,
} from "../storage/PatternRepository";

import {
  FeatureVectorDatabase,
  VectorDatabaseConfig,
} from "../storage/FeatureVectorDatabase";

import { HealthMonitor } from "../monitoring/HealthMonitor";

export {
  PatternLearningService,
  LearningConfig,
  PatternRelationshipTracker,
  RelationshipTrackerConfig,
  ContextualMemorySystem,
  ContextualMemoryConfig,
  PatternRepository,
  PatternRepositoryConfig,
  FeatureVectorDatabase,
  VectorDatabaseConfig,
};

/**
 * Unified configuration interface for the learning system
 */
export interface LearningSystemConfig {
  learning: Partial<LearningConfig>;
  relationships: Partial<RelationshipTrackerConfig>;
  memory: Required<ContextualMemoryConfig>;
  repository: PatternRepositoryConfig;
  vectorDb: VectorDatabaseConfig;
}

/**
 * Factory function to create a complete learning system
 */
export async function createLearningSystem(
  config: LearningSystemConfig,
  healthMonitor: HealthMonitor
): Promise<{
  learningService: PatternLearningService;
  relationshipTracker: PatternRelationshipTracker;
  memorySystem: ContextualMemorySystem;
  repository: PatternRepository;
  vectorDb: FeatureVectorDatabase;
}> {
  // Create vector database
  const vectorDb = new FeatureVectorDatabase(config.vectorDb, healthMonitor);
  await vectorDb.initialize();

  // Create pattern repository
  const repository = new PatternRepository(
    vectorDb,
    healthMonitor,
    config.repository
  );
  await repository.initialize();

  // Create relationship tracker
  const relationshipTracker = new PatternRelationshipTracker(
    repository,
    vectorDb,
    healthMonitor,
    config.relationships
  );

  // Create memory system
  const memorySystem = new ContextualMemorySystem(
    repository,
    vectorDb,
    relationshipTracker,
    healthMonitor,
    config.memory
  );

  // Create learning service
  const learningService = new PatternLearningService(
    repository,
    /* Assuming PatternFeedbackService is provided elsewhere */
    {} as any, // TODO: Add proper feedback service initialization
    vectorDb,
    healthMonitor,
    config.learning
  );

  return {
    learningService,
    relationshipTracker,
    memorySystem,
    repository,
    vectorDb,
  };
}
