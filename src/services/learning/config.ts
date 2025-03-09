import { LearningSystemConfig } from "./";

/**
 * Default configuration for the learning system
 */
export const DEFAULT_LEARNING_CONFIG: LearningSystemConfig = {
  vectorDb: {
    indexPath: "./data/vectors",
    dimensions: 128,
    distanceMetric: "cosine",
    persistIndexOnDisk: true,
  },
  repository: {
    vectorDimensions: 128,
    similarityThreshold: 0.8,
    maxQueryResults: 100,
  },
  relationships: {
    similarityThreshold: 0.8,
    maxRelationshipsPerPattern: 10,
    minConfidenceThreshold: 0.5,
    enableAutoDiscovery: true,
  },
  memory: {
    maxActivePatterns: 100,
    recencyBias: 0.6,
    frequencyBias: 0.4,
    memoryDecayPeriod: 30,
  },
  learning: {
    learningRate: 0.1,
    minFeedbackThreshold: 3,
    similarityThreshold: 0.85,
    feedbackRelevancePeriod: 90,
    enableAutoPropagation: true,
  },
};

/**
 * Test configuration for the learning system
 */
export const TEST_LEARNING_CONFIG: LearningSystemConfig = {
  vectorDb: {
    indexPath: "./test-data/vectors",
    dimensions: 128,
    distanceMetric: "cosine",
    persistIndexOnDisk: false,
  },
  repository: {
    vectorDimensions: 128,
    similarityThreshold: 0.8,
    maxQueryResults: 10,
  },
  relationships: {
    similarityThreshold: 0.8,
    maxRelationshipsPerPattern: 5,
    minConfidenceThreshold: 0.5,
    enableAutoDiscovery: true,
  },
  memory: {
    maxActivePatterns: 50,
    recencyBias: 0.6,
    frequencyBias: 0.4,
    memoryDecayPeriod: 30,
  },
  learning: {
    learningRate: 0.1,
    minFeedbackThreshold: 3,
    similarityThreshold: 0.85,
    feedbackRelevancePeriod: 90,
    enableAutoPropagation: true,
  },
};

/**
 * Create a configuration with custom overrides
 */
export function createConfig(
  overrides: Partial<LearningSystemConfig>,
  base: LearningSystemConfig = DEFAULT_LEARNING_CONFIG
): LearningSystemConfig {
  return {
    ...base,
    ...overrides,
    vectorDb: { ...base.vectorDb, ...overrides.vectorDb },
    repository: { ...base.repository, ...overrides.repository },
    relationships: { ...base.relationships, ...overrides.relationships },
    memory: { ...base.memory, ...overrides.memory },
    learning: { ...base.learning, ...overrides.learning },
  };
}
