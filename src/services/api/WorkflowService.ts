import { apiRequest } from "./api-client";

export interface WorkflowStep {
  id: string;
  type: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowConnection {
  id: string;
  sourceStepId: string;
  targetStepId: string;
  type: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt: string;
  status: "draft" | "active" | "archived";
}

export interface WorkflowExecutionStatus {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep?: string;
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
  results?: Record<string, any>;
}

export class WorkflowService {
  private static instance: WorkflowService;

  private constructor() {}

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  async createWorkflow(
    workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt">
  ): Promise<Workflow> {
    return apiRequest.post<Workflow>("/workflows", workflow);
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return apiRequest.get<Workflow>(`/workflows/${id}`);
  }

  async updateWorkflow(
    id: string,
    updates: Partial<Workflow>
  ): Promise<Workflow> {
    return apiRequest.patch<Workflow>(`/workflows/${id}`, updates);
  }

  async deleteWorkflow(id: string): Promise<void> {
    return apiRequest.delete<void>(`/workflows/${id}`);
  }

  async listWorkflows(params?: {
    page?: number;
    limit?: number;
    status?: Workflow["status"];
  }): Promise<{ items: Workflow[]; total: number }> {
    return apiRequest.get<{ items: Workflow[]; total: number }>("/workflows", {
      params,
    });
  }

  async executeWorkflow(
    workflowId: string,
    parameters?: Record<string, any>
  ): Promise<WorkflowExecutionStatus> {
    return apiRequest.post<WorkflowExecutionStatus>(
      `/workflows/${workflowId}/execute`,
      { parameters }
    );
  }

  async getExecutionStatus(
    executionId: string
  ): Promise<WorkflowExecutionStatus> {
    return apiRequest.get<WorkflowExecutionStatus>(
      `/workflow-executions/${executionId}`
    );
  }

  async cancelExecution(executionId: string): Promise<void> {
    return apiRequest.post<void>(`/workflow-executions/${executionId}/cancel`);
  }

  async getExecutionHistory(
    workflowId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: WorkflowExecutionStatus["status"];
    }
  ): Promise<{ items: WorkflowExecutionStatus[]; total: number }> {
    return apiRequest.get<{ items: WorkflowExecutionStatus[]; total: number }>(
      `/workflows/${workflowId}/executions`,
      { params }
    );
  }

  async validateWorkflow(workflow: Partial<Workflow>): Promise<{
    isValid: boolean;
    errors?: Array<{ path: string; message: string }>;
  }> {
    return apiRequest.post<{
      isValid: boolean;
      errors?: Array<{ path: string; message: string }>;
    }>("/workflows/validate", workflow);
  }

  async getAvailableStepTypes(): Promise<
    Array<{
      type: string;
      name: string;
      description: string;
      parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
        defaultValue?: any;
      }>;
    }>
  > {
    return apiRequest.get<
      Array<{
        type: string;
        name: string;
        description: string;
        parameters: Array<{
          name: string;
          type: string;
          required: boolean;
          description: string;
          defaultValue?: any;
        }>;
      }>
    >("/workflows/step-types");
  }

  async duplicateWorkflow(
    workflowId: string,
    newName: string
  ): Promise<Workflow> {
    return apiRequest.post<Workflow>(`/workflows/${workflowId}/duplicate`, {
      name: newName,
    });
  }
}

export default WorkflowService.getInstance();
