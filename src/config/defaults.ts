/**
 * Default configuration values for the learning system
 */

export const DEFAULT_VECTOR_DIMENSIONS = 128;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.8;
export const DEFAULT_MAX_RELATIONSHIPS = 10;
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.5;
export const DEFAULT_MEMORY_CAPACITY = 100;
export const DEFAULT_LEARNING_RATE = 0.1;

export const DEFAULT_DECAY_PERIOD = 30; // days
export const DEFAULT_RECENCY_BIAS = 0.6;
export const DEFAULT_FREQUENCY_BIAS = 0.4;
export const DEFAULT_MIN_FEEDBACK_THRESHOLD = 3;
export const DEFAULT_FEEDBACK_RELEVANCE_PERIOD = 90; // days

export const DEFAULT_VECTOR_CONFIG = {
  dimensions: DEFAULT_VECTOR_DIMENSIONS,
  distanceMetric: "cosine" as const,
  persistIndexOnDisk: true,
};

export const DEFAULT_REPOSITORY_CONFIG = {
  vectorDimensions: DEFAULT_VECTOR_DIMENSIONS,
  similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
  maxQueryResults: DEFAULT_MEMORY_CAPACITY,
};

export const DEFAULT_RELATIONSHIP_CONFIG = {
  similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
  maxRelationshipsPerPattern: DEFAULT_MAX_RELATIONSHIPS,
  minConfidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
  enableAutoDiscovery: true,
};

export const DEFAULT_MEMORY_CONFIG = {
  maxActivePatterns: DEFAULT_MEMORY_CAPACITY,
  recencyBias: DEFAULT_RECENCY_BIAS,
  frequencyBias: DEFAULT_FREQUENCY_BIAS,
  memoryDecayPeriod: DEFAULT_DECAY_PERIOD,
};

export const DEFAULT_LEARNING_CONFIG = {
  learningRate: DEFAULT_LEARNING_RATE,
  minFeedbackThreshold: DEFAULT_MIN_FEEDBACK_THRESHOLD,
  similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
  feedbackRelevancePeriod: DEFAULT_FEEDBACK_RELEVANCE_PERIOD,
  enableAutoPropagation: true,
};
