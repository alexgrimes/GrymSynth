#!/usr/bin/env node
"use strict";
/**
 * Test runner for error handling tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = require("path");
const TESTS_DIR = (0, path_1.resolve)(__dirname, '__tests__');
const TEST_TIMEOUT = 30000;
/**
 * Run error handling tests
 */
function runTests(options = {}) {
    const { verbose, pattern, watch } = options;
    // Build Jest command
    const args = [
        'jest',
        '--config',
        (0, path_1.resolve)(__dirname, '../../../jest.config.js'),
        '--testTimeout',
        TEST_TIMEOUT.toString()
    ];
    // Add options
    if (verbose) {
        args.push('--verbose');
    }
    if (watch) {
        args.push('--watch');
    }
    if (pattern) {
        args.push('--testNamePattern', pattern);
    }
    // Add test files
    args.push((0, path_1.resolve)(TESTS_DIR, 'error-handling.test.ts'));
    // Run tests
    console.log('\nRunning error handling tests...\n');
    const result = (0, child_process_1.spawnSync)('npx', args, {
        stdio: 'inherit',
        shell: true
    });
    // Handle result
    if (result.status === 0) {
        console.log('\nAll tests passed!\n');
        process.exit(0);
    }
    else {
        console.error('\nTests failed!\n');
        process.exit(1);
    }
}
// Parse command line args
const args = process.argv.slice(2);
const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    watch: args.includes('--watch') || args.includes('-w')
};
// Get test pattern
const patternIndex = args.indexOf('--pattern');
if (patternIndex !== -1 && args[patternIndex + 1]) {
    options.pattern = args[patternIndex + 1];
}
// Run tests
runTests(options);
//# sourceMappingURL=run.js.map