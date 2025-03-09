const { test, expect } = require('@jest/globals');

test('minimal test', () => {
  console.log('Running minimal test');
  expect(1).toBe(1);
});
