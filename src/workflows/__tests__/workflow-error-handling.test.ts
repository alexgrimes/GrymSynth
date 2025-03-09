import { WorkflowManager } from "../workflow-manager";
import { TaskScheduler } from "../task-scheduler";
import { MockTaskRouter, MockContextManager } from "./mocks";
import {
  createLinearWorkflow,
  createBranchingWorkflow,
  waitForWorkflowCompletion,
} from "./test-helpers";

describe("Workflow Error Handling", () => {
  let workflowManager: WorkflowManager;
  let taskScheduler: TaskScheduler;
  let contextManager: MockContextManager;
  let taskRouter: MockTaskRouter;

  beforeEach(() => {
    contextManager = new MockContextManager();
    taskRouter = new MockTaskRouter(50); // Fast execution for tests
    taskScheduler = new TaskScheduler(taskRouter as any);
    workflowManager = new WorkflowManager(contextManager as any, taskScheduler);
  });

  describe("Step Failure Handling", () => {
    it("should handle step failure and mark workflow as failed", async () => {
      const workflow = createLinearWorkflow(3);
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "non-existent.wav", // This will trigger an error in the mock
      });

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status?.state).toBe("failed");
      expect(status?.error).toMatch(/file not found/i);
    });

    it("should not execute subsequent steps after failure", async () => {
      const workflow = createLinearWorkflow(5);
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "non-existent.wav",
      });

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status?.completedSteps.length).toBeLessThan(5);
    });
  });

  describe("Conditional Path Error Handling", () => {
    it("should handle errors in conditional evaluation", async () => {
      const workflow = createBranchingWorkflow();
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        // Missing required data for condition evaluation
        audioFile: "test.wav",
      });

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status?.state).toBe("failed");
      expect(status?.error).toBeDefined();
    });

    it("should follow error path in conditional step", async () => {
      const workflow = createBranchingWorkflow();
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "test.wav",
        forceError: true, // Mock will use this to force error path
      });

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status?.completedSteps).toContain("failure-path");
    });
  });

  describe("Resource Cleanup", () => {
    it("should clean up resources on failure", async () => {
      const workflow = createLinearWorkflow(3);
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "non-existent.wav",
      });

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      // Check if task scheduler has cleaned up the tasks
      const schedulerState = (taskScheduler as any).getState();
      expect(schedulerState.runningTasks.size).toBe(0);
    });

    it("should clean up resources on cancellation", async () => {
      const workflow = createLinearWorkflow(3);
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "test.wav",
      });

      // Cancel immediately
      await workflowManager.cancelExecution(executionId);

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      // Check if resources were cleaned up
      const schedulerState = (taskScheduler as any).getState();
      expect(schedulerState.runningTasks.size).toBe(0);
    });
  });

  describe("Error Recovery", () => {
    it("should handle transient failures gracefully", async () => {
      // Configure mock to fail temporarily
      (taskRouter as any).setFailureMode("transient", 2); // Fail twice then succeed

      const workflow = createLinearWorkflow(1);
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "test.wav",
      });

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status?.state).toBe("completed");
    });

    it("should fail after max retries exceeded", async () => {
      // Configure mock to always fail
      (taskRouter as any).setFailureMode("permanent");

      const workflow = createLinearWorkflow(1);
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "test.wav",
      });

      await waitForWorkflowCompletion(() =>
        workflowManager.getExecutionStatus(executionId)
      );

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status?.state).toBe("failed");
      expect(status?.error).toMatch(/max retries exceeded/i);
    });
  });
});
