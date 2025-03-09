import { TestResults, TestReport } from './types';
export declare class TestRunner {
    private testPlan;
    private outputDir;
    constructor(outputDir: string);
    runTests(): Promise<{
        results: TestResults[];
        report: TestReport;
    }>;
    cleanup(): Promise<void>;
    private generateReport;
    private generateMetricResults;
    private generateRecommendations;
    private saveResults;
}
