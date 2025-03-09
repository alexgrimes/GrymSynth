const { describe, expect, test } = require('@jest/globals');

describe('Basic Test Suite', () => {
  test('simple addition', () => {
    console.log('Running addition test');
    expect(1 + 1).toBe(2);
  });

  test('array operations', () => {
    console.log('Running array test');
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
  });

  test('async operation', async () => {
    console.log('Running async test');
    const data = await Promise.resolve('test');
    expect(data).toBe('test');
  });
});
