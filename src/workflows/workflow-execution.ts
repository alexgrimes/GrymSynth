import { v4 as uuidv4 } from "uuid";
import { ContextManager } from "../context/context-manager";
import { ContextPersistence } from "../context/context-persistence";
import { ContextTransformer } from "../context/context-transformer";
import { AudioContextAdapter } from "../context/adapters/audio-context-adapter";
import { TaskScheduler } from "./task-scheduler";
import { Logger } from "../utils/logger";
import { Task, ContextItem } from "../services/types";
import {
  Workflow,
  WorkflowExecutionState,
  WorkflowExecutionStatus,
  WorkflowStep,
} from "./types";

export class WorkflowExecution {
  private readonly id: string;
  private readonly workflow: Workflow;
  private readonly parameters: Record<string, any>;
  private readonly contextManager: ContextManager;
  private readonly contextPersistence: ContextPersistence;
  private readonly contextTransformer: ContextTransformer;
  private readonly audioContextAdapter: AudioContextAdapter;
  private readonly taskScheduler: TaskScheduler;
  private readonly logger: Logger;
  private readonly stepResults: Map<string, any>;
  private readonly scheduledTasks: Map<string, string>;
  private readonly persistContext: boolean;
  private state: WorkflowExecutionState;
  private currentStepId: string | null;
  private error: Error | null;
  private startTime: Date | null;
  private endTime: Date | null;

  constructor(
    id: string,
    workflow: Workflow,
    parameters: Record<string, any>,
    contextManager: ContextManager,
    taskScheduler: TaskScheduler,
    options: {
      persistContext?: boolean;
      contextPersistence?: ContextPersistence;
      contextTransformer?: ContextTransformer;
    } = {}
  ) {
    this.id = id;
    this.workflow = workflow;
    this.parameters = parameters;
    this.contextManager = contextManager;
    this.taskScheduler = taskScheduler;
    this.logger = new Logger("workflow-execution-" + id);
    this.stepResults = new Map();
    this.scheduledTasks = new Map();
    this.state = "pending";
    this.currentStepId = null;
    this.error = null;
    this.startTime = null;
    this.endTime = null;

    // Context handling options
    this.persistContext = options.persistContext ?? false;
    this.contextPersistence =
      options.contextPersistence ?? new ContextPersistence();
    this.contextTransformer =
      options.contextTransformer ?? new ContextTransformer();
    this.audioContextAdapter = new AudioContextAdapter();

    // Register default transformation rules
    this.contextTransformer.registerAudioAnalysisToGenerationRules();

    // Listen for task completion events
    this.taskScheduler.on("taskCompleted", this.handleTaskCompleted.bind(this));
    this.taskScheduler.on("taskFailed", this.handleTaskFailed.bind(this));
  }

  async start(): Promise<void> {
    if (this.state !== "pending") {
      throw new Error(
        `Cannot start workflow execution in state: ${this.state}`
      );
    }

    this.logger.info(`Starting workflow execution: ${this.id}`, {
      workflowId: this.workflow.id,
      workflowName: this.workflow.name,
    });

    this.state = "running";
    this.startTime = new Date();

    // Load persisted context if available
    if (this.persistContext) {
      await this.loadPersistedContext();
    }

    // Start execution with initial step
    await this.executeStep(this.workflow.initialStep);
  }

  /**
   * Loads persisted context for this workflow if available
   */
  private async loadPersistedContext(): Promise<void> {
    try {
      const contextItems = await this.contextPersistence.loadWorkflowContext(
        this.id
      );

      if (contextItems.length > 0) {
        this.logger.info(
          `Loaded ${contextItems.length} persisted context items`
        );

        // Store loaded items in context manager
        for (const item of contextItems) {
          await this.contextManager.store(item.key, item.content, this.id);
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to load persisted context: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async cancel(): Promise<void> {
    if (this.state !== "running") {
      return;
    }

    this.logger.info(`Cancelling workflow execution: ${this.id}`);

    this.state = "cancelled";
    this.endTime = new Date();

    // Remove event listeners
    this.taskScheduler.removeAllListeners("taskCompleted");
    this.taskScheduler.removeAllListeners("taskFailed");
  }

  getStatus(): WorkflowExecutionStatus {
    return {
      id: this.id,
      workflowId: this.workflow.id,
      workflowName: this.workflow.name,
      state: this.state,
      currentStep: this.currentStepId,
      error: this.error ? this.error.message : null,
      completedSteps: Array.from(this.stepResults.keys()),
      startTime: this.startTime,
      endTime: this.endTime,
    };
  }

  private async executeStep(stepId: string): Promise<void> {
    if (this.state !== "running") {
      return;
    }

    // Get step definition
    const step = this.workflow.steps[stepId];
    if (!step) {
      await this.fail(new Error(`Step not found: ${stepId}`));
      return;
    }

    this.currentStepId = stepId;
    this.logger.info(`Executing step: ${stepId}`, { stepType: step.type });

    try {
      switch (step.type) {
        case "analysis":
        case "generation":
          await this.executeTaskStep(step);
          break;
        case "conditional":
          await this.executeConditionalStep(step);
          break;
        case "transformation":
          await this.executeTransformationStep(step);
          break;
        default:
          await this.fail(new Error(`Unsupported step type: ${step.type}`));
      }
    } catch (error) {
      await this.fail(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async executeTaskStep(step: WorkflowStep): Promise<void> {
    // Resolve input values
    const inputValues = await this.resolveInputs(step);

    // Create task
    const task: Task = {
      id: `${this.id}-${step.id}`,
      type: step.type === "analysis" ? "audio-analysis" : "audio-generation",
      modelType: step.type === "analysis" ? "wav2vec2" : "audioldm",
      operation: step.operation,
      data: {
        ...inputValues,
        ...step.parameters,
      },
      priority: "normal",
    };

    // Schedule task
    const taskId = await this.taskScheduler.scheduleTask(task);

    // Store task ID for this step
    this.scheduledTasks.set(step.id, taskId);
  }

  private async executeConditionalStep(step: WorkflowStep): Promise<void> {
    if (!step.condition) {
      await this.fail(
        new Error(`Conditional step missing condition: ${step.id}`)
      );
      return;
    }

    // Evaluate condition
    const conditionResult = await this.evaluateCondition(step.condition);

    // Determine next step
    let nextStepId: string | null = null;

    if (step.nextSteps.conditional) {
      for (const conditional of step.nextSteps.conditional) {
        if (conditional.condition === "true" && conditionResult) {
          nextStepId = conditional.stepId;
          break;
        } else if (conditional.condition === "false" && !conditionResult) {
          nextStepId = conditional.stepId;
          break;
        }
      }
    }

    if (!nextStepId && step.nextSteps.default) {
      nextStepId = step.nextSteps.default;
    }

    // Store result
    this.stepResults.set(step.id, { conditionResult });

    // Execute next step if exists
    if (nextStepId) {
      await this.executeStep(nextStepId);
    } else {
      // Workflow complete if no next step
      await this.complete();
    }
  }

  private async executeTransformationStep(step: WorkflowStep): Promise<void> {
    // Resolve input values
    const inputValues = await this.resolveInputs(step);

    // Execute transformation based on operation
    let result;

    switch (step.operation) {
      case "export":
        // Export transformation
        result = {
          ...inputValues,
          format: step.parameters.format,
          exportedAt: new Date(),
        };
        break;
      // Add other transformation types as needed
      default:
        throw new Error(
          `Unsupported transformation operation: ${step.operation}`
        );
    }

    // Store result
    this.stepResults.set(step.id, result);

    // Execute next step if exists
    if (step.nextSteps.default) {
      await this.executeStep(step.nextSteps.default);
    } else {
      // Workflow complete if no next step
      await this.complete();
    }
  }

  private async resolveInputs(
    step: WorkflowStep
  ): Promise<Record<string, any>> {
    const resolvedInputs: Record<string, any> = {};

    if (!step.inputs) {
      return resolvedInputs;
    }

    for (const input of step.inputs) {
      switch (input.source) {
        case "parameter":
          resolvedInputs[input.key] = this.parameters[input.key];
          break;
        case "previous_step": {
          const [stepId, path] = input.key.split(".");
          const stepResult = this.stepResults.get(stepId);

          if (!stepResult) {
            throw new Error(`Step result not found: ${stepId}`);
          }

          if (path === "result") {
            resolvedInputs[input.key] = stepResult;
          } else {
            // Resolve nested path
            const parts = path.split(".");
            let value = stepResult;

            for (const part of parts) {
              if (value && typeof value === "object") {
                value = value[part];
              } else {
                value = undefined;
                break;
              }
            }

            resolvedInputs[input.key] = value;
          }
          break;
        }
        case "context": {
          // Resolve from context
          const contextItems = await this.contextManager.query({
            key: input.key,
            workflowId: this.id,
          });

          if (contextItems && contextItems.length > 0) {
            resolvedInputs[input.key] = contextItems[0].content;
          }
          break;
        }
      }
    }

    return resolvedInputs;
  }

  private async evaluateCondition(
    condition: WorkflowStep["condition"]
  ): Promise<boolean> {
    if (!condition) {
      return true;
    }

    const { operator, leftOperand, rightOperand } = condition;

    // Resolve left operand (could be a path to a result)
    let leftValue: any;

    if (leftOperand.includes(".")) {
      const [stepId, path] = leftOperand.split(".");
      const stepResult = this.stepResults.get(stepId);

      if (!stepResult) {
        throw new Error(`Step result not found for condition: ${stepId}`);
      }

      // Resolve nested path
      const parts = path.split(".");
      let value = stepResult;

      for (const part of parts) {
        if (value && typeof value === "object") {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }

      leftValue = value;
    } else {
      // Direct value or parameter
      leftValue = this.parameters[leftOperand] || leftOperand;
    }

    // Evaluate condition
    switch (operator) {
      case "equals":
        return leftValue === rightOperand;
      case "contains":
        return (
          typeof leftValue === "string" && leftValue.includes(rightOperand)
        );
      case "greater_than":
        return leftValue > rightOperand;
      case "less_than":
        return leftValue < rightOperand;
      default:
        throw new Error(`Unsupported condition operator: ${operator}`);
    }
  }

  private async handleTaskCompleted(
    taskId: string,
    result: any
  ): Promise<void> {
    // Find corresponding step
    const stepEntry = Array.from(this.scheduledTasks.entries()).find(
      ([_, id]) => id === taskId
    );

    if (!stepEntry) {
      return;
    }

    const [stepId, _] = stepEntry;

    this.logger.info(`Step completed: ${stepId}`, {
      taskId,
      resultStatus: result.status,
    });

    // Store result
    this.stepResults.set(stepId, result);

    // Get step
    const step = this.workflow.steps[stepId];

    // Process and store context from the result
    await this.processStepContext(stepId, step, result);

    // Execute next step if exists
    if (step.nextSteps.default) {
      // Transform context for the next step if needed
      if (step.type === "analysis" || step.type === "generation") {
        await this.transformContextForNextStep(
          stepId,
          step.nextSteps.default,
          result
        );
      }

      await this.executeStep(step.nextSteps.default);
    } else {
      // Check if this is the last step
      const hasNextStep = Object.values(this.workflow.steps).some(
        (s) =>
          s.nextSteps.default === stepId ||
          (s.nextSteps.conditional &&
            s.nextSteps.conditional.some((c) => c.stepId === stepId))
      );

      if (!hasNextStep) {
        // Persist context if enabled
        if (this.persistContext) {
          await this.persistWorkflowContext();
        }

        await this.complete();
      }
    }
  }

  /**
   * Processes and stores context from a step result
   * @param stepId ID of the completed step
   * @param step Step definition
   * @param result Step execution result
   */
  private async processStepContext(
    stepId: string,
    step: WorkflowStep,
    result: any
  ): Promise<void> {
    if (!result || result.status !== "success" || !result.data) {
      return;
    }

    try {
      // Extract context based on step type
      switch (step.type) {
        case "analysis":
          // Store analysis results in context
          if (result.data.analysis) {
            await this.contextManager.store(
              `analysis-${stepId}`,
              { analysis: result.data.analysis },
              this.id
            );

            // Store specific analysis components if available
            if (result.data.analysis.features) {
              await this.contextManager.store(
                "audio_parameters",
                { features: result.data.analysis.features },
                this.id
              );
            }

            if (result.data.analysis.quality) {
              await this.contextManager.store(
                "processing_requirements",
                { quality: result.data.analysis.quality },
                this.id
              );
            }
          }
          break;

        case "generation":
          // Store generation results in context
          if (result.data.audio) {
            await this.contextManager.store(
              `generation-${stepId}`,
              { audio: result.data.audio },
              this.id
            );
          }

          // Store generation parameters if available
          if (result.data.parameters) {
            await this.contextManager.store(
              "generation_parameters",
              result.data.parameters,
              this.id
            );
          }
          break;
      }

      this.logger.debug(`Processed context for step: ${stepId}`);
    } catch (error) {
      this.logger.error(`Error processing step context: ${stepId}`, { error });
    }
  }

  /**
   * Transforms context from one step to another using the context transformer
   * @param sourceStepId ID of the source step
   * @param targetStepId ID of the target step
   * @param sourceContext Source context data
   */
  private async transformContextForNextStep(
    sourceStepId: string,
    targetStepId: string,
    sourceContext: any
  ): Promise<void> {
    try {
      // Get target step type
      const targetStep = this.workflow.steps[targetStepId];
      if (!targetStep) {
        return;
      }

      // Only transform between analysis and generation steps
      if (
        !(
          (sourceStepId.includes("analysis") &&
            targetStepId.includes("generation")) ||
          (sourceStepId.includes("generation") &&
            targetStepId.includes("analysis"))
        )
      ) {
        return;
      }

      // Transform context
      const transformedItems = this.contextTransformer.transformContext(
        sourceStepId,
        targetStepId,
        sourceContext
      );

      // Store transformed items
      for (const item of transformedItems) {
        await this.contextManager.store(item.key, item.content, this.id);
      }

      this.logger.debug(
        `Transformed context from ${sourceStepId} to ${targetStepId}: ${transformedItems.length} items`
      );
    } catch (error) {
      this.logger.error(
        `Error transforming context: ${sourceStepId} -> ${targetStepId}`,
        {
          error,
        }
      );
    }
  }

  /**
   * Persists all workflow context to storage
   */
  private async persistWorkflowContext(): Promise<void> {
    try {
      // Get all context items for this workflow
      const allContextItems: ContextItem[] = [];

      // Collect from all known context keys
      const contextKeys = [
        "audio_parameters",
        "processing_requirements",
        "stylistic_preferences",
        "generation_parameters",
        "task_history",
        "prompt",
      ];

      for (const key of contextKeys) {
        const items = await this.contextManager.query({
          key,
          workflowId: this.id,
        });

        allContextItems.push(...items);
      }

      // Add step-specific context
      for (const stepId of this.stepResults.keys()) {
        const analysisItems = await this.contextManager.query({
          key: `analysis-${stepId}`,
          workflowId: this.id,
        });

        const generationItems = await this.contextManager.query({
          key: `generation-${stepId}`,
          workflowId: this.id,
        });

        allContextItems.push(...analysisItems, ...generationItems);
      }

      // Persist to storage
      if (allContextItems.length > 0) {
        await this.contextPersistence.saveWorkflowContext(
          this.id,
          allContextItems
        );
        this.logger.info(`Persisted ${allContextItems.length} context items`);
      }
    } catch (error) {
      this.logger.error(`Error persisting workflow context`, { error });
    }
  }

  private async handleTaskFailed(taskId: string, error: Error): Promise<void> {
    // Find corresponding step
    const stepEntry = Array.from(this.scheduledTasks.entries()).find(
      ([_, id]) => id === taskId
    );

    if (!stepEntry) {
      return;
    }

    const [stepId, _] = stepEntry;

    this.logger.error(`Step failed: ${stepId}`, { taskId, error });

    // Fail workflow
    await this.fail(new Error(`Step ${stepId} failed: ${error.message}`));
  }

  private async complete(): Promise<void> {
    if (this.state !== "running") {
      return;
    }

    this.logger.info(`Workflow execution completed: ${this.id}`);

    this.state = "completed";
    this.endTime = new Date();

    // Remove event listeners
    this.taskScheduler.removeAllListeners("taskCompleted");
    this.taskScheduler.removeAllListeners("taskFailed");
  }

  private async fail(error: Error): Promise<void> {
    if (this.state !== "running") {
      return;
    }

    this.logger.error(`Workflow execution failed: ${this.id}`, { error });

    this.state = "failed";
    this.error = error;
    this.endTime = new Date();

    // Remove event listeners
    this.taskScheduler.removeAllListeners("taskCompleted");
    this.taskScheduler.removeAllListeners("taskFailed");
  }
}
