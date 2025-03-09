import { PerformanceMetrics, CrossModelResults } from './types';
export declare class PerformanceTestSuite {
    private metricsCollector;
    private memoryProfile;
    constructor();
    runBaseline(): Promise<PerformanceMetrics>;
    testCrossModelInteractions(): Promise<CrossModelResults>;
    private simulateModelSwitch;
}
