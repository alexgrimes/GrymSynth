interface TestMetrics {
    timestamp: string;
    duration: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
    };
    performance: {
        avgTestDuration: number;
        slowestTests: Array<{
            name: string;
            duration: number;
        }>;
        memoryUsage: number;
    };
}
interface TestHistory {
    lastRun?: TestMetrics;
    history: TestMetrics[];
    trends: {
        passRate: number[];
        duration: number[];
        coverage: number[];
    };
}
/**
 * Collects and analyzes test metrics
 */
export declare class TestMetricsCollector {
    private readonly metricsPath;
    private history;
    constructor();
    /**
     * Record metrics from a test run
     */
    recordMetrics(metrics: TestMetrics): Promise<void>;
    /**
     * Get test run summary
     */
    getRunSummary(): TestMetrics;
    /**
     * Get performance trends
     */
    getTrends(): TestHistory['trends'];
    /**
     * Get performance alerts
     */
    getAlerts(): string[];
    /**
     * Generate metrics report
     */
    generateReport(): string;
    private loadHistory;
    private saveHistory;
    private updateTrends;
    private getAverageDuration;
    private formatTrend;
}
export {};
