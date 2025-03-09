#!/usr/bin/env node
interface TaskResult {
    success: boolean;
    output: string;
}
type TaskName = 'test' | 'coverage' | 'verify' | 'report' | 'all';
type TaskFunction = () => Promise<TaskResult>;
/**
 * Available test tasks
 */
declare const tasks: {
    /**
     * Run error handling tests
     */
    test(): Promise<TaskResult>;
    /**
     * Run tests with coverage
     */
    coverage(): Promise<TaskResult>;
    /**
     * Run verification tests
     */
    verify(): Promise<TaskResult>;
    /**
     * Generate test report
     */
    report(): Promise<TaskResult>;
    /**
     * Run all tasks
     */
    all(): Promise<TaskResult>;
};
export { tasks, TaskResult, TaskName, TaskFunction };
