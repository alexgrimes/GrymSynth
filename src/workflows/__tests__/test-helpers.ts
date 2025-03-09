import { v4 as uuidv4 } from "uuid";
import { Workflow, WorkflowStep, WorkflowStepType } from "../types";

/**
 * Creates a test workflow step with basic configuration
 */
export function createTestStep(
  id: string,
  type: WorkflowStepType,
  operation: string,
  nextStepId?: string
): WorkflowStep {
  return {
    id,
    type,
    operation,
    inputs: [],
    parameters: {},
    nextSteps: nextStepId ? { default: nextStepId } : {},
  };
}

/**
 * Creates a test workflow with the specified steps
 */
export function createTestWorkflow(
  steps: WorkflowStep[],
  initialStepId: string
): Workflow {
  const stepsMap: Record<string, WorkflowStep> = {};
  steps.forEach((step) => {
    stepsMap[step.id] = step;
  });

  return {
    id: uuidv4(),
    name: "Test Workflow",
    description: "Workflow for testing",
    initialStep: initialStepId,
    steps: stepsMap,
    parameters: {},
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "test",
      version: "1.0.0",
    },
  };
}

/**
 * Creates a linear workflow with the specified number of steps
 */
export function createLinearWorkflow(stepCount: number): Workflow {
  const steps: WorkflowStep[] = [];

  for (let i = 0; i < stepCount; i++) {
    const stepId = `step-${i}`;
    const nextStepId = i < stepCount - 1 ? `step-${i + 1}` : undefined;

    steps.push(
      createTestStep(stepId, "analysis", "test-operation", nextStepId)
    );
  }

  return createTestWorkflow(steps, "step-0");
}

/**
 * Creates a branching workflow with conditional paths
 */
export function createBranchingWorkflow(): Workflow {
  const steps: WorkflowStep[] = [
    // Initial step
    {
      id: "start",
      type: "analysis",
      operation: "analyze",
      inputs: [],
      parameters: {},
      nextSteps: {
        default: "condition",
      },
    },
    // Conditional step
    {
      id: "condition",
      type: "conditional",
      operation: "check",
      inputs: [
        {
          source: "previous_step",
          key: "start.result",
        },
      ],
      parameters: {},
      condition: {
        operator: "equals",
        leftOperand: "result.value",
        rightOperand: true,
      },
      nextSteps: {
        conditional: [
          {
            condition: "true",
            stepId: "success-path",
          },
          {
            condition: "false",
            stepId: "failure-path",
          },
        ],
      },
    },
    // Success path
    {
      id: "success-path",
      type: "generation",
      operation: "generate",
      inputs: [],
      parameters: {},
      nextSteps: {
        default: "final",
      },
    },
    // Failure path
    {
      id: "failure-path",
      type: "transformation",
      operation: "transform",
      inputs: [],
      parameters: {},
      nextSteps: {
        default: "final",
      },
    },
    // Final step
    {
      id: "final",
      type: "transformation",
      operation: "export",
      inputs: [],
      parameters: {},
      nextSteps: {},
    },
  ];

  return createTestWorkflow(steps, "start");
}

/**
 * Waits for a workflow execution to reach a terminal state
 */
export async function waitForWorkflowCompletion(
  getStatus: () => { state: string } | undefined,
  timeoutMs: number = 5000
): Promise<void> {
  const startTime = Date.now();

  while (true) {
    const status = getStatus();

    if (
      !status ||
      status.state === "completed" ||
      status.state === "failed" ||
      status.state === "cancelled"
    ) {
      return;
    }

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Workflow execution timed out after ${timeoutMs}ms`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
