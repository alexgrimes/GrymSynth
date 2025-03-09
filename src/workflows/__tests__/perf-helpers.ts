import { performance } from "perf_hooks";
import { PERFORMANCE_TEST_CONFIG, TEST_MOCK_DELAYS } from "./test-constants";

/**
 * Performance measurement statistics
 */
export interface PerfStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  samples: number[];
}

/**
 * Calculate statistics from an array of measurements
 */
export function calculateStats(measurements: number[]): PerfStats {
  const sorted = [...measurements].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance =
    sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    sorted.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    samples: measurements,
  };
}

/**
 * Run performance benchmark
 */
export async function benchmark<T>(
  operation: () => Promise<T>,
  iterations: number = PERFORMANCE_TEST_CONFIG.MEASUREMENT_ITERATIONS,
  warmupIterations: number = PERFORMANCE_TEST_CONFIG.WARM_UP_ITERATIONS
): Promise<PerfStats> {
  // Warm up
  for (let i = 0; i < warmupIterations; i++) {
    await operation();
    await delay(TEST_MOCK_DELAYS.FAST);
  }

  const measurements: number[] = [];

  // Actual measurements
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await operation();
    const end = performance.now();
    measurements.push(end - start);
    await delay(PERFORMANCE_TEST_CONFIG.ITERATION_DELAY);
  }

  return calculateStats(measurements);
}

/**
 * Check if performance meets threshold
 */
export function meetsPerformanceThreshold(
  stats: PerfStats,
  baselineStats: PerfStats,
  maxRegressionPercent: number = PERFORMANCE_TEST_CONFIG.REGRESSION_THRESHOLD
): boolean {
  const regressionThreshold =
    baselineStats.mean * (1 + maxRegressionPercent / 100);
  return stats.mean <= regressionThreshold;
}

/**
 * Format performance statistics as string
 */
export function formatPerfStats(stats: PerfStats): string {
  return `
Performance Stats:
  Mean: ${stats.mean.toFixed(2)}ms
  Median: ${stats.median.toFixed(2)}ms
  Std Dev: ${stats.stdDev.toFixed(2)}ms
  Min: ${stats.min.toFixed(2)}ms
  Max: ${stats.max.toFixed(2)}ms
  Samples: ${stats.samples.length}
`.trim();
}

/**
 * Measure memory usage during operation
 */
export async function measureMemoryUsage<T>(
  operation: () => Promise<T>
): Promise<{
  result: T;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  memoryDiff: Record<keyof NodeJS.MemoryUsage, number>;
}> {
  const memoryBefore = process.memoryUsage();
  const result = await operation();
  const memoryAfter = process.memoryUsage();

  const memoryDiff = {
    heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
    heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
    external: memoryAfter.external - memoryBefore.external,
    rss: memoryAfter.rss - memoryBefore.rss,
    arrayBuffers: memoryAfter.arrayBuffers - memoryBefore.arrayBuffers,
  };

  return { result, memoryBefore, memoryAfter, memoryDiff };
}

/**
 * Format memory usage as string
 */
export function formatMemoryUsage(memoryDiff: Record<string, number>): string {
  return Object.entries(memoryDiff)
    .map(([key, value]) => `${key}: ${formatBytes(value)}`)
    .join("\n");
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = Math.abs(bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${(bytes >= 0 ? "" : "-") + size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Delay helper
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run operation with timeout
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}
