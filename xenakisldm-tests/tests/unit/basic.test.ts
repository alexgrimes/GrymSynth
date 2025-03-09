import { describe, expect, test } from '@jest/globals';

describe('Basic Test Suite', () => {
  test('basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });

  test('array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('number range checking', () => {
    const value = 5;
    expect(value).toBeWithinRange(0, 10);
  });

  test('mock audio buffer', () => {
    const buffer = {
      sampleRate: 44100,
      numberOfChannels: 2,
      duration: 1.0,
      length: 44100,
      getChannelData: (channel: number) => new Float32Array(44100)
    };

    expect(buffer).toHaveValidAudioFormat();
  });

  test('async operations', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  test('console mocking', () => {
    console.log('test message');
    expect(console.log).toHaveBeenCalledWith('test message');
  });
});
