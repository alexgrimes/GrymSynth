const { describe, expect, test, beforeEach } = require('@jest/globals');
const MockAudioLDM = require('../mocks/audioldm-service');

class AudioPostProcessor {
  static applyStochasticTransform(buffer, params) {
    const { distribution, mean = 0, variance = 1 } = params;
    const data = buffer.getChannelData(0);
    const transformed = new Float32Array(data.length);

    switch (distribution) {
      case 'gaussian':
        for (let i = 0; i < data.length; i++) {
          // Box-Muller transform for Gaussian distribution
          const u1 = Math.random();
          const u2 = Math.random();
          const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          transformed[i] = data[i] + (z * Math.sqrt(variance) + mean);
        }
        break;
      default:
        throw new Error(`Unsupported distribution: ${distribution}`);
    }

    return {
      ...buffer,
      getChannelData: (channel) => channel === 0 ? transformed : buffer.getChannelData(channel)
    };
  }

  static applySieveTheory(buffer, intervals) {
    const data = buffer.getChannelData(0);
    const transformed = new Float32Array(data.length);

    // Apply sieve theory by selectively passing frequencies
    for (let i = 0; i < data.length; i++) {
      if (intervals.some(interval => i % interval === 0)) {
        transformed[i] = data[i];
      }
    }

    return {
      ...buffer,
      getChannelData: (channel) => channel === 0 ? transformed : buffer.getChannelData(channel)
    };
  }

  static applyCellularAutomata(buffer, rule) {
    const data = buffer.getChannelData(0);
    const transformed = new Float32Array(data.length);
    const ruleInt = parseInt(rule, 10);

    // Convert audio samples to binary states based on threshold
    const states = data.map(sample => sample > 0 ? 1 : 0);

    for (let i = 1; i < data.length - 1; i++) {
      const pattern = (states[i-1] << 2) | (states[i] << 1) | states[i+1];
      states[i] = (ruleInt >> pattern) & 1;
      transformed[i] = states[i] * 2 - 1; // Convert back to [-1, 1] range
    }

    return {
      ...buffer,
      getChannelData: (channel) => channel === 0 ? transformed : buffer.getChannelData(channel)
    };
  }
}

describe('XenakisLDM Post-Processing', () => {
  let audioldm;
  let baseBuffer;

  beforeEach(async () => {
    audioldm = new MockAudioLDM({
      sampleRate: 44100,
      latency: 0 // Disable latency for tests
    });
    baseBuffer = await audioldm.generateAudio('test base');
  });

  describe('Stochastic Transformations', () => {
    test('applies Gaussian distribution', () => {
      const params = {
        distribution: 'gaussian',
        mean: 0.1,
        variance: 0.2
      };

      const processed = AudioPostProcessor.applyStochasticTransform(baseBuffer, params);
      const data = processed.getChannelData(0);

      // Calculate actual mean and variance
      let sum = 0;
      let squareSum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += data[i];
        squareSum += data[i] * data[i];
      }
      const actualMean = sum / 1000;
      const actualVariance = (squareSum / 1000) - (actualMean * actualMean);

      // Allow for some statistical variation
      expect(actualMean).toBeCloseTo(params.mean, 1);
      expect(actualVariance).toBeCloseTo(params.variance, 1);
    });

    test('handles invalid distribution type', () => {
      expect(() => {
        AudioPostProcessor.applyStochasticTransform(baseBuffer, {
          distribution: 'invalid'
        });
      }).toThrow('Unsupported distribution: invalid');
    });
  });

  describe('Sieve Theory Application', () => {
    test('applies frequency intervals', () => {
      const intervals = [2, 3, 5];
      const processed = AudioPostProcessor.applySieveTheory(baseBuffer, intervals);
      const originalData = baseBuffer.getChannelData(0);
      const processedData = processed.getChannelData(0);

      // Verify that samples at interval positions match original
      for (let i = 0; i < 100; i++) {
        if (intervals.some(interval => i % interval === 0)) {
          expect(processedData[i]).toBe(originalData[i]);
        } else {
          expect(processedData[i]).toBe(0);
        }
      }
    });
  });

  describe('Cellular Automata', () => {
    test('applies rule 110', () => {
      const processed = AudioPostProcessor.applyCellularAutomata(baseBuffer, '110');
      const data = processed.getChannelData(0);

      // Rule 110 should produce non-uniform patterns
      let allSame = true;
      let lastValue = data[0];

      for (let i = 1; i < 100; i++) {
        if (data[i] !== lastValue) {
          allSame = false;
          break;
        }
        lastValue = data[i];
      }

      expect(allSame).toBe(false);
    });

    test('keeps values in valid range', () => {
      const processed = AudioPostProcessor.applyCellularAutomata(baseBuffer, '110');
      const data = processed.getChannelData(0);

      for (let i = 0; i < 100; i++) {
        expect(data[i]).toBeGreaterThanOrEqual(-1);
        expect(data[i]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Combined Transformations', () => {
    test('applies multiple transformations in sequence', () => {
      const stochasticParams = {
        distribution: 'gaussian',
        mean: 0,
        variance: 0.1
      };

      let processed = baseBuffer;

      // Apply transformations in sequence
      processed = AudioPostProcessor.applyStochasticTransform(processed, stochasticParams);
      processed = AudioPostProcessor.applySieveTheory(processed, [2, 3]);
      processed = AudioPostProcessor.applyCellularAutomata(processed, '110');

      const finalData = processed.getChannelData(0);

      // Verify the final output is still valid audio data
      expect(finalData.length).toBe(baseBuffer.length);
      for (let i = 0; i < 100; i++) {
        expect(finalData[i]).toBeGreaterThanOrEqual(-1);
        expect(finalData[i]).toBeLessThanOrEqual(1);
      }
    });
  });
});
