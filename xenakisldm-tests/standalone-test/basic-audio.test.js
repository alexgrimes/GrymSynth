const { describe, expect, test, beforeEach } = require('@jest/globals');

describe('Basic Audio Tests', () => {
  test('basic math test - sanity check', () => {
    console.log('Running basic math test');
    expect(1 + 1).toBe(2);
  });

  test('array test - sanity check', () => {
    console.log('Running array test');
    const arr = new Float32Array([1, 2, 3]);
    expect(arr.length).toBe(3);
  });

  test('audio-like object creation', () => {
    console.log('Testing audio object creation');
    const audioData = {
      sampleRate: 44100,
      duration: 1,
      numberOfChannels: 2,
      getChannelData: () => new Float32Array(44100)
    };

    expect(audioData.sampleRate).toBe(44100);
    expect(audioData.numberOfChannels).toBe(2);
    expect(audioData.getChannelData()).toBeInstanceOf(Float32Array);
  });

  test('sine wave generation', () => {
    console.log('Testing sine wave generation');
    const sampleRate = 44100;
    const frequency = 440; // A4 note
    const duration = 1; // 1 second
    const samples = new Float32Array(sampleRate * duration);

    // Generate sine wave
    for (let i = 0; i < samples.length; i++) {
      const t = i / sampleRate;
      samples[i] = Math.sin(2 * Math.PI * frequency * t);
    }

    // Test first few samples
    expect(samples[0]).toBeCloseTo(0);
    expect(Math.abs(samples[Math.floor(sampleRate/4)])).toBeCloseTo(1, 1);
  });
});
