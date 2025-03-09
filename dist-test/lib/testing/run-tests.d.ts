import { TestRunner, TestSuite, TestResult } from './types/test';
export declare class TestExecutor implements TestRunner {
    private currentContext;
    constructor();
    runSuite(suite: TestSuite): Promise<TestResult[]>;
    private isHealthyToRun;
    private updateHealthMetrics;
    private handleTestFailure;
    private handleSuiteFailure;
}
export declare function runTests(suite: TestSuite): Promise<TestResult[]>;
