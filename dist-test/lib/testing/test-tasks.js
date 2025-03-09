#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasks = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const generate_report_1 = require("./generate-report");
/**
 * Run a command and capture output
 */
function runCommand(command, args) {
    const result = (0, child_process_1.spawnSync)(command, args, {
        stdio: 'pipe',
        encoding: 'utf-8',
        shell: true
    });
    return {
        success: result.status === 0,
        output: result.stdout || result.stderr || ''
    };
}
/**
 * Available test tasks
 */
const tasks = {
    /**
     * Run error handling tests
     */
    async test() {
        console.log('\nRunning error handling tests...');
        return runCommand('npm', ['run', 'test:error']);
    },
    /**
     * Run tests with coverage
     */
    async coverage() {
        console.log('\nRunning tests with coverage...');
        return runCommand('npm', ['run', 'test:error', '--', '--coverage']);
    },
    /**
     * Run verification tests
     */
    async verify() {
        console.log('\nRunning verification tests...');
        return runCommand('npm', ['run', 'test:error', '--', '--testMatch', '**/verification.test.ts']);
    },
    /**
     * Generate test report
     */
    async report() {
        console.log('\nGenerating test report...');
        // Run tests with JSON output
        const jsonPath = (0, path_1.resolve)(__dirname, 'test-output.json');
        const testResult = runCommand('npm', [
            'run',
            'test:error',
            '--',
            '--json',
            `--outputFile=${jsonPath}`
        ]);
        if (!testResult.success) {
            return testResult;
        }
        try {
            // Generate HTML report
            const htmlPath = (0, path_1.resolve)(__dirname, 'test-report.html');
            const reportData = (0, generate_report_1.processJestOutput)(jsonPath);
            const html = (0, generate_report_1.generateReport)(reportData);
            console.log(`Report generated: ${htmlPath}`);
            return { success: true, output: `Report saved to ${htmlPath}` };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                output: `Failed to generate report: ${errorMessage}`
            };
        }
    },
    /**
     * Run all tasks
     */
    async all() {
        const results = [];
        const taskEntries = Object.entries(tasks);
        for (const [name, task] of taskEntries) {
            if (name !== 'all') {
                console.log(`\nRunning task: ${name}`);
                results.push(await task());
            }
        }
        const success = results.every(r => r.success);
        const output = results
            .map((r, i) => `Task ${Object.keys(tasks)[i]}: ${r.success ? 'Success' : 'Failed'}`)
            .join('\n');
        return { success, output };
    }
};
exports.tasks = tasks;
// Run tasks if called directly
if (require.main === module) {
    const taskName = process.argv[2] || 'test';
    if (!Object.prototype.hasOwnProperty.call(tasks, taskName)) {
        console.error(`Unknown task: ${taskName}`);
        console.log('Available tasks:', Object.keys(tasks).join(', '));
        process.exit(1);
    }
    tasks[taskName]().then((result) => {
        if (!result.success) {
            console.error('Task failed:', result.output);
            process.exit(1);
        }
        console.log(result.output);
    }).catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Task failed:', errorMessage);
        process.exit(1);
    });
}
//# sourceMappingURL=test-tasks.js.map