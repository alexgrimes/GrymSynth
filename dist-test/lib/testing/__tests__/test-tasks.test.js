"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_tasks_1 = require("../test-tasks");
const fs_1 = require("fs");
const path_1 = require("path");
describe('Test Tasks', () => {
    const testOutputPath = (0, path_1.resolve)(__dirname, '../test-output.json');
    const testReportPath = (0, path_1.resolve)(__dirname, '../test-report.html');
    // Sample test results
    const sampleOutput = {
        testResults: [
            {
                assertionResults: [
                    {
                        status: 'passed',
                        title: 'test 1',
                        duration: 100
                    },
                    {
                        status: 'failed',
                        title: 'test 2',
                        duration: 50,
                        failureMessages: ['Error occurred']
                    }
                ],
                startTime: 1000,
                endTime: 2000
            }
        ]
    };
    beforeEach(() => {
        // Clean up any existing files
        [testOutputPath, testReportPath].forEach(path => {
            if ((0, fs_1.existsSync)(path)) {
                (0, fs_1.unlinkSync)(path);
            }
        });
    });
    afterEach(() => {
        // Clean up test files
        [testOutputPath, testReportPath].forEach(path => {
            if ((0, fs_1.existsSync)(path)) {
                (0, fs_1.unlinkSync)(path);
            }
        });
    });
    describe('test task', () => {
        it('runs tests successfully', async () => {
            const result = await test_tasks_1.tasks.test();
            expect(result.success).toBeDefined();
            expect(typeof result.output).toBe('string');
        });
    });
    describe('coverage task', () => {
        it('runs coverage successfully', async () => {
            const result = await test_tasks_1.tasks.coverage();
            expect(result.success).toBeDefined();
            expect(typeof result.output).toBe('string');
        });
    });
    describe('verify task', () => {
        it('runs verification successfully', async () => {
            const result = await test_tasks_1.tasks.verify();
            expect(result.success).toBeDefined();
            expect(typeof result.output).toBe('string');
        });
    });
    describe('report task', () => {
        beforeEach(() => {
            // Create sample test output
            (0, fs_1.writeFileSync)(testOutputPath, JSON.stringify(sampleOutput));
        });
        it('generates report successfully', async () => {
            const result = await test_tasks_1.tasks.report();
            expect(result.success).toBe(true);
            expect(result.output).toContain('Report saved');
            expect((0, fs_1.existsSync)(testReportPath)).toBe(true);
        });
        it('handles missing test output', async () => {
            (0, fs_1.unlinkSync)(testOutputPath);
            const result = await test_tasks_1.tasks.report();
            expect(result.success).toBe(false);
            expect(result.output).toContain('Failed to generate report');
        });
    });
    describe('all task', () => {
        it('runs all tasks successfully', async () => {
            // Create sample test output for report generation
            (0, fs_1.writeFileSync)(testOutputPath, JSON.stringify(sampleOutput));
            const result = await test_tasks_1.tasks.all();
            expect(result.success).toBeDefined();
            expect(typeof result.output).toBe('string');
            expect(result.output).toContain('Task test');
            expect(result.output).toContain('Task coverage');
            expect(result.output).toContain('Task verify');
            expect(result.output).toContain('Task report');
        });
        it('handles task failures', async () => {
            // Remove test output to cause report task to fail
            if ((0, fs_1.existsSync)(testOutputPath)) {
                (0, fs_1.unlinkSync)(testOutputPath);
            }
            const result = await test_tasks_1.tasks.all();
            expect(result.success).toBe(false);
            expect(result.output).toContain('Failed');
        });
    });
    describe('task results', () => {
        it('formats successful results correctly', async () => {
            const result = {
                success: true,
                output: 'Test passed'
            };
            expect(result.success).toBe(true);
            expect(result.output).toBe('Test passed');
        });
        it('formats failed results correctly', async () => {
            const result = {
                success: false,
                output: 'Test failed: error occurred'
            };
            expect(result.success).toBe(false);
            expect(result.output).toContain('Test failed');
        });
    });
});
//# sourceMappingURL=test-tasks.test.js.map