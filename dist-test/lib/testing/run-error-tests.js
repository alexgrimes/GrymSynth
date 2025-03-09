#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_tests_1 = require("./run-tests");
/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        verbose: false,
        failFast: false
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--fail-fast':
            case '-f':
                options.failFast = true;
                break;
            case '--pattern':
            case '-p':
                options.pattern = args[++i];
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                console.error(`Unknown option: ${arg}`);
                printHelp();
                process.exit(1);
        }
    }
    return options;
}
/**
 * Print help message
 */
function printHelp() {
    console.log(`
Error Handling Test Runner

Options:
  -v, --verbose     Show detailed test output
  -f, --fail-fast   Stop on first failure
  -p, --pattern     Test name pattern to run
  -h, --help        Show this help message

Examples:
  # Run all tests
  $ ts-node run-error-tests.ts

  # Run tests with verbose output
  $ ts-node run-error-tests.ts --verbose

  # Run specific tests
  $ ts-node run-error-tests.ts --pattern "resource"

  # Run with fail-fast
  $ ts-node run-error-tests.ts --fail-fast
`);
}
/**
 * Main entry point
 */
async function main() {
    const options = parseArgs();
    console.log('Running error handling tests...\n');
    const startTime = Date.now();
    try {
        await (0, run_tests_1.runErrorTests)({
            verbose: options.verbose,
            failFast: options.failFast,
            pattern: options.pattern
        });
        const duration = (Date.now() - startTime) / 1000;
        console.log(`\nTests completed successfully in ${duration}s`);
        process.exit(0);
    }
    catch (error) {
        console.error('\nTest run failed:', error);
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=run-error-tests.js.map