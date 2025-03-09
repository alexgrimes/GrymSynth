const { describe, expect, test } = require('@jest/globals');

describe('Basic Test Suite', () => {
  test('should perform basic arithmetic', () => {
    console.log('Running basic arithmetic test');
    expect(1 + 1).toBe(2);
  });

  test('should work with arrays', () => {
    console.log('Running array test');
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('should handle async operations', async () => {
    console.log('Running async test');
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
