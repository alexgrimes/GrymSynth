const { run } = require('jest');

async function runTests() {
  try {
    console.log('Current directory:', process.cwd());
    console.log('Node version:', process.version);
    console.log('Running Jest programmatically...\n');

    const options = {
      projects: [process.cwd()],
      silent: false,
      verbose: true,
      runInBand: true,
      testMatch: ['**/audio-processing.test.js'],
      testEnvironment: 'node'
    };

    console.log('Jest options:', JSON.stringify(options, null, 2));

    const results = await run(['--runInBand', '--verbose', '--no-cache', 'audio-processing.test.js']);
    console.log('\nTest execution completed with exit code:', results);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

console.log('Starting test execution...');
runTests().catch(console.error);
