import { TestHarness } from './test-harness';
import { BaseServiceError } from '../../../src/services/errors';

describe('XenakisLDM Stochastic Generator Integration', () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = new TestHarness();
    await harness.setupEnvironment();
  });

  afterAll(async () => {
    await harness.teardown();
  });

  describe('Basic Gaussian Distribution', () => {
    it('should generate audio with specified stochastic parameters', async () => {
      const testCase = {
        name: 'gaussian_distribution_test',
        parameters: {
          prompt: 'Ambient texture with evolving harmonics',
          duration: 30,
          mathematical: {
            stochastic: {
              distribution: 'gaussian',
              mean: 0.5,
              variance: 0.1,
              mapping: [
                {
                  source: 'distribution',
                  target: 'spectralDensity',
                  transform: (value: number) => Math.max(0, Math.min(1, value))
                }
              ]
            }
          },
          mapping: [
            {
              source: 'stochastic.distribution',
              target: 'spectralDensity'
            }
          ]
        },
        expectedResults: {
          duration: 30,
          spectralProperties: {
            density: {
              mean: 0.5,
              variance: 0.1
            }
          }
        }
      };

      harness.registerTestCase(testCase);
      const result = await harness.runTestCase('gaussian_distribution_test');
      expect(result).toBe(true);
    });
  });

  describe('Complex Stochastic Configuration', () => {
    it('should handle multiple stochastic parameters', async () => {
      const testCase = {
        name: 'complex_stochastic_test',
        parameters: {
          prompt: 'Dynamic soundscape with multiple layers',
          duration: 60,
          mathematical: {
            stochastic: {
              layers: [
                {
                  distribution: 'gaussian',
                  mean: 0.6,
                  variance: 0.15,
                  mapping: [{ source: 'distribution', target: 'amplitude' }]
                },
                {
                  distribution: 'uniform',
                  min: 0.2,
                  max: 0.8,
                  mapping: [{ source: 'distribution', target: 'frequency' }]
                }
              ],
              combination: 'multiply'
            }
          },
          mapping: [
            {
              source: 'stochastic.layers[0].distribution',
              target: 'amplitude'
            },
            {
              source: 'stochastic.layers[1].distribution',
              target: 'frequency'
            }
          ]
        },
        expectedResults: {
          duration: 60,
          spectralProperties: {
            density: {
              mean: 0.6,
              variance: 0.15
            },
            frequency: {
              min: 0.2,
              max: 0.8
            }
          }
        }
      };

      harness.registerTestCase(testCase);
      const result = await harness.runTestCase('complex_stochastic_test');
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid distribution parameters', async () => {
      const testCase = {
        name: 'invalid_distribution_test',
        parameters: {
          prompt: 'Test invalid parameters',
          duration: 10,
          mathematical: {
            stochastic: {
              distribution: 'gaussian',
              mean: 2.5, // Invalid: mean should be between 0 and 1
              variance: -0.1 // Invalid: variance cannot be negative
            }
          },
          mapping: [
            {
              source: 'stochastic.distribution',
              target: 'spectralDensity'
            }
          ]
        },
        expectedResults: {
          error: {
            expected: true,
            type: 'BaseServiceError',
            message: 'VALIDATION_ERROR'
          }
        }
      };

      harness.registerTestCase(testCase);
      const result = await harness.runTestCase('invalid_distribution_test');
      expect(result).toBe(true);
    });

    it('should handle out-of-bounds duration', async () => {
      const testCase = {
        name: 'invalid_duration_test',
        parameters: {
          prompt: 'Test duration limit',
          duration: 600, // Exceeds maximum duration
          mathematical: {
            stochastic: {
              distribution: 'gaussian',
              mean: 0.5,
              variance: 0.1
            }
          },
          mapping: [
            {
              source: 'stochastic.distribution',
              target: 'spectralDensity'
            }
          ]
        },
        expectedResults: {
          error: {
            expected: true,
            type: 'BaseServiceError',
            message: 'exceeds maximum'
          }
        }
      };

      harness.registerTestCase(testCase);
      const result = await harness.runTestCase('invalid_duration_test');
      expect(result).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should generate audio within performance constraints', async () => {
      const testCase = {
        name: 'performance_test',
        parameters: {
          prompt: 'Short test for performance metrics',
          duration: 5,
          mathematical: {
            stochastic: {
              distribution: 'gaussian',
              mean: 0.5,
              variance: 0.1
            }
          },
          mapping: [
            {
              source: 'stochastic.distribution',
              target: 'spectralDensity'
            }
          ]
        },
        expectedResults: {
          duration: 5,
          metrics: {
            maxGenerationTime: 2000, // Maximum 2 seconds for generation
            maxMemoryUsage: 500 * 1024 * 1024 // Maximum 500MB memory usage
          }
        }
      };

      harness.registerTestCase(testCase);
      const result = await harness.runTestCase('performance_test');
      expect(result).toBe(true);
    });
  });
});
