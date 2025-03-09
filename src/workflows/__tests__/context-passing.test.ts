import { ContextManager } from "../../context/context-manager";
import { ContextPersistence } from "../../context/context-persistence";
import { ContextTransformer } from "../../context/context-transformer";
import { AudioContextAdapter } from "../../context/adapters/audio-context-adapter";
import {
  ContextItemType,
  ContextItem as ContextTypeItem,
} from "../../context/types";
import { TaskScheduler } from "../task-scheduler";
import { WorkflowExecution } from "../workflow-execution";
import { Workflow, WorkflowStep } from "../types";
import { Task, TaskResult, ContextItem } from "../../services/types";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";

// Helper function to convert between context item types
const convertToContextTypeItem = (item: ContextItem): ContextTypeItem => {
  return {
    ...item,
    type: item.key as ContextItemType,
  };
};

// Mock the fs module
jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue("[]"),
    readdir: jest.fn().mockResolvedValue([]),
    mkdir: jest.fn().mockResolvedValue(undefined),
    rmdir: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(false),
  mkdirSync: jest.fn(),
}));

describe("Workflow Context Passing", () => {
  let contextManager: ContextManager;
  let taskScheduler: TaskScheduler;
  let contextTransformer: ContextTransformer;
  let contextPersistence: ContextPersistence;
  let mockTaskEmitter: EventEmitter;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create context manager
    contextManager = new ContextManager();

    // Create mock task scheduler
    mockTaskEmitter = new EventEmitter();
    taskScheduler = {
      scheduleTask: jest.fn().mockImplementation((task: Task) => {
        return Promise.resolve(task.id);
      }),
      on: jest.fn().mockImplementation((event, listener) => {
        mockTaskEmitter.on(event, listener);
        return taskScheduler;
      }),
      removeAllListeners: jest.fn().mockImplementation((event) => {
        mockTaskEmitter.removeAllListeners(event);
        return taskScheduler;
      }),
    } as unknown as TaskScheduler;

    // Create context transformer with spy
    contextTransformer = new ContextTransformer();
    jest.spyOn(contextTransformer, "transformContext");

    // Create context persistence with spy
    contextPersistence = new ContextPersistence();
    jest.spyOn(contextPersistence, "saveWorkflowContext");
    jest.spyOn(contextPersistence, "loadWorkflowContext");
  });

  const createTestWorkflow = (): Workflow => {
    const analysisStep: WorkflowStep = {
      id: "analysis-step",
      type: "analysis",
      operation: "analyze-audio",
      parameters: {
        analysisType: "features",
      },
      nextSteps: {
        default: "generation-step",
      },
    };

    const generationStep: WorkflowStep = {
      id: "generation-step",
      type: "generation",
      operation: "generate-audio",
      inputs: [
        {
          source: "context",
          key: "audio_parameters",
        },
        {
          source: "context",
          key: "processing_requirements",
        },
      ],
      parameters: {
        duration: 5,
      },
      nextSteps: {
        default: "export-step",
      },
    };

    const exportStep: WorkflowStep = {
      id: "export-step",
      type: "transformation",
      operation: "export",
      inputs: [
        {
          source: "previous_step",
          key: "generation-step.result",
        },
      ],
      parameters: {
        format: "wav",
      },
      nextSteps: {},
    };

    return {
      id: "test-workflow",
      name: "Test Workflow",
      description: "A test workflow for context passing",
      initialStep: "analysis-step",
      steps: {
        "analysis-step": analysisStep,
        "generation-step": generationStep,
        "export-step": exportStep,
      },
      parameters: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "test",
        version: "1.0.0",
      },
    };
  };

  const mockAnalysisResult = (): TaskResult => ({
    id: "analysis-task",
    status: "success",
    data: {
      analysis: {
        features: {
          tempo: 120,
          energy: 0.8,
          complexity: 0.6,
          brightness: 0.7,
        },
        quality: {
          overall: 0.85,
          clarity: 0.9,
          noise: 0.2,
        },
        patterns: [
          {
            name: "rhythm-pattern-1",
            description: "steady beat with syncopation",
            confidence: 0.92,
          },
        ],
      },
    },
  });

  const mockGenerationResult = (): TaskResult => ({
    id: "generation-task",
    status: "success",
    data: {
      audio: {
        path: "/path/to/generated.wav",
        duration: 5.2,
      },
      parameters: {
        prompt: "electronic music with steady beat",
        temperature: 1.0,
        guidanceScale: 5.0,
        diffusionSteps: 75,
      },
    },
  });

  test("should pass context between workflow steps", async () => {
    // Create workflow execution
    const workflow = createTestWorkflow();
    const workflowExecution = new WorkflowExecution(
      "test-execution",
      workflow,
      {},
      contextManager,
      taskScheduler,
      {
        contextTransformer,
      }
    );

    // Start workflow execution
    await workflowExecution.start();

    // Verify analysis step was scheduled
    expect(taskScheduler.scheduleTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "audio-analysis",
        modelType: "wav2vec2",
        operation: "analyze-audio",
      })
    );

    // Simulate analysis task completion
    const analysisResult = mockAnalysisResult();
    await mockTaskEmitter.emit(
      "taskCompleted",
      "test-execution-analysis-step",
      analysisResult
    );

    // Verify context was stored
    const audioParamsItems = await contextManager.query({
      key: "audio_parameters",
      workflowId: "test-execution",
    });

    expect(audioParamsItems.length).toBeGreaterThan(0);
    expect(audioParamsItems[0].content).toHaveProperty("features");
    expect(audioParamsItems[0].content.features).toHaveProperty("tempo", 120);

    // Verify context transformer was called
    expect(contextTransformer.transformContext).toHaveBeenCalledWith(
      "analysis-step",
      "generation-step",
      expect.anything()
    );

    // Verify generation step was scheduled
    expect(taskScheduler.scheduleTask).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "audio-generation",
        modelType: "audioldm",
        operation: "generate-audio",
      })
    );

    // Simulate generation task completion
    const generationResult = mockGenerationResult();
    await mockTaskEmitter.emit(
      "taskCompleted",
      "test-execution-generation-step",
      generationResult
    );

    // Verify generation parameters were stored in context
    const genParamsItems = await contextManager.query({
      key: "generation_parameters",
      workflowId: "test-execution",
    });

    expect(genParamsItems.length).toBeGreaterThan(0);
    expect(genParamsItems[0].content).toHaveProperty("prompt");
    expect(genParamsItems[0].content).toHaveProperty("guidanceScale");

    // Verify workflow completed successfully
    const status = workflowExecution.getStatus();
    expect(status.state).toBe("completed");
  });

  test("should persist and load workflow context", async () => {
    // Mock fs.existsSync to return true for context directory
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock fs.promises.readFile to return mock context items
    const mockContextItems = [
      {
        id: "audio-params-1",
        key: "audio_parameters",
        type: "audio_parameters" as ContextItemType,
        content: { features: { tempo: 120 } },
        timestamp: new Date().toISOString(),
        workflowId: "test-execution",
      },
    ];

    (fs.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockContextItems)
    );

    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      "audio_parameters.json",
    ]);

    // Create workflow execution with persistence enabled
    const workflow = createTestWorkflow();
    const workflowExecution = new WorkflowExecution(
      "test-execution",
      workflow,
      {},
      contextManager,
      taskScheduler,
      {
        persistContext: true,
        contextPersistence,
      }
    );

    // Start workflow execution (should load persisted context)
    await workflowExecution.start();

    // Verify context was loaded
    expect(contextPersistence.loadWorkflowContext).toHaveBeenCalledWith(
      "test-execution"
    );

    // Complete workflow
    const analysisResult = mockAnalysisResult();
    await mockTaskEmitter.emit(
      "taskCompleted",
      "test-execution-analysis-step",
      analysisResult
    );

    const generationResult = mockGenerationResult();
    await mockTaskEmitter.emit(
      "taskCompleted",
      "test-execution-generation-step",
      generationResult
    );

    // Verify context was persisted
    expect(contextPersistence.saveWorkflowContext).toHaveBeenCalledWith(
      "test-execution",
      expect.any(Array)
    );
  });

  test("should adapt context using AudioContextAdapter", async () => {
    // Create audio context adapter with spy
    const audioContextAdapter = new AudioContextAdapter();
    jest.spyOn(audioContextAdapter, "adaptContext");

    // Store test context items
    await contextManager.store(
      "audio_parameters",
      { sampleRate: 48000, channels: 2 },
      "test-execution"
    );

    await contextManager.store(
      "processing_requirements",
      { quality: "high", priority: 8 },
      "test-execution"
    );

    await contextManager.store(
      "stylistic_preferences",
      { genre: "electronic", tempo: 128 },
      "test-execution"
    );

    // Query context items
    const items = await contextManager.query({
      key: "audio_parameters",
      workflowId: "test-execution",
    });

    // Convert service context items to context type items
    const typeItems = items.map((item) => convertToContextTypeItem(item));

    // Adapt context
    const adaptedContext = audioContextAdapter.adaptContext(typeItems);

    // Verify adapted context
    expect(adaptedContext).toHaveProperty("audioParameters");
    expect(adaptedContext.audioParameters).toHaveProperty("sampleRate", 48000);
    expect(adaptedContext).toHaveProperty("processingRequirements");
    expect(adaptedContext).toHaveProperty("stylistic");
  });
});
