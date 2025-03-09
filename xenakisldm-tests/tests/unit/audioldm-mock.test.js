const { describe, expect, test, beforeEach } = require('@jest/globals');
const MockAudioLDM = require('../mocks/audioldm-service');

describe('AudioLDM Mock Service', () => {
  let audioldm;

  beforeEach(() => {
    audioldm = new MockAudioLDM({
      latency: 50,
      variance: 0.1,
      sampleRate: 44100,
      failureRate: 0.1
    });
  });

  describe('Audio Generation', () => {
    test('generates valid audio buffer', async () => {
      const prompt = 'atmospheric texture with reverb';
      const buffer = await audioldm.generateAudio(prompt);

      expect(buffer.sampleRate).toBe(44100);
      expect(buffer.numberOfChannels).toBe(2);
      expect(buffer.duration).toBe(5.0); // Default duration
      expect(buffer.length).toBe(44100 * 5); // sampleRate * duration
      expect(typeof buffer.getChannelData).toBe('function');
    });

    test('generates deterministic output for same prompt', async () => {
      const prompt = 'test prompt';
      const buffer1 = await audioldm.generateAudio(prompt);
      const buffer2 = await audioldm.generateAudio(prompt);

      // Compare first few samples from both channels
      const channel0First = buffer1.getChannelData(0).slice(0, 100);
      const channel0Second = buffer2.getChannelData(0).slice(0, 100);

      // Samples should be similar within variance
      for (let i = 0; i < 100; i++) {
        expect(Math.abs(channel0First[i] - channel0Second[i])).toBeLessThanOrEqual(0.2);
      }
    });

    test('produces different outputs for different prompts', async () => {
      const buffer1 = await audioldm.generateAudio('prompt 1');
      const buffer2 = await audioldm.generateAudio('prompt 2');

      const channel0First = buffer1.getChannelData(0).slice(0, 100);
      const channel0Second = buffer2.getChannelData(0).slice(0, 100);

      let differences = 0;
      for (let i = 0; i < 100; i++) {
        if (Math.abs(channel0First[i] - channel0Second[i]) > 0.1) {
          differences++;
        }
      }

      // At least 50% of samples should be different
      expect(differences).toBeGreaterThan(50);
    });

    test('respects duration parameter', async () => {
      const duration = 2.5;
      const buffer = await audioldm.generateAudio('test', { duration });

      expect(buffer.duration).toBe(duration);
      expect(buffer.length).toBe(Math.floor(44100 * duration));
    });

    test('generates valid audio data within bounds', async () => {
      const buffer = await audioldm.generateAudio('test');
      const data = buffer.getChannelData(0);

      // All samples should be within [-1, 1]
      for (let i = 0; i < 100; i++) {
        expect(data[i]).toBeGreaterThanOrEqual(-1);
        expect(data[i]).toBeLessThanOrEqual(1);
      }
    });

    test('throws error for invalid channel access', async () => {
      const buffer = await audioldm.generateAudio('test');
      expect(() => buffer.getChannelData(2)).toThrow('Invalid channel index');
    });
  });

  describe('Error Handling', () => {
    test('handles generation failures', async () => {
      // Set 100% failure rate
      audioldm = new MockAudioLDM({ failureRate: 1.0 });

      await expect(audioldm.generateAudio('test'))
        .rejects
        .toThrow('AudioLDM generation failed');
    });
  });

  describe('Parameter Adjustment', () => {
    test('adjusts parameters with timestamp', async () => {
      const params = { frequency: 440, amplitude: 0.5 };
      const result = await audioldm.adjustParameters(params);

      expect(result.adjusted).toBe(true);
      expect(result.frequency).toBe(params.frequency);
      expect(result.amplitude).toBe(params.amplitude);
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('Resource Management', () => {
    test('performs cleanup', async () => {
      const result = await audioldm.cleanup();
      expect(result).toBe(true);
    });
  });

  describe('Performance Characteristics', () => {
    test('respects configured latency', async () => {
      const startTime = Date.now();
      await audioldm.generateAudio('test');
      const duration = Date.now() - startTime;

      // Should take at least the configured latency
      expect(duration).toBeGreaterThanOrEqual(50);
      // But not extraordinarily longer
      expect(duration).toBeLessThan(1000);
    });
  });
});
