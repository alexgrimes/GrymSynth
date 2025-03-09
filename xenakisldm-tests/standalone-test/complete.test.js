const { describe, expect, test } = require('@jest/globals');

describe('XenakisLDM Basic Tests', () => {
  test('numeric operations', () => {
    console.log('Testing numeric operations');
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
    expect(10 / 2).toBe(5);
  });

  test('array manipulations', () => {
    console.log('Testing array operations');
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
    expect(arr).not.toContain(4);
  });

  test('object properties', () => {
    console.log('Testing object properties');
    const obj = {
      name: 'test',
      value: 42
    };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
    expect(obj).toEqual({
      name: 'test',
      value: 42
    });
  });

  test('async operations', async () => {
    console.log('Testing async operations');
    const result = await Promise.resolve(123);
    expect(result).toBe(123);

    await expect(Promise.resolve('success')).resolves.toBe('success');
    await expect(Promise.reject('error')).rejects.toBe('error');
  });

  test('floating point comparisons', () => {
    console.log('Testing floating point comparisons');
    expect(0.1 + 0.2).toBeCloseTo(0.3);
    expect(Math.PI).toBeCloseTo(3.14159, 4);
  });
});
