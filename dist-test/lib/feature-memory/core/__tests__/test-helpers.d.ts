import { Pattern } from '../types';
export interface TestMetrics {
    average: number;
    p95: number;
    min: number;
    max: number;
    totalSamples: number;
}
export declare function warmupSystem(operation: () => Promise<any>, iterations?: number): Promise<void>;
export declare function calculateMetrics(samples: number[]): TestMetrics;
export declare function measureOperations<T>(operation: () => Promise<T>, count: number, concurrency?: number): Promise<number[]>;
export declare function generateLoad<T>(operation: () => Promise<T>, duration: number, concurrency: number): Promise<TestMetrics>;
export declare function createTestPattern(id: number): Pattern;
export declare function monitorMemory(): () => number;
export declare function sleep(ms: number): Promise<void>;
export declare function measureConcurrentOperations<T>(operations: (() => Promise<T>)[], batchSize: number): Promise<TestMetrics>;
export declare function verifySystemStability<T>(operation: () => Promise<T>, duration: number, samplingInterval?: number): Promise<boolean>;
