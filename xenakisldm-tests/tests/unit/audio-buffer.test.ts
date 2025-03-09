/**
 * @jest-environment node
 */

import { describe, expect, test } from '@jest/globals';

interface AudioBufferParams {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
}

class TestAudioBuffer {
  private data: Float32Array[];
  public readonly length: number;
  public readonly numberOfChannels: number;
  public readonly sampleRate: number;

  constructor({ numberOfChannels, length, sampleRate }: AudioBufferParams) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.data = Array(numberOfChannels)
      .fill(null)
      .map(() => new Float32Array(length));
  }

  get duration(): number {
    return this.length / this.sampleRate;
  }

  getChannelData(channel: number): Float32Array {
    if (channel >= this.numberOfChannels) {
      throw new Error('Channel index out of bounds');
    }
    return this.data[channel];
  }

  fillWithSineWave(frequency: number, amplitude: number = 1.0): void {
    for (let channel = 0; channel < this.numberOfChannels; channel++) {
      const channelData = this.data[channel];
      for (let i = 0; i < this.length; i++) {
        const t = i / this.sampleRate;
        channelData[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
      }
    }
  }
}

// @ts-ignore
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidAudioFormat(): R;
    }
  }
}

describe('Audio Buffer Tests', () => {
  test('should create valid audio buffer', () => {
    const buffer = new TestAudioBuffer({
      numberOfChannels: 2,
      length: 44100,
      sampleRate: 44100
    });

    // @ts-ignore
    expect(buffer).toHaveValidAudioFormat();
    expect(buffer.duration).toBe(1); // 1 second
    expect(buffer.numberOfChannels).toBe(2);
  });

  test('should handle sine wave generation', () => {
    const buffer = new TestAudioBuffer({
      numberOfChannels: 1,
      length: 44100,
      sampleRate: 44100
    });

    buffer.fillWithSineWave(440); // 440 Hz = A4 note
    const data = buffer.getChannelData(0);

    // Test first few samples
    expect(data[0]).toBeCloseTo(0, 5); // sin(0) = 0
    // @ts-ignore
    expect(data[11025]).toBeWithinRange(-1, 1); // Quarter period
    // @ts-ignore
    expect(data[22050]).toBeWithinRange(-0.1, 0.1); // Half period

    // Test peak amplitude
    let maxAmplitude = 0;
    for (let i = 0; i < 100; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
    }
    // @ts-ignore
    expect(maxAmplitude).toBeWithinRange(0.9, 1.0);
  });

  test('should throw on invalid channel access', () => {
    const buffer = new TestAudioBuffer({
      numberOfChannels: 1,
      length: 1000,
      sampleRate: 44100
    });

    expect(() => buffer.getChannelData(1)).toThrow('Channel index out of bounds');
  });

  test('should maintain consistent buffer state', () => {
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
