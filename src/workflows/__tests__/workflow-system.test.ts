import { WorkflowManager } from "../workflow-manager";
import { TaskScheduler } from "../task-scheduler";
import { WorkflowExecutionState } from "../types";
import { createAudioEnhancementWorkflow } from "../templates/default-workflows";
import { MockTaskRouter, MockContextManager } from "./mocks";

describe("Workflow System", () => {
  let workflowManager: WorkflowManager;
  let taskScheduler: TaskScheduler;
  let contextManager: MockContextManager;
  let taskRouter: MockTaskRouter;

  beforeEach(() => {
    // Create dependencies with mocks
    contextManager = new MockContextManager();
    taskRouter = new MockTaskRouter(100); // 100ms simulated delay
    taskScheduler = new TaskScheduler(taskRouter as any);
    workflowManager = new WorkflowManager(contextManager as any, taskScheduler);
  });

  describe("Workflow Registration", () => {
    it("should register a valid workflow", async () => {
      const workflow = createAudioEnhancementWorkflow();
      await expect(
        workflowManager.registerWorkflow(workflow)
      ).resolves.not.toThrow();

      const registered = workflowManager.getWorkflow(workflow.id);
      expect(registered).toBeDefined();
      expect(registered?.name).toBe(workflow.name);
    });

    it("should reject invalid workflow", async () => {
      const invalidWorkflow = {
        id: "test",
        name: "Test",
        // Missing required fields
      };

      await expect(
        workflowManager.registerWorkflow(invalidWorkflow as any)
      ).rejects.toThrow();
    });
  });

  describe("Workflow Execution", () => {
    it("should start workflow execution", async () => {
      const workflow = createAudioEnhancementWorkflow();
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "test.wav",
      });

      expect(executionId).toBeDefined();

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status).toBeDefined();
      expect(status?.state).toBe("running");
    });

    it("should handle missing parameters", async () => {
      const workflow = createAudioEnhancementWorkflow();
      await workflowManager.registerWorkflow(workflow);

      await expect(
        workflowManager.startWorkflow(workflow.id, {})
      ).rejects.toThrow(/missing/i);
    });

    it("should track execution progress", async () => {
      const workflow = createAudioEnhancementWorkflow();
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "test.wav",
      });

      const getState = (): WorkflowExecutionState =>
        workflowManager.getExecutionStatus(executionId)?.state || "pending";

      // Wait for execution to complete or fail
      let state = getState();
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loop in case of issues

      while (state === "running" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        state = getState();
        attempts++;
      }

      // Should either complete or fail
      expect(["completed", "failed"]).toContain(state);
    }, 10000); // Increase timeout for async operations
  });

  describe("Error Handling", () => {
    it("should handle non-existent workflow", async () => {
      await expect(
        workflowManager.startWorkflow("non-existent", {})
      ).rejects.toThrow(/not found/i);
    });

    it("should handle execution failures", async () => {
      const workflow = createAudioEnhancementWorkflow();
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "non-existent.wav",
      });

      // Wait for execution to fail
      let status;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        await new Promise((resolve) => setTimeout(resolve, 100));
        status = workflowManager.getExecutionStatus(executionId);
        attempts++;
      } while (status?.state === "running" && attempts < maxAttempts);

      expect(status?.state).toBe("failed");
      expect(status?.error).toBeDefined();
    }, 10000);
  });

  describe("Workflow Cancellation", () => {
    it("should cancel running workflow", async () => {
      const workflow = createAudioEnhancementWorkflow();
      await workflowManager.registerWorkflow(workflow);

      const executionId = await workflowManager.startWorkflow(workflow.id, {
        audioFile: "test.wav",
      });

      const cancelled = await workflowManager.cancelExecution(executionId);
      expect(cancelled).toBe(true);

      const status = workflowManager.getExecutionStatus(executionId);
      expect(status?.state).toBe("cancelled");
    });

    it("should handle cancellation of non-existent execution", async () => {
      const cancelled = await workflowManager.cancelExecution("non-existent");
      expect(cancelled).toBe(false);
    });
  });

  describe("Workflow Stats", () => {
    it("should track workflow statistics", async () => {
      const workflow = createAudioEnhancementWorkflow();
      await workflowManager.registerWorkflow(workflow);

      // Start multiple executions
      const executions = await Promise.all([
        workflowManager.startWorkflow(workflow.id, { audioFile: "test1.wav" }),
        workflowManager.startWorkflow(workflow.id, { audioFile: "test2.wav" }),
        workflowManager.startWorkflow(workflow.id, { audioFile: "test3.wav" }),
      ]);

      const stats = workflowManager.getWorkflowStats(workflow.id);

      expect(stats.totalExecutions).toBe(3);
      expect(stats.activeExecutions).toBeGreaterThanOrEqual(0);
      expect(stats.completedExecutions).toBeGreaterThanOrEqual(0);
      expect(stats.failedExecutions).toBeGreaterThanOrEqual(0);
    });
  });
});
