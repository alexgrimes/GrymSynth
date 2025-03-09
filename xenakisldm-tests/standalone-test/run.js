const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting test execution...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Run the test script as a child process
const testProcess = spawn('node', [
  '--trace-warnings',
  '--unhandled-rejections=strict',
  path.join(process.cwd(), 'standalone.js')
], {
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'test' }
});

// Collect output
let stdout = '';
let stderr = '';

testProcess.stdout.on('data', (data) => {
  const output = data.toString();
  stdout += output;
  process.stdout.write(output);
});

testProcess.stderr.on('data', (data) => {
  const output = data.toString();
  stderr += output;
  process.stderr.write(output);
});

// Handle process completion
testProcess.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);

  // Write complete output to file
  const results = {
    exitCode: code,
    stdout,
    stderr,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  };

  fs.writeFileSync('run-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults written to run-results.json');

  // Exit with the same code as the test process
  process.exit(code);
});
