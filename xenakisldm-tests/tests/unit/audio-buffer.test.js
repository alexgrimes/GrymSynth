const { describe, expect, test } = require('@jest/globals');

class TestAudioBuffer {
  constructor({ numberOfChannels, length, sampleRate }) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.data = Array(numberOfChannels)
      .fill(null)
      .map(() => new Float32Array(length));
  }

  get duration() {
    return this.length / this.sampleRate;
  }

  getChannelData(channel) {
    if (channel >= this.numberOfChannels) {
      throw new Error('Channel index out of bounds');
    }
    return this.data[channel];
  }

  fillWithSineWave(frequency, amplitude = 1.0) {
    for (let channel = 0; channel < this.numberOfChannels; channel++) {
      const channelData = this.data[channel];
      for (let i = 0; i < this.length; i++) {
        const t = i / this.sampleRate;
        channelData[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
      }
    }
  }
}

describe('Audio Buffer Tests', () => {
  test('creates valid audio buffer', () => {
    console.log('Running audio buffer creation test');
    const buffer = new TestAudioBuffer({
      numberOfChannels: 2,
      length: 44100,
      sampleRate: 44100
    });

    expect(buffer).toBeDefined();
    expect(typeof buffer.sampleRate).toBe('number');
    expect(typeof buffer.duration).toBe('number');
    expect(buffer.duration).toBe(1); // 1 second
    expect(buffer.numberOfChannels).toBe(2);
    expect(buffer.getChannelData(0)).toBeInstanceOf(Float32Array);
  });

  test('generates sine wave correctly', () => {
    console.log('Running sine wave generation test');
    const buffer = new TestAudioBuffer({
      numberOfChannels: 1,
      length: 44100,
      sampleRate: 44100
    });

    buffer.fillWithSineWave(440); // 440 Hz = A4 note
    const data = buffer.getChannelData(0);

    // Test first few samples
    expect(data[0]).toBeCloseTo(0, 5); // sin(0) = 0
    expect(Math.abs(data[11025])).toBeLessThanOrEqual(1); // Quarter period
    expect(Math.abs(data[22050])).toBeLessThanOrEqual(0.1); // Half period

    // Test peak amplitude
    let maxAmplitude = 0;
    for (let i = 0; i < 100; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
    }
    expect(maxAmplitude).toBeGreaterThanOrEqual(0.9);
    expect(maxAmplitude).toBeLessThanOrEqual(1.0);
  });

  test('throws on invalid channel access', () => {
    console.log('Running channel access test');
    const buffer = new TestAudioBuffer({
      numberOfChannels: 1,
      length: 1000,
      sampleRate: 44100
    });

    expect(() => buffer.getChannelData(1)).toThrow('Channel index out of bounds');
  });

  test('maintains consistent buffer state', () => {
    console.log('Running buffer state consistency test');
    const buffer = new TestAudioBuffer({
      numberOfChannels: 2,
      length: 44100,
      sampleRate: 44100
    });

    buffer.fillWithSineWave(440);
    const channel0 = buffer.getChannelData(0);
    const channel1 = buffer.getChannelData(1);

    // Check that channels are identical
    let maxDiff = 0;
    for (let i = 0; i < 100; i++) {
      maxDiff = Math.max(maxDiff, Math.abs(channel0[i] - channel1[i]));
    }
    expect(maxDiff).toBe(0);
  });
});
