const { execSync } = require('child_process');
const path = require('path');

// Test suite configuration
const testSuites = [
  {
    name: 'Basic Functionality Tests',
    path: 'tests/sanity.test.js'
  },
  {
    name: 'Unit Tests - Prompt Enhancement',
    path: 'tests/unit/prompt-enhancement.test.js'
  },
  {
    name: 'Unit Tests - AudioLDM Mock',
    path: 'tests/unit/audioldm-mock.test.js'
  },
  {
    name: 'Unit Tests - Post Processing',
    path: 'tests/unit/post-processing.test.js'
  },
  {
    name: 'Integration Tests - XenakisLDM Pipeline',
    path: 'tests/integration/xenakisldm-pipeline.test.js'
  }
];

console.log('Starting XenakisLDM Test Suite...\n');
console.log('Test Environment:', process.env.NODE_ENV || 'development');
console.log('Node Version:', process.version);
console.log('Working Directory:', process.cwd());
console.log('\n-------------------\n');

let failedTests = [];

// Run each test suite
testSuites.forEach(suite => {
  console.log(`\n=== Running ${suite.name} ===\n`);

  try {
    const command = `npx jest ${suite.path} --config=jest.config.js --verbose --runInBand`;
    console.log(`Executing: ${command}\n`);

    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'inherit'
    });

    console.log(`✓ ${suite.name} completed successfully\n`);
  } catch (error) {
    console.error(`✗ ${suite.name} failed:\n`);
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    failedTests.push(suite.name);
  }
});

// Generate coverage report if all tests pass
if (failedTests.length === 0) {
  console.log('\n=== Generating Coverage Report ===\n');
  try {
    execSync('npx jest --config=jest.config.js --coverage', {
      encoding: 'utf8',
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Coverage report generation failed:', error.message);
  }
}

// Report summary
console.log('\n=== Test Suite Summary ===\n');
console.log(`Total Test Suites: ${testSuites.length}`);
console.log(`Passed: ${testSuites.length - failedTests.length}`);
console.log(`Failed: ${failedTests.length}`);

if (failedTests.length > 0) {
  console.log('\nFailed Test Suites:');
  failedTests.forEach(name => console.log(`- ${name}`));
  process.exit(1);
} else {
  console.log('\n✓ All test suites passed successfully');
  process.exit(0);
}
