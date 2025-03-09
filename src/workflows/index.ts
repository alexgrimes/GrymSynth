// Import types first
import {
  Workflow,
  WorkflowStep,
  WorkflowStepType,
  WorkflowStepInput,
  WorkflowStepCondition,
  WorkflowStepNextSteps,
  WorkflowExecutionState,
  WorkflowExecutionStatus,
  TaskStatus,
  ScheduledTask,
} from "./types";

// Core classes
export { WorkflowManager } from "./workflow-manager";
export { TaskScheduler } from "./task-scheduler";
export { WorkflowExecution } from "./workflow-execution";
export { WorkflowValidator } from "./workflow-validator";

// Template workflows
export {
  createAudioEnhancementWorkflow,
  createAudioTranscriptionWorkflow,
} from "./templates/default-workflows";

// Re-export all types
export type {
  Workflow,
  WorkflowStep,
  WorkflowStepType,
  WorkflowStepInput,
  WorkflowStepCondition,
  WorkflowStepNextSteps,
  WorkflowExecutionState,
  WorkflowExecutionStatus,
  TaskStatus,
  ScheduledTask,
};

// Template functions for creating custom workflows
export function createEmptyWorkflow(
  name: string,
  description: string = ""
): Workflow {
  return {
    id: "", // Will be set when registered
    name,
    description,
    initialStep: "",
    steps: {},
    parameters: {},
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "user",
      version: "1.0.0",
    },
  };
}

export function createWorkflowStep(
  id: string,
  type: WorkflowStepType,
  operation: string
): WorkflowStep {
  return {
    id,
    type,
    operation,
    inputs: [],
    parameters: {},
    nextSteps: {},
  };
}

// Common workflow utilities
export const workflowUtils = {
  /**
   * Validates if all required parameters are present
   */
  validateWorkflowParameters(
    workflow: Workflow,
    parameters: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(workflow.parameters)) {
      if (value === null && !(key in parameters)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Deep clone a workflow definition
   */
  cloneWorkflow(workflow: Workflow): Workflow {
    return JSON.parse(JSON.stringify(workflow));
  },

  /**
   * Find all steps that have no incoming connections (besides initial step)
   */
  findOrphanedSteps(workflow: Workflow): string[] {
    const reachableSteps = new Set<string>([workflow.initialStep]);

    // Traverse workflow to find all reachable steps
    const traverse = (stepId: string) => {
      const step = workflow.steps[stepId];
      if (!step) return;

      if (step.nextSteps.default) {
        reachableSteps.add(step.nextSteps.default);
        traverse(step.nextSteps.default);
      }

      if (step.nextSteps.conditional) {
        for (const condition of step.nextSteps.conditional) {
          reachableSteps.add(condition.stepId);
          traverse(condition.stepId);
        }
      }
    };

    traverse(workflow.initialStep);

    // Return all steps that aren't reachable
    return Object.keys(workflow.steps).filter(
      (stepId) => !reachableSteps.has(stepId)
    );
  },

  /**
   * Find terminal steps (steps with no next steps)
   */
  findTerminalSteps(workflow: Workflow): string[] {
    return Object.entries(workflow.steps)
      .filter(
        ([_, step]) =>
          !step.nextSteps.default &&
          (!step.nextSteps.conditional ||
            step.nextSteps.conditional.length === 0)
      )
      .map(([id]) => id);
  },
};
