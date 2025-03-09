const { describe, expect, test } = require('@jest/globals');

// Mock AudioBuffer implementation
class MockAudioBuffer {
  constructor(numberOfChannels, length, sampleRate) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this._data = Array(numberOfChannels).fill().map(() => new Float32Array(length));
  }

  getChannelData(channel) {
    if (channel >= this.numberOfChannels) throw new Error('Invalid channel index');
    return this._data[channel];
  }
}

// Audio processing functions
function applyStochasticTransform(buffer, params) {
  const { amplitude = 1.0, frequency = 440 } = params;
  const output = new MockAudioBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = output.getChannelData(channel);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / buffer.sampleRate;
      outputData[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
    }
  }

  return output;
}

// Test suite
describe('XenakisLDM Audio Processing', () => {
  let testBuffer;

  beforeEach(() => {
    // Create a new test buffer before each test
    testBuffer = new MockAudioBuffer(2, 44100, 44100);
  });

  test('creates valid audio buffer', () => {
    expect(testBuffer.numberOfChannels).toBe(2);
    expect(testBuffer.length).toBe(44100);
    expect(testBuffer.sampleRate).toBe(44100);
    expect(testBuffer.duration).toBe(1); // 1 second

    const channelData = testBuffer.getChannelData(0);
    expect(channelData).toBeInstanceOf(Float32Array);
    expect(channelData.length).toBe(44100);
  });

  test('applies stochastic transform', () => {
    const params = {
      amplitude: 0.5,
      frequency: 440 // A4 note
    };

    const processed = applyStochasticTransform(testBuffer, params);
    const data = processed.getChannelData(0);

    // Test signal properties
    expect(processed.length).toBe(testBuffer.length);
    expect(processed.numberOfChannels).toBe(testBuffer.numberOfChannels);

    // Test signal bounds
    let maxAmplitude = 0;
    for (let i = 0; i < 100; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(data[i]));
    }
    expect(maxAmplitude).toBeCloseTo(params.amplitude, 1);
  });

  test('handles invalid channel access', () => {
    expect(() => {
      testBuffer.getChannelData(2);
    }).toThrow('Invalid channel index');
  });

  test('processes multiple channels consistently', () => {
    const params = {
      amplitude: 1.0,
      frequency: 440
    };

    const processed = applyStochasticTransform(testBuffer, params);
    const channel0 = processed.getChannelData(0);
    const channel1 = processed.getChannelData(1);

    // Compare first few samples of both channels
    for (let i = 0; i < 100; i++) {
      expect(channel0[i]).toBeCloseTo(channel1[i], 5);
    }
  });

  test('preserves sample rate', () => {
    const customBuffer = new MockAudioBuffer(1, 22050, 22050);
    const processed = applyStochasticTransform(customBuffer, {});

    expect(processed.sampleRate).toBe(22050);
    expect(processed.duration).toBe(1);
  });
});
