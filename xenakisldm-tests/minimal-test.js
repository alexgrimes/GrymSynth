const { describe, expect, test } = require('@jest/globals');

describe('Minimal Test Suite', () => {
  console.log('Running minimal test suite');

  test('basic test', () => {
    console.log('Running basic test');
    expect(true).toBe(true);
  });

  test('simple math', () => {
    console.log('Running math test');
    expect(1 + 1).toBe(2);
  });
});
