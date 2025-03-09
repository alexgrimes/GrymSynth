const jest = require('jest');

async function runTest() {
  try {
    console.log('Starting test execution...');
    console.log('Working directory:', process.cwd());
    console.log('Node version:', process.version);

    const options = {
      projects: [process.cwd()],
      silent: false,
      verbose: true,
      testMatch: ['**/test.js'],
      maxWorkers: 1,
      testEnvironment: 'node'
    };

    console.log('Jest options:', JSON.stringify(options, null, 2));

    // Run Jest programmatically
    const result = await jest.runCLI(options, options.projects);

    console.log('Test Results:', JSON.stringify(result, null, 2));

    // Exit with appropriate code
    process.exit(result.results.success ? 0 : 1);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTest();
