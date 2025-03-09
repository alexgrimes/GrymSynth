import { TaskDelegator, ModelCapability, PrioritizedTask, CompositeTask } from '../TaskDelegator';
import { ServiceRegistry } from '../../../services/service-registry';
import { Task, TaskResult } from '../../../services/types';

// Mock the ServiceRegistry
jest.mock('../../../services/service-registry');

describe('TaskDelegator', () => {
  let taskDelegator: TaskDelegator;
  let mockServiceRegistry: jest.Mocked<ServiceRegistry>;

  beforeEach(() => {
    // Create a mock ServiceRegistry
    mockServiceRegistry = new ServiceRegistry() as jest.Mocked<ServiceRegistry>;

    // Mock the getAllServiceIds method
    mockServiceRegistry.getAllServiceIds.mockReturnValue(['wav2vec2', 'audioldm', 'gama']);

    // Create a TaskDelegator with the mock ServiceRegistry
    taskDelegator = new TaskDelegator(mockServiceRegistry);

    // Mock the private initializeModelCapabilities method
    (taskDelegator as any).initializeModelCapabilities = jest.fn();
    (taskDelegator as any).setDefaultCapabilities = jest.fn();
  });

  describe('selectModelForTask', () => {
    it('should select the appropriate model for a task', async () => {
      // Mock the model capabilities
      const mockCapabilities = new Map<string, ModelCapability[]>();
      mockCapabilities.set('wav2vec2', [
        {
          taskType: 'audio_process',
          confidence: 0.9,
          specializations: ['speech-to-text'],
          resourceRequirements: { memory: 2048, computeUnits: 5 },
          averageLatency: 500
        }
      ]);
      mockCapabilities.set('gama', [
        {
          taskType: 'audio-analysis',
          confidence: 0.95,
          specializations: ['pattern-recognition'],
          resourceRequirements: { memory: 3072, computeUnits: 7 },
          averageLatency: 800
        }
      ]);

      // Set the mock capabilities
      (taskDelegator as any).modelCapabilities = mockCapabilities;

      // Create a test task
      const task: Task = {
        id: 'test-task-1',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data' }
      };

      // Call the method
      const result = await taskDelegator.selectModelForTask(task);

      // Verify the result
      expect(result.modelId).toBe('gama');
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.fallbackModels).toContain('wav2vec2');
    });

    it('should route audio analysis tasks to GAMA', async () => {
      // Create a test task
      const task: Task = {
        id: 'test-task-2',
        type: 'audio-pattern-recognition',
        data: { audio: 'test-audio-data' }
      };

      // Mock the isAudioAnalysisTask method
      (taskDelegator as any).isAudioAnalysisTask = jest.fn().mockReturnValue(true);

      // Call the method
      const result = await taskDelegator.selectModelForTask(task);

      // Verify the result
      expect(result.modelId).toBe('gama');
      expect(result.fallbackModels).toContain('wav2vec2');
    });

    it('should throw an error if no suitable model is found', async () => {
      // Mock the model capabilities with empty capabilities
      (taskDelegator as any).modelCapabilities = new Map();

      // Create a test task with an unsupported type
      const task: Task = {
        id: 'test-task-3',
        type: 'unsupported-task-type',
        data: {}
      };

      // Mock the isAudioAnalysisTask method
      (taskDelegator as any).isAudioAnalysisTask = jest.fn().mockReturnValue(false);

      // Expect the method to throw an error
      await expect(taskDelegator.selectModelForTask(task)).rejects.toThrow();
    });
  });

  describe('scheduleTask', () => {
    it('should add a task to the queue with the specified priority', async () => {
      // Mock the selectModelForTask method
      taskDelegator.selectModelForTask = jest.fn().mockResolvedValue({
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

      // Call the method
      await taskDelegator.scheduleTask(task, 8);

      // Verify that the task was added to the queue
      expect((taskDelegator as any).taskQueue.length).toBe(1);
      expect((taskDelegator as any).taskQueue[0].priority).toBe(8);
      expect((taskDelegator as any).taskQueue[0].estimatedDuration).toBe(800);
    });

    it('should sort the queue by priority and deadline', async () => {
      // Mock the selectModelForTask method
      taskDelegator.selectModelForTask = jest.fn().mockResolvedValue({
        modelId: 'gama',
        confidence: 0.95,
        fallbackModels: ['wav2vec2'],
        estimatedLatency: 800
      });

      // Create test tasks
      const task1: Task = {
        id: 'test-task-5',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data-1' }
      };

      const task2: Task = {
        id: 'test-task-6',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data-2' }
      };

      const task3: Task = {
        id: 'test-task-7',
        type: 'audio-analysis',
        data: { audio: 'test-audio-data-3' }
      };

      // Add tasks with different priorities
      await taskDelegator.scheduleTask(task1, 5);
      await taskDelegator.scheduleTask(task2, 8);
      await taskDelegator.scheduleTask(task3, 3);

      // Verify that the queue is sorted by priority (highest first)
      expect((taskDelegator as any).taskQueue[0].id).toBe('test-task-6');
      expect((taskDelegator as any).taskQueue[1].id).toBe('test-task-5');
      expect((taskDelegator as any).taskQueue[2].id).toBe('test-task-7');
    });
  });

  describe('getNextTask', () => {
    it('should return the highest priority task that is ready to be processed', async () => {
      // Set up the task queue with some tasks
      (taskDelegator as any).taskQueue = [
        {
          id: 'task-1',
          type: 'audio-analysis',
          data: {},
          priority: 8,
          dependencies: []
        },
        {
          id: 'task-2',
          type: 'audio-analysis',
          data: {},
          priority: 5,
          dependencies: []
        }
      ] as PrioritizedTask[];

      // Call the method
      const nextTask = taskDelegator.getNextTask();

      // Verify the result
      expect(nextTask?.id).toBe('task-1');
      expect((taskDelegator as any).processingTasks.has('task-1')).toBe(true);
      expect((taskDelegator as any).taskQueue.length).toBe(1);
    });

    it('should not return tasks with unmet dependencies', async () => {
      // Set up the task queue with some tasks
      (taskDelegator as any).taskQueue = [
        {
          id: 'task-3',
          type: 'audio-analysis',
          data: {},
          priority: 8,
          dependencies: ['task-4']
        },
        {
          id: 'task-4',
          type: 'audio-analysis',
          data: {},
          priority: 5,
          dependencies: []
        }
      ] as PrioritizedTask[];

      // Add task-4 to the processing set
      (taskDelegator as any).processingTasks.add('task-4');

      // Call the method
      const nextTask = taskDelegator.getNextTask();

      // Verify that task-3 is not returned because its dependency is still processing
      expect(nextTask).toBeNull();
    });
  });

  describe('handleCompositeTask', () => {
    it('should handle a sequential composite task', async () => {
      // Create a mock service
      const mockService = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'subtask-1',
          success: true,
          status: 'success',
          data: { result: 'test-result' },
          metadata: { duration: 100, timestamp: Date.now() }
        })
      };

      // Mock the getService method
      mockServiceRegistry.getService.mockResolvedValue(mockService as any);

      // Create a composite task
      const compositeTask: CompositeTask = {
        id: 'composite-task-1',
        type: 'composite',
        data: {},
        subtasks: [
          {
            id: 'subtask-1',
            type: 'audio-analysis',
            data: { audio: 'test-audio-data' }
          },
          {
            id: 'subtask-2',
            type: 'audio-feature-extraction',
            data: { features: 'test-features' }
          }
        ],
        aggregationStrategy: 'sequential'
      };

      // Mock the selectModelForTask method
      taskDelegator.selectModelForTask = jest.fn().mockResolvedValue({
        modelId: 'gama',
        confidence: 0.95,
        fallbackModels: [],
        estimatedLatency: 800
      });

      // Mock the updateModelPerformance method
      (taskDelegator as any).updateModelPerformance = jest.fn();

      // Call the method
      const result = await taskDelegator.handleCompositeTask(compositeTask);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(mockService.executeTask).toHaveBeenCalledTimes(2);
      expect((taskDelegator as any).updateModelPerformance).toHaveBeenCalledTimes(2);
    });

    it('should handle a parallel composite task', async () => {
      // Create a mock service
      const mockService = {
        executeTask: jest.fn().mockResolvedValue({
          id: 'subtask-1',
          success: true,
          status: 'success',
          data: { result: 'test-result' },
          metadata: { duration: 100, timestamp: Date.now() }
        })
      };

      // Mock the getService method
      mockServiceRegistry.getService.mockResolvedValue(mockService as any);

      // Create a composite task
      const compositeTask: CompositeTask = {
        id: 'composite-task-2',
        type: 'composite',
        data: {},
        subtasks: [
          {
            id: 'subtask-3',
            type: 'audio-analysis',
            data: { audio: 'test-audio-data-1' }
          },
          {
            id: 'subtask-4',
            type: 'audio-analysis',
            data: { audio: 'test-audio-data-2' }
          }
        ],
        aggregationStrategy: 'parallel'
      };

      // Mock the selectModelForTask method
      taskDelegator.selectModelForTask = jest.fn().mockResolvedValue({
        modelId: 'gama',
        confidence: 0.95,
        fallbackModels: [],
        estimatedLatency: 800
      });

      // Mock the updateModelPerformance method
      (taskDelegator as any).updateModelPerformance = jest.fn();

      // Call the method
      const result = await taskDelegator.handleCompositeTask(compositeTask);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(mockService.executeTask).toHaveBeenCalledTimes(2);
      expect((taskDelegator as any).updateModelPerformance).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateModelPerformance', () => {
    it('should update performance metrics for a model and task type', () => {
      // Call the method
      taskDelegator.updateModelPerformance('gama', 'audio-analysis', {
        status: 'success',
        id: 'test-task',
        metadata: {
          duration: 500,
          timestamp: Date.now()
        },
        success: true
      });

      // Verify that the metrics were updated
      const metrics = (taskDelegator as any).modelPerformance.get('gama');
      expect(metrics).toBeDefined();
      expect(metrics.get('audio-analysis')).toBeDefined();
      expect(metrics.get('audio-analysis').successRate).toBeGreaterThan(0);
    });

    it('should update error metrics when a task fails', () => {
      // Call the method
      taskDelegator.updateModelPerformance('gama', 'audio-analysis', {
        status: 'error',
        id: 'test-task',
        error: new Error('Test error'),
        metadata: {
          duration: 500,
          timestamp: Date.now()
        },
        success: false
      });

      // Verify that the metrics were updated
      const metrics = (taskDelegator as any).modelPerformance.get('gama');
      expect(metrics).toBeDefined();
      expect(metrics.get('audio-analysis')).toBeDefined();
      expect(metrics.get('audio-analysis').errorRate).toBeGreaterThan(0);
    });
  });
});
