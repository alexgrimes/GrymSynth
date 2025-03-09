import { rimraf } from "rimraf";
import { mkdir } from "fs/promises";
import { TEST_LEARNING_CONFIG } from "../config";
import { HealthMonitor } from "../../monitoring/HealthMonitor";

// Define a simple performance interface for testing
interface SimplePerformance {
  now(): number;
}

// Mock the health monitor to avoid logging during tests
jest.mock("../../monitoring/HealthMonitor", () => {
  return {
    HealthMonitor: jest.fn().mockImplementation(() => ({
      recordMetric: jest.fn(),
      startTimer: jest.fn(),
      endTimer: jest.fn(),
      recordError: jest.fn(),
      recordStateChange: jest.fn(),
    })),
  };
});

// Create test directories before running tests
beforeAll(async () => {
  // Clean and recreate test vector directory
  await rimraf(TEST_LEARNING_CONFIG.vectorDb.indexPath);
  await mkdir(TEST_LEARNING_CONFIG.vectorDb.indexPath, { recursive: true });
});

// Cleanup test directories after all tests
afterAll(async () => {
  await rimraf(TEST_LEARNING_CONFIG.vectorDb.indexPath);
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Helper function to generate random features
export function generateRandomFeatures(dimensions: number): number[] {
  return Array(dimensions)
    .fill(0)
    .map(() => Math.random());
}

// Helper function to generate test pattern
export function createTestPattern(
  id: string,
  startTime: number = 0,
  features?: number[]
) {
  return {
    id,
    type: "test",
    startTime,
    endTime: startTime + 1,
    frequencyRange: { low: 100, high: 1000 },
    confidence: 0.8,
    features:
      features ||
      generateRandomFeatures(TEST_LEARNING_CONFIG.vectorDb.dimensions),
  };
}

// Helper function to wait for a specified time
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to measure operation time
export async function measureTime<T>(
  operation: () => Promise<T>
): Promise<[T, number]> {
  const startTime = getPerformanceNow();
  const result = await operation();
  const duration = getPerformanceNow() - startTime;
  return [result, duration];
}

// Helper function to check if duration is within expected range
export function isWithinRange(
  duration: number,
  target: number,
  tolerancePercent: number = 20
): boolean {
  const tolerance = target * (tolerancePercent / 100);
  return duration >= target - tolerance && duration <= target + tolerance;
}

// Helper function to create similar features with controlled variation
export function createSimilarFeatures(
  baseFeatures: number[],
  variationAmount: number = 0.1
): number[] {
  return baseFeatures.map(
    (f) => f + (Math.random() * variationAmount - variationAmount / 2)
  );
}

// Helper function to get performance.now() with fallback
function getPerformanceNow(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

// Initialize performance API if needed
if (typeof performance === "undefined") {
  (global as any).performance = {
    now: getPerformanceNow,
  };
}
