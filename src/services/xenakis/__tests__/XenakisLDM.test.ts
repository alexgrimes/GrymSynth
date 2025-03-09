import { XenakisLDMService } from '../XenakisLDMService';
import { XenakisLDMServiceFactory } from '../XenakisLDMServiceFactory';
import { AudioLDMService } from '../../audio/AudioLDMService';
import { XenakisParameters, XenakisConfig } from '../types';
import { Task } from '../../types';

// Mock AudioLDMService
jest.mock('../../audio/AudioLDMService', () => {
  return {
    AudioLDMService: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      isInitialized: jest.fn().mockReturnValue(true),
      generateAudio: jest.fn().mockResolvedValue({
        audio: new Float32Array(16000 * 5),
        sampleRate: 16000,
        duration: 5,
        parameters: {}
      }),
      shutdown: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

describe('XenakisLDM Integration Tests', () => {
  let service: XenakisLDMService;
  let audioLDM: jest.Mocked<AudioLDMService>;

  beforeEach(async () => {
    audioLDM = new AudioLDMService({} as any) as jest.Mocked<AudioLDMService>;
    const config: XenakisConfig = XenakisLDMServiceFactory.getDefaultConfig();
    service = await XenakisLDMServiceFactory.createService(config, audioLDM);
  });

  afterEach(async () => {
    await XenakisLDMServiceFactory.destroyInstance();
    jest.clearAllMocks();
  });

  it('should initialize successfully', async () => {
    expect(service.isInitialized()).toBe(true);
    expect(audioLDM.initialize).toHaveBeenCalled();
  });

  it('should generate audio using stochastic parameters', async () => {
    const params: XenakisParameters = {
      prompt: 'Test stochastic audio',
      mathematical: {
        stochastic: {
          type: 'stochastic',
          duration: 5,
          sampleRate: 16000,
          distribution: {
            type: 'gaussian',
            parameters: {
              mean: 0,
              stdDev: 1
            }
          },
          range: {
            min: -1,
            max: 1
          },
          timeScale: 1
        }
      },
      mapping: [
        {
          source: {
            id: 'test',
            type: 'stochastic',
            value: 0.5,
            time: 0
          },
          target: 'guidanceScale'
        }
      ]
    };

    const task: Task = {
      id: 'test-1',
      type: 'xenakis-generation',
      modelType: 'xenakis',
      priority: 'normal',
      data: { parameters: params }
    };

    const result = await service.executeTask(task);

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(audioLDM.generateAudio).toHaveBeenCalled();
  });

  it('should generate audio using sieve theory parameters', async () => {
    const params: XenakisParameters = {
      prompt: 'Test sieve theory audio',
      mathematical: {
        sieve: {
          type: 'sieve',
          duration: 5,
          sampleRate: 16000,
          moduli: [2, 3, 5],
          residues: [0, 1, 2],
          operations: ['union', 'intersection']
        }
      },
      mapping: [
        {
          source: {
            id: 'test',
            type: 'sieve',
            value: 0.5,
            time: 0
          },
          target: 'guidanceScale'
        }
      ]
    };

    const task: Task = {
      id: 'test-2',
      type: 'xenakis-generation',
      modelType: 'xenakis',
      priority: 'normal',
      data: { parameters: params }
    };

    const result = await service.executeTask(task);

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
  });

  it('should handle invalid parameters gracefully', async () => {
    const params: XenakisParameters = {
      prompt: 'Test invalid parameters',
      mathematical: {
        stochastic: {
          type: 'stochastic',
          duration: -1, // Invalid duration
          sampleRate: 16000,
          distribution: {
            type: 'gaussian',
            parameters: {
              mean: 0,
              stdDev: -1 // Invalid standard deviation
            }
          },
          range: {
            min: 1,
            max: 0 // Invalid range
          },
          timeScale: 1
        }
      },
      mapping: []
    };

    const task: Task = {
      id: 'test-3',
      type: 'xenakis-generation',
      modelType: 'xenakis',
      priority: 'normal',
      data: { parameters: params }
    };

    const result = await service.executeTask(task);

    expect(result.status).toBe('error');
    expect(result.error).toBeDefined();
  });

  it('should combine multiple generator outputs', async () => {
    const params: XenakisParameters = {
      prompt: 'Test combined generators',
      mathematical: {
        stochastic: {
          type: 'stochastic',
          duration: 5,
          sampleRate: 16000,
          distribution: {
            type: 'gaussian',
            parameters: { mean: 0, stdDev: 1 }
          },
          range: { min: -1, max: 1 },
          timeScale: 1
        },
        sieve: {
          type: 'sieve',
          duration: 5,
          sampleRate: 16000,
          moduli: [2, 3],
          residues: [0, 1],
          operations: ['union']
        }
      },
      mapping: [
        {
          source: {
            id: 'test-stochastic',
            type: 'stochastic',
            value: 0.5,
            time: 0
          },
          target: 'guidanceScale'
        },
        {
          source: {
            id: 'test-sieve',
            type: 'sieve',
            value: 0.7,
            time: 0
          },
          target: 'diffusionSteps'
        }
      ]
    };

    const task: Task = {
      id: 'test-4',
      type: 'xenakis-generation',
      modelType: 'xenakis',
      priority: 'normal',
      data: { parameters: params }
    };

    const result = await service.executeTask(task);

    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.mathematicalStructure.parameters.length).toBeGreaterThan(0);
      expect(result.data.visualizationData).toBeDefined();
    }
  });
});
