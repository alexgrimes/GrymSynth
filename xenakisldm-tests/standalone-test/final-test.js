const { test, expect, beforeAll, afterAll } = require('@jest/globals');

// Global test setup
beforeAll(() => {
  console.log('Test setup starting...');
  console.log('Node version:', process.version);
  console.log('Current directory:', process.cwd());
});

// Basic test
test('simple addition works', () => {
  console.log('Running addition test');
  expect(1 + 1).toBe(2);
});

// Float32Array test
test('Float32Array operations work', () => {
  console.log('Running Float32Array test');
  const arr = new Float32Array(3);
  arr[0] = 1.0;
  arr[1] = 2.0;
  arr[2] = 3.0;

  expect(arr.length).toBe(3);
  expect(arr[0]).toBe(1.0);
});

// Clean up
afterAll(() => {
  console.log('Tests completed');
});
