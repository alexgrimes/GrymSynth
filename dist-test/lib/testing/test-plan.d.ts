import { TestResults } from './types';
/**
 * Manages test execution phases and orchestrates the testing process
 */
export declare class TestPlan {
    private testSuite;
    private metricsCollector;
    private phases;
    constructor();
    /**
     * Run all test phases
     */
    runAll(): Promise<TestResults[]>;
    /**
     * Clean up resources and stop metrics collection
     */
    cleanup(): Promise<void>;
    /**
     * Initialize test phase configurations
     */
    private initializePhases;
    /**
     * Run baseline performance phase
     */
    private runBaselinePhase;
    /**
     * Run cross-model interaction phase
     */
    private runCrossModelPhase;
    /**
     * Run load testing phase
     */
    private runLoadPhase;
    /**
     * Clean up test-specific resources
     */
    private cleanupTestResources;
    /**
     * Convert cross-model results to standard metrics format
     */
    private convertCrossModelMetrics;
    /**
     * Simulate load testing
     */
    private simulateLoad;
    /**
     * Simulate a single load test iteration
     */
    private simulateLoadIteration;
    /**
     * Validate baseline metrics against thresholds
     */
    private validateBaselineMetrics;
    /**
     * Validate cross-model metrics against thresholds
     */
    private validateCrossModelMetrics;
    /**
     * Validate load test metrics against thresholds
     */
    private validateLoadMetrics;
    /**
     * Create error result for failed phase
     */
    private createErrorResult;
}
