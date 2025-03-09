import express, { RequestHandler } from "express";
import { WorkflowManager } from "../../workflows/workflow-manager";
import { Workflow } from "../../workflows/types";
import { Logger } from "../../utils/logger";

type ParamsWithId = {
  id: string;
};

export function createWorkflowRoutes(
  workflowManager: WorkflowManager
): express.Router {
  const router = express.Router();
  const logger = new Logger("workflow-routes");

  // Create a new workflow
  const createWorkflow: RequestHandler = async (req, res) => {
    try {
      const workflow: Workflow = req.body;
      await workflowManager.registerWorkflow(workflow);
      res.status(201).json({
        id: workflow.id,
        message: "Workflow registered successfully",
      });
    } catch (error) {
      logger.error("Failed to register workflow", { error });
      res.status(400).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // List all workflows
  const listWorkflows: RequestHandler = async (_req, res) => {
    try {
      const workflows = workflowManager.listWorkflows();
      res.json(
        workflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          version: workflow.metadata.version,
          createdAt: workflow.metadata.createdAt,
          updatedAt: workflow.metadata.updatedAt,
        }))
      );
    } catch (error) {
      logger.error("Failed to list workflows", { error });
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Get workflow details
  const getWorkflow: RequestHandler<ParamsWithId> = async (req, res) => {
    try {
      const workflow = workflowManager.getWorkflow(req.params.id);

      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }

      res.json(workflow);
    } catch (error) {
      logger.error("Failed to get workflow", { error, id: req.params.id });
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Execute a workflow
  const executeWorkflow: RequestHandler<ParamsWithId> = async (req, res) => {
    try {
      const parameters = req.body;
      const workflow = workflowManager.getWorkflow(req.params.id);

      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }

      const executionId = await workflowManager.startWorkflow(
        req.params.id,
        parameters
      );
      res.status(202).json({
        executionId,
        message: "Workflow execution started",
      });
    } catch (error) {
      logger.error("Failed to execute workflow", { error, id: req.params.id });
      res.status(400).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // List all executions
  const listExecutions: RequestHandler = async (_req, res) => {
    try {
      const executions = workflowManager.listExecutions();
      res.json(executions);
    } catch (error) {
      logger.error("Failed to list executions", { error });
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Get execution status
  const getExecutionStatus: RequestHandler<ParamsWithId> = async (req, res) => {
    try {
      const status = workflowManager.getExecutionStatus(req.params.id);

      if (!status) {
        res.status(404).json({ error: "Execution not found" });
        return;
      }

      res.json(status);
    } catch (error) {
      logger.error("Failed to get execution status", {
        error,
        id: req.params.id,
      });
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Cancel execution
  const cancelExecution: RequestHandler<ParamsWithId> = async (req, res) => {
    try {
      const cancelled = await workflowManager.cancelExecution(req.params.id);

      if (!cancelled) {
        res.status(404).json({ error: "Execution not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      logger.error("Failed to cancel execution", { error, id: req.params.id });
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Get workflow statistics
  const getWorkflowStats: RequestHandler<ParamsWithId> = async (req, res) => {
    try {
      const workflow = workflowManager.getWorkflow(req.params.id);

      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }

      const stats = workflowManager.getWorkflowStats(req.params.id);
      res.json({
        id: workflow.id,
        name: workflow.name,
        version: workflow.metadata.version,
        ...stats,
      });
    } catch (error) {
      logger.error("Failed to get workflow stats", {
        error,
        id: req.params.id,
      });
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  // Register routes
  router.post("/", createWorkflow);
  router.get("/", listWorkflows);
  router.get("/:id", getWorkflow);
  router.post("/:id/execute", executeWorkflow);
  router.get("/executions", listExecutions);
  router.get("/executions/:id", getExecutionStatus);
  router.delete("/executions/:id", cancelExecution);
  router.get("/:id/stats", getWorkflowStats);

  return router;
}
