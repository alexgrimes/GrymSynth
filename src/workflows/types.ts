import { Task, TaskResult } from "../services/types";

export type WorkflowStepType =
  | "analysis"
  | "generation"
  | "conditional"
  | "transformation";

export type WorkflowStepInput = {
  source: "parameter" | "previous_step" | "context";
  key: string;
};

export type WorkflowStepCondition = {
  operator: "equals" | "contains" | "greater_than" | "less_than";
  leftOperand: string;
  rightOperand: any;
};

export type WorkflowStepNextSteps = {
  default?: string;
  conditional?: Array<{
    condition: "true" | "false";
    stepId: string;
  }>;
};

export type WorkflowStep = {
  id: string;
  type: WorkflowStepType;
  operation: string;
  inputs?: WorkflowStepInput[];
  parameters: Record<string, any>;
  condition?: WorkflowStepCondition;
  nextSteps: WorkflowStepNextSteps;
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  initialStep: string;
  steps: Record<string, WorkflowStep>;
  parameters: Record<string, any>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    version: string;
  };
};

export type WorkflowExecutionState =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type WorkflowExecutionStatus = {
  id: string;
  workflowId: string;
  workflowName: string;
  state: WorkflowExecutionState;
  currentStep: string | null;
  error: string | null;
  completedSteps: string[];
  startTime: Date | null;
  endTime: Date | null;
};

export type TaskStatus = {
  id: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  hasError: boolean;
  taskType: string;
};

export type ScheduledTask = {
  id: string;
  task: Task;
  priority: number;
  dependencies: string[];
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  result: TaskResult | null;
  error: Error | null;
};
