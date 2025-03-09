import { FeatureMemorySystem } from '../feature-memory-system';
import { Pattern } from '../types';
export interface PerformanceTestConfig {
    operation: () => Promise<any>;
    samples: number;
    targetAvg: number;
    targetP95: number;
    warmupSamples?: number;
    cooldownMs?: number;
}
export interface ConcurrentTestConfig {
    operation: () => Promise<any>;
    concurrentOps: number;
    targetAvg: number;
    batchSize?: number;
    cooldownMs?: number;
}
export interface PerformanceResults {
    avgLatency: number;
    p95Latency: number;
    minLatency: number;
    maxLatency: number;
    samples: number;
    failures: number;
    failureRate: number;
    memoryDelta: number;
    recentLatencies: number[];
    errorTypes: Map<string, number>;
    throughput: number;
    duration: number;
}
type JestExpect = {
    toBeLessThan: (n: number) => void;
    toBeLessThanOrEqual: (n: number) => void;
    toBeGreaterThan: (n: number) => void;
    toBeGreaterThanOrEqual: (n: number) => void;
    toBe: (value: any) => void;
};
export declare function createTestPattern(id: number): Pattern;
export declare function warmupSystem(system: FeatureMemorySystem): Promise<void>;
export declare function runPerformanceTest(config: PerformanceTestConfig): Promise<PerformanceResults>;
export declare function runConcurrentTest(config: ConcurrentTestConfig): Promise<PerformanceResults>;
export declare function formatResults(results: PerformanceResults): string;
export declare function verifyResults(results: PerformanceResults, config: Pick<PerformanceTestConfig, 'targetAvg' | 'targetP95'>, jestExpect: (actual: number) => JestExpect): void;
export {};
