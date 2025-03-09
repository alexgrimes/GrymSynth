# Workflow Engine with Context Passing

This module implements a robust workflow engine for orchestrating audio processing pipelines, with a focus on effective context passing between workflow steps.

## Core Components

### 1. Workflow Execution

The `WorkflowExecution` class is responsible for executing workflows, managing their state, and handling context passing between steps. It supports:

- Sequential and conditional execution of workflow steps
- Task scheduling and execution
- Context management and persistence
- Context transformation between steps

### 2. Context Management

The context management system enables data to flow between workflow steps, allowing analysis results to inform generation parameters and vice versa.

#### Context Adapters

Context adapters transform raw context data into structured formats suitable for specific models or operations. The `AudioContextAdapter` converts context items into a unified `AudioModelContext` format that can be used by audio processing and generation steps.

#### Context Transformation

The `ContextTransformer` applies transformation rules to convert context data between different formats as it flows between workflow steps. This enables:

- Converting analysis results into generation parameters
- Adapting quality metrics to processing requirements
- Enhancing prompts with detected patterns

#### Context Persistence

The `ContextPersistence` service enables workflows to maintain context across executions and system restarts by:

- Saving context items to disk
- Loading persisted context when resuming workflows
- Organizing context by workflow ID and key

## Workflow Structure

Workflows consist of steps with different types:

- **Analysis**: Processes audio to extract features, patterns, and metrics
- **Generation**: Creates audio based on parameters and context
- **Conditional**: Makes decisions based on context or results
- **Transformation**: Transforms data without calling external services

## Context Passing Mechanisms

### Step to Step Context Passing

1. When a step completes, its results are stored in the workflow's step results map
2. The `processStepContext` method extracts relevant data from the result and stores it in the context manager
3. Before executing the next step, the `transformContextForNextStep` method applies transformation rules to adapt the context
4. When resolving inputs for a step, the `resolveInputs` method can retrieve context items from the context manager

### Context Persistence Flow

1. When a workflow starts, it can load persisted context using `loadPersistedContext`
2. As steps execute, context is accumulated in the context manager
3. When the workflow completes, context can be persisted using `persistWorkflowContext`
4. Persisted context is organized by workflow ID and key for efficient retrieval

## Usage Example

```typescript
// Create dependencies
const contextManager = new ContextManager();
const taskScheduler = new TaskScheduler();
const contextTransformer = new ContextTransformer();
const contextPersistence = new ContextPersistence();

// Register transformation rules
contextTransformer.registerAudioAnalysisToGenerationRules();

// Create workflow execution
const workflowExecution = new WorkflowExecution(
  "workflow-123",
  myWorkflow,
  { inputParam1: "value1" },
  contextManager,
  taskScheduler,
  {
    persistContext: true,
    contextPersistence,
    contextTransformer,
  }
);

// Start workflow execution
await workflowExecution.start();
```

## Testing

The workflow engine includes comprehensive tests for:

- Context passing between workflow steps
- Context transformation and adaptation
- Context persistence and loading
- Error handling and recovery

Run the tests using:

```bash
npm test -- --testPathPattern=workflows