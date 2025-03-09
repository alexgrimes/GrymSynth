import { v4 as uuidv4 } from "uuid";
import { Logger } from "../utils/logger";
import { ContextManager } from "../context/context-manager";
import { TaskScheduler } from "./task-scheduler";
import { WorkflowValidator } from "./workflow-validator";
import { Workflow, WorkflowExecutionStatus } from "./types";
import { WorkflowExecution } from "./workflow-execution";

export class WorkflowManager {
  private workflowRegistry: Map<string, Workflow>;
  private activeWorkflows: Map<string, WorkflowExecution>;
  private readonly contextManager: ContextManager;
  private readonly taskScheduler: TaskScheduler;
  private readonly logger: Logger;
  private readonly validator: WorkflowValidator;

  constructor(contextManager: ContextManager, taskScheduler: TaskScheduler) {
    this.workflowRegistry = new Map();
    this.activeWorkflows = new Map();
    this.contextManager = contextManager;
    this.taskScheduler = taskScheduler;
    this.logger = new Logger("workflow-manager");
    this.validator = new WorkflowValidator();
  }

  async registerWorkflow(workflow: Workflow): Promise<void> {
    // Validate workflow structure
    const validationResult = this.validator.validateWorkflow(workflow);
    if (!validationResult.valid) {
      throw new Error(
        `Invalid workflow: ${validationResult.errors.join(", ")}`
      );
    }

    // Store workflow in registry
    this.workflowRegistry.set(workflow.id, workflow);
    this.logger.info(`Registered workflow: ${workflow.id}`, {
      name: workflow.name,
      initialStep: workflow.initialStep,
      stepsCount: Object.keys(workflow.steps).length,
    });
  }

  async startWorkflow(
    workflowId: string,
    parameters: Record<string, any>
  ): Promise<string> {
    // Get workflow definition
    const workflow = this.workflowRegistry.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Validate parameters
    const validationResult = this.validator.validateParameters(
      workflow,
      parameters
    );
    if (!validationResult.valid) {
      throw new Error(
        `Invalid parameters: ${validationResult.errors.join(", ")}`
      );
    }

    // Create workflow execution
    const executionId = uuidv4();
    const execution = new WorkflowExecution(
      executionId,
      workflow,
      parameters,
      this.contextManager,
      this.taskScheduler
    );

    // Store execution
    this.activeWorkflows.set(executionId, execution);

    // Start execution asynchronously
    execution.start().catch((error) => {
      this.logger.error(`Workflow execution failed: ${error.message}`, {
        workflowId,
        executionId,
        error,
      });
    });

    this.logger.info(`Started workflow execution: ${executionId}`, {
      workflowId,
      name: workflow.name,
    });

    return executionId;
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflowRegistry.get(workflowId);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflowRegistry.values());
  }

  getExecutionStatus(executionId: string): WorkflowExecutionStatus | undefined {
    const execution = this.activeWorkflows.get(executionId);
    if (!execution) {
      return undefined;
    }

    return execution.getStatus();
  }

  listExecutions(): WorkflowExecutionStatus[] {
    return Array.from(this.activeWorkflows.values()).map((execution) =>
      execution.getStatus()
    );
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeWorkflows.get(executionId);
    if (!execution) {
      return false;
    }

    await execution.cancel();
    this.logger.info(`Cancelled workflow execution: ${executionId}`);

    return true;
  }

  async cleanupCompletedExecutions(
    olderThanMs: number = 3600000
  ): Promise<number> {
    const now = Date.now();
    let count = 0;

    for (const [id, execution] of this.activeWorkflows.entries()) {
      const status = execution.getStatus();

      if (
        (status.state === "completed" ||
          status.state === "failed" ||
          status.state === "cancelled") &&
        status.endTime &&
        now - status.endTime.getTime() > olderThanMs
      ) {
        this.activeWorkflows.delete(id);
        count++;
      }
    }

    if (count > 0) {
      this.logger.info(`Cleaned up ${count} completed workflow executions`);
    }

    return count;
  }

  // Optional: Add methods for workflow versioning, templates, etc.
  async createWorkflowVersion(
    workflowId: string,
    version: string
  ): Promise<string> {
    const workflow = this.workflowRegistry.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const newWorkflow: Workflow = {
      ...workflow,
      id: uuidv4(),
      metadata: {
        ...workflow.metadata,
        version,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    await this.registerWorkflow(newWorkflow);
    return newWorkflow.id;
  }

  // Optional: Add methods for workflow stats and monitoring
  getWorkflowStats(workflowId: string): {
    totalExecutions: number;
    activeExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
  } {
    const executions = Array.from(this.activeWorkflows.values())
      .filter((execution) => execution.getStatus().workflowId === workflowId)
      .map((execution) => execution.getStatus());

    return {
      totalExecutions: executions.length,
      activeExecutions: executions.filter((e) => e.state === "running").length,
      completedExecutions: executions.filter((e) => e.state === "completed")
        .length,
      failedExecutions: executions.filter((e) => e.state === "failed").length,
    };
  }
}
