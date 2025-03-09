/**
 * Test helpers and mock data for Feature Memory System tests
 */
export interface MockPattern {
    id: string;
    features: Map<string, any>;
    confidence: number;
    timestamp: Date;
    metadata: {
        source: string;
        category: string;
        frequency: number;
        lastUpdated: Date;
    };
}
/**
 * Create a mock pattern with default values
 */
export declare function createMockPattern(overrides?: Partial<MockPattern>): MockPattern;
/**
 * Create multiple mock patterns
 */
export declare function createMockPatterns(count: number): MockPattern[];
/**
 * Mock performance measurement utilities
 */
export declare class PerformanceMonitor {
    private startTime;
    private measurements;
    constructor();
    start(): void;
    measure(operation: string): number;
    getAverageTime(operation: string): number;
    getMaxTime(operation: string): number;
    reset(): void;
}
/**
 * Mock memory usage utilities
 */
export declare class MemoryMonitor {
    private initialMemory;
    private measurements;
    constructor();
    measure(): number;
    getPeakMemory(): number;
    getAverageMemory(): number;
    reset(): void;
}
/**
 * Mock error tracking utilities
 */
export declare class ErrorTracker {
    private errors;
    private operationCount;
    trackOperation(success?: boolean, error?: Error): void;
    getErrorRate(): number;
    getErrorCount(): number;
    getOperationCount(): number;
    reset(): void;
}
/**
 * Test utilities for async operations
 */
export declare const waitFor: (ms: number) => Promise<void>;
export declare const runWithTimeout: <T>(promise: Promise<T>, timeoutMs: number) => Promise<T>;
