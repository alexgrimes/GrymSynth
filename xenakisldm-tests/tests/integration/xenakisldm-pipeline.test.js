const { describe, expect, test, beforeEach } = require('@jest/globals');
const MockAudioLDM = require('../mocks/audioldm-service');

// Mock XenakisLDM orchestrator
class XenakisLDMOrchestrator {
  constructor(config = {}) {
    this.audioldm = new MockAudioLDM(config);
    this.processingChain = [];
  }

  addTransformation(type, params) {
    this.processingChain.push({ type, params });
  }

  async generateAudio(basePrompt, mathParams) {
    try {
      // Build enhanced prompt
      const enhancedPrompt = this.enhancePrompt(basePrompt, mathParams);

      // Generate initial audio
      const startTime = performance.now();
      let audioBuffer = await this.audioldm.generateAudio(enhancedPrompt);

      // Apply post-processing chain
      for (const transform of this.processingChain) {
        audioBuffer = await this.applyTransformation(audioBuffer, transform);
      }

      const duration = performance.now() - startTime;

      return {
        buffer: audioBuffer,
        metadata: {
          originalPrompt: basePrompt,
          enhancedPrompt,
          processingTime: duration,
          transformations: this.processingChain.map(t => t.type)
        }
      };
    } catch (error) {
      console.error('Generation failed:', error);
      throw new Error(`Audio generation pipeline failed: ${error.message}`);
    }
  }

  enhancePrompt(basePrompt, mathParams) {
    const enhancements = [];

    if (mathParams.stochastic) {
      enhancements.push(`with ${mathParams.stochastic.distribution} distribution`);
    }

    if (mathParams.sieve) {
      enhancements.push(`using intervals [${mathParams.sieve.join(', ')}]`);
    }

    if (mathParams.cellular) {
      enhancements.push(`following rule ${mathParams.cellular}`);
    }

    return `${basePrompt} ${enhancements.join(' ')}`;
  }

  async applyTransformation(buffer, transform) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 50));

    switch (transform.type) {
      case 'stochastic':
        return this.applyStochasticTransform(buffer, transform.params);
      case 'sieve':
        return this.applySieveTheory(buffer, transform.params);
      case 'cellular':
        return this.applyCellularAutomata(buffer, transform.params);
      default:
        throw new Error(`Unknown transformation type: ${transform.type}`);
    }
  }

  // Transform implementations from post-processing.test.js
  applyStochasticTransform(buffer, params) {
    // Implementation details...
    return buffer;
  }

  applySieveTheory(buffer, params) {
    // Implementation details...
    return buffer;
  }

  applyCellularAutomata(buffer, params) {
    // Implementation details...
    return buffer;
  }
}

describe('XenakisLDM Integration Pipeline', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new XenakisLDMOrchestrator({
      latency: 100,
      sampleRate: 44100
    });
  });

  describe('End-to-End Generation', () => {
    test('completes full generation pipeline', async () => {
      const basePrompt = 'textural drone';
      const mathParams = {
        stochastic: {
          distribution: 'gaussian',
          mean: 0,
          variance: 0.1
        },
        sieve: [2, 3, 5],
        cellular: '110'
      };

      orchestrator.addTransformation('stochastic', mathParams.stochastic);
      orchestrator.addTransformation('sieve', mathParams.sieve);
      orchestrator.addTransformation('cellular', mathParams.cellular);

      const result = await orchestrator.generateAudio(basePrompt, mathParams);

      // Verify result structure
      expect(result.buffer).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.originalPrompt).toBe(basePrompt);
      expect(result.metadata.transformations).toHaveLength(3);
      expect(result.metadata.processingTime).toBeGreaterThan(0);

      // Verify audio buffer properties
      expect(result.buffer.sampleRate).toBe(44100);
      expect(result.buffer.numberOfChannels).toBe(2);
      expect(typeof result.buffer.getChannelData).toBe('function');
    });

    test('handles errors gracefully', async () => {
      orchestrator = new XenakisLDMOrchestrator({
        failureRate: 1.0 // Force failure
      });

      await expect(orchestrator.generateAudio('test', {}))
        .rejects
        .toThrow('Audio generation pipeline failed');
    });
  });

  describe('Resource Management', () => {
    test('processes large transformations chains', async () => {
      // Add multiple transformations
      for (let i = 0; i < 10; i++) {
        orchestrator.addTransformation('stochastic', {
          distribution: 'gaussian',
          mean: 0,
          variance: 0.1
        });
      }

      const result = await orchestrator.generateAudio('test', {});
      expect(result.metadata.transformations).toHaveLength(10);
    });

    test('maintains consistent audio quality through chain', async () => {
      orchestrator.addTransformation('stochastic', {
        distribution: 'gaussian',
        mean: 0,
        variance: 0.1
      });
      orchestrator.addTransformation('sieve', [2, 3]);

      const result = await orchestrator.generateAudio('test', {});
      const data = result.buffer.getChannelData(0);

      // Verify audio remains within bounds
      for (let i = 0; i < 100; i++) {
        expect(data[i]).toBeGreaterThanOrEqual(-1);
        expect(data[i]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Performance Monitoring', () => {
    test('tracks processing time accurately', async () => {
      orchestrator.addTransformation('stochastic', {
        distribution: 'gaussian'
      });

      const result = await orchestrator.generateAudio('test', {});

      // Should include at least AudioLDM latency + transformation time
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(150);
    });
  });
});
