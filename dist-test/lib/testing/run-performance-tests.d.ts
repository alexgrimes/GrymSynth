import { TestResults, TestReport } from './types';
/**
 * Run performance tests and handle results
 */
export declare function runPerformanceTests(outputDir?: string): Promise<{
    success: boolean;
    results: TestResults[];
    report: TestReport;
}>;
