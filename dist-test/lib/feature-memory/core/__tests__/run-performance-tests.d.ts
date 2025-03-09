interface TestResult {
    name: string;
    metrics: {
        averageLatency: number;
        p95Latency: number;
        operationsPerSecond: number;
        errorRate: number;
        memoryUsageMB: number;
    };
    success: boolean;
    timestamp: string;
}
declare function runPerformanceTest(): Promise<TestResult[]>;
export { runPerformanceTest };
