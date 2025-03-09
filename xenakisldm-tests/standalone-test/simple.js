const jest = require('jest');
const { test, expect } = require('@jest/globals');

// Write test result to file for verification
const fs = require('fs');
const path = require('path');

console.log('Test script starting...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Define a simple test
test('basic test', () => {
  console.log('Running test');
  expect(true).toBe(true);
  expect(1 + 1).toBe(2);
});

// Run the test
jest.run(['--verbose'])
  .then(success => {
    console.log('Test completed:', success ? 'SUCCESS' : 'FAILURE');
    fs.writeFileSync('test-result.txt', `Test completed: ${success ? 'SUCCESS' : 'FAILURE'}`);
  })
  .catch(error => {
    console.error('Test error:', error);
    fs.writeFileSync('test-result.txt', `Test error: ${error.message}`);
  });
