/// <reference types="node" />
import type { PerformanceResult, PerformanceLimits, PerformanceOptions } from '../types/jest';
import '../matchers/jest-matchers';
/**
 * Measure performance of an operation
 */
export declare function measurePerformance(operation: () => Promise<void>, options?: PerformanceOptions): Promise<PerformanceResult>;
/**
 * Assert performance requirements
 */
export declare function assertPerformance(result: PerformanceResult, limits: PerformanceLimits, description?: string): void;
/**
 * Format a duration in milliseconds
 */
export declare function formatDuration(ms: number): string;
/**
 * Format memory size in bytes
 */
export declare function formatMemorySize(bytes: number): string;
/**
 * Calculate memory growth between two heap snapshots
 */
export declare function calculateMemoryGrowth(before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage): number;
/**
 * Format performance results for logging
 */
export declare function formatPerformanceResult(result: PerformanceResult, description?: string): string;
