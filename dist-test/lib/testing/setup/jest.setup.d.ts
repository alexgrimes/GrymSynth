import type { PerformanceResult, PerformanceLimits, PerformanceOptions } from '../types/jest';
import '../matchers/performance';
/**
 * Measure performance of an operation
 */
export declare function measurePerformance(operation: () => Promise<void>, options?: PerformanceOptions): Promise<PerformanceResult>;
/**
 * Assert performance requirements
 */
export declare function assertPerformance(result: PerformanceResult, limits: PerformanceLimits, description?: string): void;
