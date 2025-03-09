import { WorkflowManager } from "../workflow-manager";
import { TaskScheduler } from "../task-scheduler";
import { MockTaskRouter, MockContextManager } from "./mocks";
import {
  createLinearWorkflow,
  createBranchingWorkflow,
  waitForWorkflowCompletion,
} from "./test-helpers";
import { performance } from "perf_hooks";

describe("Workflow Performance", () => {
  let workflowManager: WorkflowManager;
  let taskScheduler: TaskScheduler;
  let contextManager: MockContextManager;
  let taskRouter: MockTaskRouter;

  beforeEach(() => {
    contextManager = new MockContextManager();
    taskRouter = new MockTaskRouter(10); // Fast execution for performance tests
    taskScheduler = new TaskScheduler(taskRouter as any);
    workflowManager = new WorkflowManager(contextManager as any, taskScheduler);
  });

  describe("Concurrent Execution", () => {
    it("should handle multiple concurrent workflow executions", async () => {
      const workflow = createLinearWorkflow(3);
      await workflowManager.registerWorkflow(workflow);

      const concurrentExecutions = 10;
      const startTime = performance.now();

      // Start multiple executions concurrently
      const executionPromises = Array.from(
        { length: concurrentExecutions },
        (_, i) =>
          workflowManager.startWorkflow(workflow.id, {
            audioFile: `test${i}.wav`,
          })
      );

      const executionIds = await Promise.all(executionPromises);

      // Wait for all executions to complete
      await Promise.all(
        executionIds.map((id) =>
          waitForWorkflowCompletion(() =>
            workflowManager.getExecutionStatus(id)
          )
        )
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify all executions completed successfully
      const statuses = executionIds.map((id) =>
        workflowManager.getExecutionStatus(id)
      );
      expect(statuses.every((s) => s?.state === "completed")).toBe(true);

      // Log performance metrics
      console.log(
        `Completed ${concurrentExecutions} concurrent executions in ${totalTime}ms`
      );
      console.log(
        `Average time per execution: ${totalTime / concurrentExecutions}ms`
      );
    }, 30000); // Increase timeout for concurrent operations
  });

  describe("Throughput Testing", () => {
    it("should maintain performance under sustained load", async () => {
      const workflow = createLinearWorkflow(2);
      await workflowManager.registerWorkflow(workflow);

      const batchSize = 5;
      const numberOfBatches = 4;
      const results: number[] = [];

      for (let batch = 0; batch < numberOfBatches; batch++) {
        const batchStart = performance.now();

        // Execute batch of workflows
        const executionIds = await Promise.all(
          Array.from({ length: batchSize }, (_, i) =>
            workflowManager.startWorkflow(workflow.id, {
              audioFile: `batch${batch}_test${i}.wav`,
            })
          )
        );

        // Wait for batch completion
        await Promise.all(
          executionIds.map((id) =>
            waitForWorkflowCompletion(() =>
              workflowManager.getExecutionStatus(id)
            )
          )
        );

        const batchTime = performance.now() - batchStart;
        results.push(batchTime);

        // Optional: Add delay between batches to simulate real-world usage
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Calculate statistics
      const avgTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxTime = Math.max(...results);
      const minTime = Math.min(...results);
      const variance =
        results.reduce((a, b) => a + Math.pow(b - avgTime, 2), 0) /
        results.length;
      const stdDev = Math.sqrt(variance);

      // Log performance metrics
      console.log("Throughput Test Results:");
      console.log(`Average batch time: ${avgTime.toFixed(2)}ms`);
      console.log(`Min batch time: ${minTime.toFixed(2)}ms`);
      console.log(`Max batch time: ${maxTime.toFixed(2)}ms`);
      console.log(`Standard deviation: ${stdDev.toFixed(2)}ms`);

      // Verify performance meets requirements
      expect(maxTime).toBeLessThan(5000); // Max 5 seconds per batch
      expect(stdDev).toBeLessThan(maxTime * 0.5); // Variance should be reasonable
    }, 30000);
  });

  describe("Memory Usage", () => {
    it("should maintain stable memory usage during execution", async () => {
      const workflow = createBranchingWorkflow();
      await workflowManager.registerWorkflow(workflow);

      const initialMemory = process.memoryUsage();
      const memoryMeasurements: number[] = [];

      // Execute multiple workflows while monitoring memory
      for (let i = 0; i < 10; i++) {
        const executionId = await workflowManager.startWorkflow(workflow.id, {
          audioFile: `test${i}.wav`,
        });

        await waitForWorkflowCompletion(() =>
          workflowManager.getExecutionStatus(executionId)
        );

        const currentMemory = process.memoryUsage();
        memoryMeasurements.push(currentMemory.heapUsed);
      }

      const finalMemory = process.memoryUsage();

      // Calculate memory growth
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const maxMemoryUsed = Math.max(...memoryMeasurements);
      const averageMemoryUsed =
        memoryMeasurements.reduce((a, b) => a + b, 0) /
        memoryMeasurements.length;

      // Log memory metrics
      console.log("Memory Usage Test Results:");
      console.log(`Initial heap used: ${formatBytes(initialMemory.heapUsed)}`);
      console.log(`Final heap used: ${formatBytes(finalMemory.heapUsed)}`);
      console.log(`Memory growth: ${formatBytes(memoryGrowth)}`);
      console.log(`Max memory used: ${formatBytes(maxMemoryUsed)}`);
      console.log(`Average memory used: ${formatBytes(averageMemoryUsed)}`);

      // Verify memory usage is within acceptable limits
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    }, 30000);
  });
});

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}
