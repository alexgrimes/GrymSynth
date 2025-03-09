const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Print diagnostic information
  console.log('Current directory:', process.cwd());
  console.log('Node version:', process.version);
  console.log('Files in directory:', fs.readdirSync('.').join(', '));
  console.log('\nAttempting to run test...\n');

  // Run Jest directly as a child process
  const result = execSync('npx jest very-basic.test.js --verbose', {
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  console.log('\nTest execution completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Error running tests:', error);
  console.error('Error details:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout);
  if (error.stderr) console.error('stderr:', error.stderr);
  process.exit(1);
}
