#!/usr/bin/env node
interface TestResult {
    success: boolean;
    title: string;
    duration: number;
    error?: string;
}
interface TestReport {
    timestamp: string;
    totalTests: number;
    passed: number;
    failed: number;
    duration: number;
    results: TestResult[];
}
/**
 * Generate HTML test report
 */
declare function generateReport(report: TestReport): string;
/**
 * Process Jest JSON output
 */
declare function processJestOutput(jsonPath: string): TestReport;
export { generateReport, processJestOutput, TestResult, TestReport };
