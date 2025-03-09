/**
 * Common test configuration constants
 */

export const TEST_TIMEOUTS = {
  /** Default timeout for individual tests */
  DEFAULT: 5000,

  /** Timeout for complex workflow tests */
  WORKFLOW: 10000,

  /** Timeout for performance tests */
  PERFORMANCE: 30000,

  /** Time to wait between retries */
  RETRY_DELAY: 100,

  /** Maximum wait time for workflow completion */
  WORKFLOW_COMPLETION: 15000,
} as const;

export const TEST_THRESHOLDS = {
  /** Maximum acceptable memory growth in bytes */
  MAX_MEMORY_GROWTH: 50 * 1024 * 1024, // 50MB

  /** Maximum time for batch processing (ms) */
  MAX_BATCH_TIME: 5000,

  /** Maximum variance in performance tests */
  MAX_PERFORMANCE_VARIANCE: 0.5, // 50%

  /** Minimum throughput (ops/sec) */
  MIN_THROUGHPUT: 10,
} as const;

export const TEST_BATCH_SIZES = {
  /** Small batch size for basic tests */
  SMALL: 5,

  /** Medium batch size for load tests */
  MEDIUM: 20,

  /** Large batch size for stress tests */
  LARGE: 50,
} as const;

export const TEST_WORKFLOW_SIZES = {
  /** Small workflow (few steps) */
  SMALL: 3,

  /** Medium workflow */
  MEDIUM: 10,

  /** Large workflow for stress testing */
  LARGE: 25,
} as const;

export const TEST_FILE_PATHS = {
  /** Directory for test audio files */
  AUDIO_FILES: "./test-data/audio",

  /** Directory for test results */
  RESULTS: "./test-results",

  /** Directory for mock data */
  MOCK_DATA: "./mock-data",

  /** Directory for temporary files */
  TEMP: "./temp",
} as const;

export const TEST_WORKFLOW_TEMPLATES = {
  /** Basic single-step workflow */
  BASIC: "basic-workflow",

  /** Linear workflow with multiple steps */
  LINEAR: "linear-workflow",

  /** Branching workflow with conditions */
  BRANCHING: "branching-workflow",

  /** Complex workflow with all features */
  COMPLEX: "complex-workflow",
} as const;

export const TEST_ERROR_SCENARIOS = {
  /** Simulated network error */
  NETWORK_ERROR: "network-error",

  /** Simulated timeout */
  TIMEOUT: "timeout",

  /** Invalid input data */
  INVALID_INPUT: "invalid-input",

  /** Resource not found */
  NOT_FOUND: "not-found",

  /** Permission denied */
  PERMISSION_DENIED: "permission-denied",
} as const;

export const TEST_MOCK_DELAYS = {
  /** Fast response (ms) */
  FAST: 10,

  /** Normal response (ms) */
  NORMAL: 100,

  /** Slow response (ms) */
  SLOW: 500,

  /** Very slow response (ms) */
  VERY_SLOW: 1000,
} as const;

export const TEST_RETRY_CONFIG = {
  /** Maximum number of retries */
  MAX_RETRIES: 3,

  /** Base delay between retries (ms) */
  BASE_DELAY: 100,

  /** Maximum delay between retries (ms) */
  MAX_DELAY: 1000,

  /** Delay multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
} as const;

// Performance test configurations
export const PERFORMANCE_TEST_CONFIG = {
  /** Number of warm-up iterations */
  WARM_UP_ITERATIONS: 2,

  /** Number of measurement iterations */
  MEASUREMENT_ITERATIONS: 5,

  /** Time between iterations (ms) */
  ITERATION_DELAY: 100,

  /** Acceptable performance regression (%) */
  REGRESSION_THRESHOLD: 20,
} as const;
