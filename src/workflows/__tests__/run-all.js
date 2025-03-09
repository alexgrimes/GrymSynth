#!/usr/bin/env node

const { spawn } = require('child_process');
const cleanupTestResources = require('./cleanup');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test configuration
const config = {
  testTimeout: 30000,
  concurrentTests: process.env.CI ? 1 : 4,
  coverageThreshold: 80,
  testFiles: [
    'workflow-system.test.ts',
    'workflow-error-handling.test.ts',
    'workflow-performance.test.ts'
  ]
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTests() {
  const startTime = Date.now();
  log('\nStarting workflow system tests...', 'blue');

  try {
    // Run cleanup first to ensure clean state
    log('\nCleaning up previous test artifacts...', 'yellow');
    await cleanupTestResources();

    // Run TypeScript compilation check
    log('\nChecking TypeScript compilation...', 'yellow');
    await runCommand('tsc', ['--noEmit']);

    // Run tests with coverage
    log('\nRunning tests...', 'yellow');
    await runCommand('jest', [
      '--config=./jest.config.js',
      '--coverage',
      '--runInBand',
      `--testTimeout=${config.testTimeout}`,
      '--verbose',
      ...config.testFiles
    ]);

    // Run final cleanup
    log('\nRunning final cleanup...', 'yellow');
    await cleanupTestResources();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n✓ All tests completed successfully in ${duration}s`, 'green');

    return 0;
  } catch (error) {
    log('\n✗ Test run failed:', 'red');
    log(error.message, 'red');

    // Still try to clean up
    try {
      log('\nAttempting cleanup after failure...', 'yellow');
      await cleanupTestResources();
    } catch (cleanupError) {
      log('Cleanup after failure failed:', 'red');
      log(cleanupError.message, 'red');
    }

    return 1;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = runTests;