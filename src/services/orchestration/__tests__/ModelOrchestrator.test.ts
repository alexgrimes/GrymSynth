import { ModelOrchestrator, TaskExecutionPlan, ModelChain } from '../ModelOrchestrator';
import { ServiceRegistry } from '../../../services/service-registry';
import { ContextManager } from '../ContextManager';
import { Task, TaskResult } from '../../../services/types';
import { TaskDelegator } from '../TaskDelegator';
import { performance } from 'perf_hooks';

// Mock dependencies
jest.mock('../../../services/service-registry');
jest.mock('../ContextManager');
jest.mock('../TaskDelegator');
jest.mock('perf_hooks', () => ({
  performance: {
    now: jest.fn()
  }
}));

describe('ModelOrchestrator', () => {
  let modelOrchestrator: ModelOrchestrator;
  let mockServiceRegistry: jest.Mocked<ServiceRegistry>;
  let mockContextManager: jest.Mocked<ContextManager>;
  let mockTaskDelegator: jest.Mocked<TaskDelegator>;

  beforeEach(() => {
    // Create mock dependencies
    mockServiceRegistry = new ServiceRegistry() as jest.Mocked<ServiceRegistry>;
    mockContextManager = new ContextManager(null as any) as jest.Mocked<ContextManager>;
    mockTaskDelegator = new TaskDelegator(null as any) as jest.Mocked<TaskDelegator>;

    // Mock the TaskDelegator constructor
    (TaskDelegator as jest.Mock).mockImplementation(() => mockTaskDelegator);

    // Create the ModelOrchestrator
    modelOrchestrator = new ModelOrchestrator(mockServiceRegistry, mockContextManager);

    // Mock performance.now
    let timeCounter = 0;
    (performance.now as jest.Mock).mockImplementation(() => {
      timeCounter += 100;
      return timeCounter;
    });
  });

  describe('executeTask', () => {
    it('should execute a task using the appropriate model', async () => {
      // Create a test task
      const task: Task = {
        id: 'test-task-1',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Mock the analyzeTask method
      const mockRequirements = {
        taskType: 'audio-analysis',
        priority: 5,
        requiresAudio: true,
        requiresPatternRecognition: true,
        estimatedComplexity: 6
      };
      (modelOrchestrator as any).analyzeTask = jest.fn().mockResolvedValue(mockRequirements);

      // Mock the createExecutionPlan method
      const mockExecutionPlan: TaskExecutionPlan = {
        chain: {
          nodes: [
            {
              modelId: 'gama',
              taskType: 'audio-analysis',
              inputs: ['audio'],
              outputs: ['features'],
              fallbackModels: ['wav2vec2'],
              isParallel: false,
              priority: 5
            }
          ],
          entryPoints: ['audio-analysis-gama'],
          exitPoints: ['audio-analysis-gama'],
          dependencies: {}
        },
        context: {},
        priority: 5,
        maxRetries: 3,
        parallelizationStrategy: 'none'
      };
      (modelOrchestrator as any).createExecutionPlan = jest.fn().mockResolvedValue(mockExecutionPlan);

      // Mock the prepareTaskContext method
      const enrichedTask = {
        ...task,
        context: {
          modelContext: {
            audioParameters: {
              sampleRate: 44100,
              channels: 2,
              format: 'float32'
            }
          }
        }
      };
      (modelOrchestrator as any).prepareTaskContext = jest.fn().mockResolvedValue(enrichedTask);

      // Mock the isCompositeTask method
      (modelOrchestrator as any).isCompositeTask = jest.fn().mockReturnValue(false);

      // Mock the executeSingleModelTask method
      const mockResult: TaskResult = {
        id: 'test-task-1',
        success: true,
        status: 'success',
        data: { features: 'test-features' },
        metadata: {
          duration: 500,
          timestamp: Date.now()
        }
      };
      (modelOrchestrator as any).executeSingleModelTask = jest.fn().mockResolvedValue(mockResult);

      // Mock other methods
      (modelOrchestrator as any).storeExecutionHistory = jest.fn();
      (modelOrchestrator as any).collectFeedback = jest.fn();
      (modelOrchestrator as any).checkAndAnalyzeBottlenecks = jest.fn().mockResolvedValue(undefined);

      // Call the method
      const result = await modelOrchestrator.executeTask(task);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('features');
      expect(result.data).toHaveProperty('orchestrationMetrics');

      // Verify that the methods were called
      expect((modelOrchestrator as any).analyzeTask).toHaveBeenCalledWith(task);
      expect((modelOrchestrator as any).createExecutionPlan).toHaveBeenCalledWith(task, mockRequirements);
      expect((modelOrchestrator as any).prepareTaskContext).toHaveBeenCalledWith(task, mockExecutionPlan);
      expect((modelOrchestrator as any).isCompositeTask).toHaveBeenCalledWith(enrichedTask, mockExecutionPlan);
      expect((modelOrchestrator as any).executeSingleModelTask).toHaveBeenCalledWith(enrichedTask, mockExecutionPlan);
      expect((modelOrchestrator as any).storeExecutionHistory).toHaveBeenCalledWith(task.id, mockResult);
      expect((modelOrchestrator as any).collectFeedback).toHaveBeenCalled();
      expect((modelOrchestrator as any).checkAndAnalyzeBottlenecks).toHaveBeenCalled();
    });

    it('should handle composite tasks', async () => {
      // Create a test task
      const task: Task = {
        id: 'test-task-2',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Mock the analyzeTask method
      const mockRequirements = {
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
            outputs: ['processedAudio']
          },
          {
            type: 'audio-feature-extraction',
            data: {},
            inputs: ['processedAudio'],
            outputs: ['features'],
            dependencies: [{ type: 'audio-preprocessing' }]
          }
        ]
      };
      (modelOrchestrator as any).analyzeTask = jest.fn().mockResolvedValue(mockRequirements);

      // Mock the createExecutionPlan method
      const mockExecutionPlan: TaskExecutionPlan = {
        chain: {
          nodes: [
            {
              modelId: 'wav2vec2',
              taskType: 'audio-preprocessing',
              inputs: ['audio'],
              outputs: ['processedAudio'],
              fallbackModels: [],
              isParallel: false,
              priority: 5
            },
            {
              modelId: 'gama',
              taskType: 'audio-feature-extraction',
              inputs: ['processedAudio'],
              outputs: ['features'],
              fallbackModels: [],
              isParallel: false,
              priority: 5
            }
          ],
          entryPoints: ['audio-preprocessing-wav2vec2'],
          exitPoints: ['audio-feature-extraction-gama'],
          dependencies: {
            'audio-feature-extraction-gama': ['audio-preprocessing-wav2vec2']
          }
        },
        context: {},
        priority: 5,
        maxRetries: 3,
        parallelizationStrategy: 'none'
      };
      (modelOrchestrator as any).createExecutionPlan = jest.fn().mockResolvedValue(mockExecutionPlan);

      // Mock the prepareTaskContext method
      const enrichedTask = {
        ...task,
        subtasks: [
          {
            id: 'test-task-2-audio-preprocessing-wav2vec2',
            type: 'audio-preprocessing',
            data: { audio: 'test-audio-data' }
          },
          {
            id: 'test-task-2-audio-feature-extraction-gama',
            type: 'audio-feature-extraction',
            data: {}
          }
        ],
        aggregationStrategy: 'sequential',
        dependencies: {
          'test-task-2-audio-feature-extraction-gama': ['test-task-2-audio-preprocessing-wav2vec2']
        }
      };
      (modelOrchestrator as any).prepareTaskContext = jest.fn().mockResolvedValue(enrichedTask);

      // Mock the isCompositeTask method
      (modelOrchestrator as any).isCompositeTask = jest.fn().mockReturnValue(true);

      // Mock the executeCompositeTask method
      const mockResult: TaskResult = {
        id: 'test-task-2',
        success: true,
        status: 'success',
        data: { features: 'test-features' },
        metadata: {
          duration: 800,
          timestamp: Date.now()
        }
      };
      (modelOrchestrator as any).executeCompositeTask = jest.fn().mockResolvedValue(mockResult);

      // Mock other methods
      (modelOrchestrator as any).storeExecutionHistory = jest.fn();
      (modelOrchestrator as any).collectFeedback = jest.fn();
      (modelOrchestrator as any).checkAndAnalyzeBottlenecks = jest.fn().mockResolvedValue(undefined);

      // Call the method
      const result = await modelOrchestrator.executeTask(task);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('features');
      expect(result.data).toHaveProperty('orchestrationMetrics');

      // Verify that the methods were called
      expect((modelOrchestrator as any).analyzeTask).toHaveBeenCalledWith(task);
      expect((modelOrchestrator as any).createExecutionPlan).toHaveBeenCalledWith(task, mockRequirements);
      expect((modelOrchestrator as any).prepareTaskContext).toHaveBeenCalledWith(task, mockExecutionPlan);
      expect((modelOrchestrator as any).isCompositeTask).toHaveBeenCalledWith(enrichedTask, mockExecutionPlan);
      expect((modelOrchestrator as any).executeCompositeTask).toHaveBeenCalledWith(enrichedTask, mockExecutionPlan);
      expect((modelOrchestrator as any).storeExecutionHistory).toHaveBeenCalledWith(task.id, mockResult);
      expect((modelOrchestrator as any).collectFeedback).toHaveBeenCalled();
      expect((modelOrchestrator as any).checkAndAnalyzeBottlenecks).toHaveBeenCalled();
    });

    it('should handle errors during task execution', async () => {
      // Create a test task
      const task: Task = {
        id: 'test-task-3',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Mock the analyzeTask method to throw an error
      const testError = new Error('Test error');
      (modelOrchestrator as any).analyzeTask = jest.fn().mockRejectedValue(testError);

      // Call the method
      const result = await modelOrchestrator.executeTask(task);

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.error).toBe(testError);
      expect(result.data).toHaveProperty('orchestrationMetrics');
    });
  });

  describe('executeSingleModelTask', () => {
    it('should execute a task using a single model', async () => {
      // Create a test task
      const task: Task = {
        id: 'test-task-4',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Create an execution plan
      const executionPlan: TaskExecutionPlan = {
        chain: {
          nodes: [
            {
              modelId: 'gama',
              taskType: 'audio-analysis',
              inputs: ['audio'],
              outputs: ['features'],
              fallbackModels: [],
              isParallel: false,
              priority: 5
            }
          ],
          entryPoints: ['audio-analysis-gama'],
          exitPoints: ['audio-analysis-gama'],
          dependencies: {}
        },
        context: {},
        priority: 5,
        maxRetries: 3,
        parallelizationStrategy: 'none'
      };

      // Create a mock service
      const mockService = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'test-task-4',
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
      mockServiceRegistry.getService.mockResolvedValue(mockService as any);

      // Mock the recordModelUsage and updatePerformanceMetrics methods
      (modelOrchestrator as any).recordModelUsage = jest.fn();
      (modelOrchestrator as any).updatePerformanceMetrics = jest.fn();

      // Call the method
      const result = await (modelOrchestrator as any).executeSingleModelTask(task, executionPlan);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('features');

      // Verify that the methods were called
      expect(mockServiceRegistry.getService).toHaveBeenCalledWith('gama');
      expect(mockService.executeTask).toHaveBeenCalledWith(task);
      expect((modelOrchestrator as any).recordModelUsage).toHaveBeenCalledWith('gama', 'audio-analysis', expect.any(Number));
      expect((modelOrchestrator as any).updatePerformanceMetrics).toHaveBeenCalled();
    });

    it('should try fallback models when the primary model fails', async () => {
      // Create a test task
      const task: Task = {
        id: 'test-task-5',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Create an execution plan
      const executionPlan: TaskExecutionPlan = {
        chain: {
          nodes: [
            {
              modelId: 'gama',
              taskType: 'audio-analysis',
              inputs: ['audio'],
              outputs: ['features'],
              fallbackModels: ['wav2vec2'],
              isParallel: false,
              priority: 5
            }
          ],
          entryPoints: ['audio-analysis-gama'],
          exitPoints: ['audio-analysis-gama'],
          dependencies: {}
        },
        context: {},
        priority: 5,
        maxRetries: 3,
        parallelizationStrategy: 'none'
      };

      // Create mock services
      const mockGamaService = {
        executeTask: jest.fn().mockRejectedValue(new Error('GAMA error'))
      };

      const mockWav2vec2Service = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'test-task-5',
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
      mockServiceRegistry.getService.mockImplementation((id) => {
        if (id === 'gama') {
          return Promise.resolve(mockGamaService as any);
        } else if (id === 'wav2vec2') {
          return Promise.resolve(mockWav2vec2Service as any);
        }
        return Promise.reject(new Error(`Unknown service: ${id}`));
      });

      // Mock the executeFallbackModels method
      (modelOrchestrator as any).executeFallbackModels = jest.fn().mockImplementation(
        (task, fallbackModels) => (modelOrchestrator as any).executeFallbackModelsOriginal(task, fallbackModels)
      );
      (modelOrchestrator as any).executeFallbackModelsOriginal = (modelOrchestrator as any).executeFallbackModels;

      // Mock the recordModelUsage and updatePerformanceMetrics methods
      (modelOrchestrator as any).recordModelUsage = jest.fn();
      (modelOrchestrator as any).updatePerformanceMetrics = jest.fn();

      // Call the method
      const result = await (modelOrchestrator as any).executeSingleModelTask(task, executionPlan);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.data).toHaveProperty('features');
      expect(result.metadata).toHaveProperty('fallbackModel', 'wav2vec2');

      // Verify that the methods were called
      expect(mockServiceRegistry.getService).toHaveBeenCalledWith('gama');
      expect(mockServiceRegistry.getService).toHaveBeenCalledWith('wav2vec2');
      expect(mockGamaService.executeTask).toHaveBeenCalledWith(task);
      expect(mockWav2vec2Service.executeTask).toHaveBeenCalledWith(task);
      expect((modelOrchestrator as any).recordModelUsage).toHaveBeenCalledWith('wav2vec2', 'audio-analysis', expect.any(Number));
      expect((modelOrchestrator as any).updatePerformanceMetrics).toHaveBeenCalled();
    });
  });

  describe('executeCompositeTask', () => {
    it('should delegate composite task execution to the TaskDelegator', async () => {
      // Create a composite task
      const compositeTask = {
        id: 'composite-task-1',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' },
        subtasks: [
          {
            id: 'subtask-1',
            type: 'audio-preprocessing',
            data: { audio: 'test-audio-data' }
          },
          {
            id: 'subtask-2',
            type: 'audio-feature-extraction',
            data: {}
          }
        ],
        aggregationStrategy: 'sequential',
        dependencies: {
          'subtask-2': ['subtask-1']
        }
      };

      // Create an execution plan
      const executionPlan: TaskExecutionPlan = {
        chain: {
          nodes: [
            {
              modelId: 'wav2vec2',
              taskType: 'audio-preprocessing',
              inputs: ['audio'],
              outputs: ['processedAudio'],
              fallbackModels: [],
              isParallel: false,
              priority: 5
            },
            {
              modelId: 'gama',
              taskType: 'audio-feature-extraction',
              inputs: ['processedAudio'],
              outputs: ['features'],
              fallbackModels: [],
              isParallel: false,
              priority: 5
            }
          ],
          entryPoints: ['audio-preprocessing-wav2vec2'],
          exitPoints: ['audio-feature-extraction-gama'],
          dependencies: {
            'audio-feature-extraction-gama': ['audio-preprocessing-wav2vec2']
          }
        },
        context: {},
        priority: 5,
        maxRetries: 3,
        parallelizationStrategy: 'none'
      };

      // Mock the handleCompositeTask method
      const mockResult: TaskResult = {
        id: 'composite-task-1',
        success: true,
        status: 'success',
        data: { features: 'test-features' },
        metadata: {
          duration: 800,
          timestamp: Date.now()
        }
      };
      mockTaskDelegator.handleCompositeTask.mockResolvedValue(mockResult);

      // Call the method
      const result = await (modelOrchestrator as any).executeCompositeTask(compositeTask, executionPlan);

      // Verify the result
      expect(result).toBe(mockResult);

      // Verify that the method was called
      expect(mockTaskDelegator.handleCompositeTask).toHaveBeenCalledWith(compositeTask);
    });
  });

  describe('getStats', () => {
    it('should return statistics about the model orchestrator', () => {
      // Set up some execution history
      (modelOrchestrator as any).executionHistory.set('task-1', [
        {
          id: 'task-1',
          success: true,
          status: 'success',
          data: { result: 'test-result' },
          metadata: { duration: 100, timestamp: Date.now() }
        }
      ]);

      // Set up some feedback data
      (modelOrchestrator as any).feedbackData = [
        {
          taskId: 'task-1',
          modelId: 'gama',
          taskType: 'audio-analysis',
          success: true,
          latency: 500,
          timestamp: Date.now()
        }
      ];

      // Set up some bottleneck cache
      (modelOrchestrator as any).bottleneckCache.set('gama-audio-analysis', {
        modelId: 'gama',
        taskType: 'audio-analysis',
        averageLatency: 500,
        resourceUtilization: 0.7,
        errorRate: 0.05,
        impact: 0.6,
        recommendations: ['Optimize GAMA for audio analysis tasks']
      });

      // Set up some model performance cache
      const modelMetrics = new Map<string, number[]>();
      modelMetrics.set('audio-analysis', [500, 600, 550]);
      (modelOrchestrator as any).modelPerformanceCache.set('gama', modelMetrics);

      // Call the method
      const stats = modelOrchestrator.getStats();

      // Verify the result
      expect(stats.executionHistorySize).toBe(1);
      expect(stats.feedbackDataSize).toBe(1);
      expect(stats.bottleneckCount).toBe(1);
      expect(stats.modelPerformanceMetrics).toHaveProperty('gama');
      expect(stats.modelPerformanceMetrics.gama).toHaveProperty('audio-analysis');
      expect(stats.modelPerformanceMetrics.gama['audio-analysis'].averageLatency).toBeGreaterThan(0);
      expect(stats.modelPerformanceMetrics.gama['audio-analysis'].sampleCount).toBe(3);
    });
  });
});
