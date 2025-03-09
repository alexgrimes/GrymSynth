import { Workflow, WorkflowStep } from "./types";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export class WorkflowValidator {
  validateWorkflow(workflow: Workflow): ValidationResult {
    const errors: string[] = [];

    // Check required workflow fields
    if (!workflow.id) errors.push("Workflow ID is required");
    if (!workflow.name) errors.push("Workflow name is required");
    if (!workflow.initialStep) errors.push("Initial step is required");
    if (!workflow.steps || Object.keys(workflow.steps).length === 0) {
      errors.push("At least one step is required");
    }

    // Validate metadata
    if (!workflow.metadata) {
      errors.push("Workflow metadata is required");
    } else {
      if (!workflow.metadata.createdAt)
        errors.push("Metadata createdAt is required");
      if (!workflow.metadata.updatedAt)
        errors.push("Metadata updatedAt is required");
      if (!workflow.metadata.version)
        errors.push("Metadata version is required");
      if (!workflow.metadata.createdBy)
        errors.push("Metadata createdBy is required");
    }

    // Validate initial step exists
    if (
      workflow.initialStep &&
      workflow.steps &&
      !workflow.steps[workflow.initialStep]
    ) {
      errors.push(`Initial step '${workflow.initialStep}' not found in steps`);
    }

    // Validate each step
    if (workflow.steps) {
      for (const [stepId, step] of Object.entries(workflow.steps)) {
        const stepErrors = this.validateStep(step, workflow);
        errors.push(...stepErrors.map((err) => `Step '${stepId}': ${err}`));
      }
    }

    // Validate step connections
    const connectionErrors = this.validateStepConnections(workflow);
    errors.push(...connectionErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  validateParameters(
    workflow: Workflow,
    parameters: Record<string, any>
  ): ValidationResult {
    const errors: string[] = [];

    // Check all required parameters are provided
    if (workflow.parameters) {
      for (const [key, value] of Object.entries(workflow.parameters)) {
        if (value === null && !(key in parameters)) {
          errors.push(`Required parameter '${key}' is missing`);
        }
      }

      // Check for unknown parameters
      for (const key of Object.keys(parameters)) {
        if (!(key in workflow.parameters)) {
          errors.push(`Unknown parameter '${key}' provided`);
        }
      }
    }

    // Validate parameter types if specified
    // You could extend this based on parameter type definitions in your workflow schema

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateStep(step: WorkflowStep, workflow: Workflow): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!step.id) errors.push("Step ID is required");
    if (!step.type) errors.push("Step type is required");
    if (!step.operation) errors.push("Step operation is required");

    // Validate step type
    const validTypes = [
      "analysis",
      "generation",
      "conditional",
      "transformation",
    ];
    if (!validTypes.includes(step.type)) {
      errors.push(`Invalid step type: ${step.type}`);
    }

    // Validate inputs if present
    if (step.inputs) {
      for (const input of step.inputs) {
        if (!input.source) {
          errors.push(`Input source is required`);
          continue;
        }

        if (!input.key) {
          errors.push(`Input key is required`);
          continue;
        }

        // Validate input source
        const validSources = ["parameter", "previous_step", "context"];
        if (!validSources.includes(input.source)) {
          errors.push(`Invalid input source: ${input.source}`);
        }

        // Validate previous step references
        if (input.source === "previous_step") {
          const [refStepId] = input.key.split(".");
          if (!workflow.steps[refStepId]) {
            errors.push(`Referenced step '${refStepId}' not found`);
          }
        } else if (input.source === "parameter") {
          if (!workflow.parameters || !(input.key in workflow.parameters)) {
            errors.push(
              `Referenced parameter '${input.key}' not defined in workflow parameters`
            );
          }
        }
      }
    }

    // Validate condition if present
    if (step.type === "conditional") {
      if (!step.condition) {
        errors.push("Conditional step requires a condition");
      } else {
        const validOperators = [
          "equals",
          "contains",
          "greater_than",
          "less_than",
        ];
        if (!validOperators.includes(step.condition.operator)) {
          errors.push(`Invalid condition operator: ${step.condition.operator}`);
        }

        if (!step.condition.leftOperand) {
          errors.push("Condition left operand is required");
        }

        if (
          step.condition.rightOperand === undefined ||
          step.condition.rightOperand === null
        ) {
          errors.push("Condition right operand is required");
        }
      }
    }

    // Validate next steps
    if (!step.nextSteps) {
      errors.push("Next steps configuration is required");
    } else {
      // Validate default next step if specified
      if (step.nextSteps.default && !workflow.steps[step.nextSteps.default]) {
        errors.push(`Default next step '${step.nextSteps.default}' not found`);
      }

      // Validate conditional next steps if specified
      if (step.nextSteps.conditional) {
        for (const conditional of step.nextSteps.conditional) {
          if (!conditional.condition) {
            errors.push("Conditional next step requires a condition");
          }
          if (!conditional.stepId) {
            errors.push("Conditional next step requires a step ID");
          } else if (!workflow.steps[conditional.stepId]) {
            errors.push(
              `Conditional next step '${conditional.stepId}' not found`
            );
          }
        }
      }
    }

    return errors;
  }

  private validateStepConnections(workflow: Workflow): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    // Check for cycles and unreachable steps
    const checkStep = (stepId: string) => {
      if (stack.has(stepId)) {
        errors.push(`Cycle detected involving step '${stepId}'`);
        return;
      }

      if (visited.has(stepId)) {
        return;
      }

      visited.add(stepId);
      stack.add(stepId);

      const step = workflow.steps[stepId];

      // Check default next step
      if (step.nextSteps.default) {
        checkStep(step.nextSteps.default);
      }

      // Check conditional next steps
      if (step.nextSteps.conditional) {
        for (const conditional of step.nextSteps.conditional) {
          checkStep(conditional.stepId);
        }
      }

      stack.delete(stepId);
    };

    // Start from initial step
    checkStep(workflow.initialStep);

    // Check for unreachable steps
    for (const stepId of Object.keys(workflow.steps)) {
      if (!visited.has(stepId)) {
        errors.push(`Step '${stepId}' is unreachable`);
      }
    }

    return errors;
  }
}
