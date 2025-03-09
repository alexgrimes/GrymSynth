import { HealthState } from './health';
export interface Test {
    name: string;
    run: () => Promise<void>;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    timeout?: number;
}
export interface TestSuite {
    name: string;
    tests: Test[];
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
}
export interface TestResult {
    name: string;
    success: boolean;
    duration: number;
    error?: Error;
    skipped?: boolean;
    health: HealthState;
}
export interface TestRunner {
    runSuite(suite: TestSuite): Promise<TestResult[]>;
}
export interface TestConfig {
    timeout: number;
    retries: number;
    parallel: boolean;
    bail: boolean;
}
export declare function createDefaultTestConfig(): TestConfig;
export declare function isTestResult(result: unknown): result is TestResult;
