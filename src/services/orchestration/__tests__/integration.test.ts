import { ServiceRegistry } from '../../../services/service-registry';
import { ContextManager as BaseContextManager } from '../../../context/context-manager';
import { createOrchestrationLayer } from '../index';
import { Task, TaskResult } from '../../../services/types';

// Mock dependencies
jest.mock('../../../services/service-registry');
jest.mock('../../../context/context-manager');

describe('Orchestration Layer Integration', () => {
  let serviceRegistry: jest.Mocked<ServiceRegistry>;
  let baseContextManager: jest.Mocked<BaseContextManager>;
  let orchestrationLayer: ReturnType<typeof createOrchestrationLayer>;

  beforeEach(() => {
    // Create mock dependencies
    serviceRegistry = new ServiceRegistry() as jest.Mocked<ServiceRegistry>;
    baseContextManager = new BaseContextManager() as jest.Mocked<BaseContextManager>;

    // Mock the getAllServiceIds method
    serviceRegistry.getAllServiceIds.mockReturnValue(['wav2vec2', 'audioldm', 'gama']);

    // Create the orchestration layer
    orchestrationLayer = createOrchestrationLayer(serviceRegistry, baseContextManager);
  });

  describe('End-to-end task execution', () => {
    it('should process a simple audio analysis task', async () => {
      // Create a mock service
      const mockService = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'test-task-1',
          success: true,
          status: 'success',
          data: { features: 'test-features' },
          metadata: {
            duration: 500,
            timestamp: Date.now()
          }
        })
      };

      // Mock the getService method
      serviceRegistry.getService.mockResolvedValue(mockService as any);

      // Create a test task
      const task: Task = {
        id: 'test-task-1',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Execute the task
      const result = await orchestrationLayer.modelOrchestrator.executeTask(task);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('features');
      expect(result.data).toHaveProperty('orchestrationMetrics');

      // Verify that the service was called
      expect(serviceRegistry.getService).toHaveBeenCalled();
      expect(mockService.executeTask).toHaveBeenCalled();
    });

    it('should handle a composite task with multiple models', async () => {
      // Create mock services
      const mockWav2vec2Service = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'subtask-1',
          success: true,
          status: 'success',
          data: { processedAudio: 'test-processed-audio' },
          metadata: {
            duration: 300,
            timestamp: Date.now()
          }
        })
      };

      const mockGamaService = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'subtask-2',
          success: true,
          status: 'success',
          data: { features: 'test-features' },
          metadata: {
            duration: 500,
            timestamp: Date.now()
          }
        })
      };

      // Mock the getService method
      serviceRegistry.getService.mockImplementation((id) => {
        if (id === 'wav2vec2') {
          return Promise.resolve(mockWav2vec2Service as any);
        } else if (id === 'gama') {
          return Promise.resolve(mockGamaService as any);
        }
        return Promise.reject(new Error(`Unknown service: ${id}`));
      });

      // Mock the analyzeTask method to suggest subtasks
      const analyzeTaskSpy = jest.spyOn(orchestrationLayer.modelOrchestrator as any, 'analyzeTask');
      analyzeTaskSpy.mockResolvedValue({
        taskType: 'audio-analysis',
        priority: 5,
        requiresAudio: true,
        requiresPatternRecognition: true,
        estimatedComplexity: 8,
        shouldSplit: true,
        suggestedSubtasks: [
          {
            type: 'audio-preprocessing',
            data: { audio: 'test-audio-data' },
            inputs: ['audio'],
            outputs: ['processedAudio'],
            isParallel: false,
            priority: 5
          },
          {
            type: 'audio-feature-extraction',
            data: {},
            inputs: ['processedAudio'],
            outputs: ['features'],
            dependencies: [{ type: 'audio-preprocessing' }],
            isParallel: false,
            priority: 5
          }
        ]
      });

      // Create a test task
      const task: Task = {
        id: 'test-task-2',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Execute the task
      const result = await orchestrationLayer.modelOrchestrator.executeTask(task);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('orchestrationMetrics');

      // Verify that both services were called
      expect(serviceRegistry.getService).toHaveBeenCalledWith(expect.stringMatching(/wav2vec2|gama/));
    });

    it('should use context transformations between models', async () => {
      // Create a source context
      const sourceContext = {
        audioParameters: {
          sampleRate: 44100,
          channels: 2,
          format: 'wav'
        },
        processingRequirements: {
          quality: 'high'
        }
      };

      // Transform the context
      const result = await orchestrationLayer.contextManager.getTransformedContext(
        'wav2vec2',
        'gama',
        sourceContext
      );

      // Verify the result
      expect(result.audioParameters.format).toBe('float32');
      expect(result.audioParameters.normalized).toBe(true);
      expect(result.audioParameters.sampleRate).toBe(44100);
      expect(result.processingRequirements.quality).toBe('high');
      expect(result._transformationMetadata).toBeDefined();
      expect(result._transformationMetadata.sourceModelType).toBe('wav2vec2');
      expect(result._transformationMetadata.targetModelType).toBe('gama');
    });

    it('should schedule and execute tasks based on priority', async () => {
      // Create a mock service
      const mockService = {
        executeTask: jest.fn().mockImplementation((task) => Promise.resolve({
          id: task.id,
          success: true,
          status: 'success',
          data: { result: `Processed ${task.id}` },
          metadata: {
            duration: 500,
            timestamp: Date.now()
          }
        }))
      };

      // Mock the getService method
      serviceRegistry.getService.mockResolvedValue(mockService as any);

      // Create test tasks
      const task1: Task = {
        id: 'task-1',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data-1' }
      };

      const task2: Task = {
        id: 'task-2',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data-2' }
      };

      // Schedule tasks with different priorities
      await orchestrationLayer.taskDelegator.scheduleTask(task1, 3);
      await orchestrationLayer.taskDelegator.scheduleTask(task2, 8);

      // Get the next task
      const nextTask = orchestrationLayer.taskDelegator.getNextTask();

      // Verify that the higher priority task is returned
      expect(nextTask?.id).toBe('task-2');

      // Execute the task
      const result = await orchestrationLayer.modelOrchestrator.executeTask(nextTask!);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('result', 'Processed task-2');

      // Mark the task as completed
      orchestrationLayer.taskDelegator.completeTask(nextTask!.id);

      // Get the next task
      const nextTask2 = orchestrationLayer.taskDelegator.getNextTask();

      // Verify that the lower priority task is returned next
      expect(nextTask2?.id).toBe('task-1');
    });

    it('should detect bottlenecks in model performance', async () => {
      // Add some feedback data
      for (let i = 0; i < 10; i++) {
        (orchestrationLayer.modelOrchestrator as any).feedbackData.push({
          taskId: `task-${i}`,
          modelId: 'gama',
          taskType: 'audio-analysis',
          success: i < 8, // 80% success rate
          latency: 3000, // High latency
          timestamp: Date.now() - (i * 1000)
        });
      }

      // Force bottleneck analysis
      (orchestrationLayer.modelOrchestrator as any).lastBottleneckAnalysis = 0;

      // Detect bottlenecks
      const bottlenecks = await (orchestrationLayer.modelOrchestrator as any).detectBottlenecks();

      // Verify that a bottleneck was detected
      expect(bottlenecks.length).toBeGreaterThan(0);
      expect(bottlenecks[0].modelId).toBe('gama');
      expect(bottlenecks[0].taskType).toBe('audio-analysis');
      expect(bottlenecks[0].impact).toBeGreaterThan(0.5);
      expect(bottlenecks[0].recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling and recovery', () => {
    it('should try fallback models when the primary model fails', async () => {
      // Create mock services
      const mockGamaService = {
        executeTask: jest.fn().mockRejectedValue(new Error('GAMA error'))
      };

      const mockWav2vec2Service = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'test-task-3',
          success: true,
          status: 'success',
          data: { features: 'test-features' },
          metadata: {
            duration: 500,
            timestamp: Date.now()
          }
        })
      };

      // Mock the getService method
      serviceRegistry.getService.mockImplementation((id) => {
        if (id === 'gama') {
          return Promise.resolve(mockGamaService as any);
        } else if (id === 'wav2vec2') {
          return Promise.resolve(mockWav2vec2Service as any);
        }
        return Promise.reject(new Error(`Unknown service: ${id}`));
      });

      // Mock the selectModelForTask method
      const selectModelSpy = jest.spyOn(orchestrationLayer.taskDelegator, 'selectModelForTask');
      selectModelSpy.mockResolvedValue({
        modelId: 'gama',
        confidence: 0.95,
        fallbackModels: ['wav2vec2'],
        estimatedLatency: 800
      });

      // Create a test task
      const task: Task = {
        id: 'test-task-3',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Execute the task
      const result = await orchestrationLayer.modelOrchestrator.executeTask(task);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');

      // Verify that both services were called
      expect(mockGamaService.executeTask).toHaveBeenCalled();
      expect(mockWav2vec2Service.executeTask).toHaveBeenCalled();
    });

    it('should handle errors gracefully when all models fail', async () => {
      // Create mock services that all fail
      const mockGamaService = {
        executeTask: jest.fn().mockRejectedValue(new Error('GAMA error'))
      };

      const mockWav2vec2Service = {
        executeTask: jest.fn().mockRejectedValue(new Error('Wav2Vec2 error'))
      };

      // Mock the getService method
      serviceRegistry.getService.mockImplementation((id) => {
        if (id === 'gama') {
          return Promise.resolve(mockGamaService as any);
        } else if (id === 'wav2vec2') {
          return Promise.resolve(mockWav2vec2Service as any);
        }
        return Promise.reject(new Error(`Unknown service: ${id}`));
      });

      // Mock the selectModelForTask method
      const selectModelSpy = jest.spyOn(orchestrationLayer.taskDelegator, 'selectModelForTask');
      selectModelSpy.mockResolvedValue({
        modelId: 'gama',
        confidence: 0.95,
        fallbackModels: ['wav2vec2'],
        estimatedLatency: 800
      });

      // Create a test task
      const task: Task = {
        id: 'test-task-4',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Execute the task
      const result = await orchestrationLayer.modelOrchestrator.executeTask(task);

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.data).toHaveProperty('orchestrationMetrics');

      // Verify that both services were called
      expect(mockGamaService.executeTask).toHaveBeenCalled();
      expect(mockWav2vec2Service.executeTask).toHaveBeenCalled();
    });
  });
});
