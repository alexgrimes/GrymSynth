// Export core learning system components
export {
  createLearningSystem,
  LearningSystemConfig,
} from "./services/learning";

// Export core services
export { PatternLearningService } from "./services/learning/PatternLearningService";
export { PatternRelationshipTracker } from "./services/learning/PatternRelationshipTracker";
export { ContextualMemorySystem } from "./services/memory/ContextualMemorySystem";
export { FeatureVectorDatabase } from "./services/storage/FeatureVectorDatabase";
export { PatternRepository } from "./services/storage/PatternRepository";
export { HealthMonitor } from "./services/monitoring/HealthMonitor";

// Export test configuration
export { TEST_LEARNING_CONFIG } from "./services/learning/config";

// Export types
export {
  AudioPattern,
  PatternRelationship,
  RelationshipType,
  PatternContext,
  PatternFeedback,
  FeedbackStats,
  PatternMetadata,
  MemorySearchParams,
  PatternTypeStats,
  FrequencyRange,
  PatternSimilarityOptions,
} from "./types/audio";

// Export utility types and interfaces
export {
  LearningConfig,
  RelationshipTrackerConfig,
  ContextualMemoryConfig,
  PatternRepositoryConfig,
  VectorDatabaseConfig,
} from "./services/learning";

// Export test utilities separately to avoid inclusion in production builds
export { default as testUtils } from "./utils/test-utils";

// Export combined configurations
export * from "./config/defaults";
