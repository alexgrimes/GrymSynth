import { TestReport } from './types';
declare class BrowserTestRunner {
    private environment;
    constructor();
    private detectEnvironment;
    runTests(): Promise<TestReport>;
    private createTestResult;
    private transformMetrics;
    private createEmptyMetrics;
    private aggregateMetrics;
}
export declare const testRunner: BrowserTestRunner;
declare global {
    interface Window {
        testRunner: BrowserTestRunner;
    }
}
export {};
