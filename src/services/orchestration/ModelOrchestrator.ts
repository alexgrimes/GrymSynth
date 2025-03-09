import { ServiceRegistry } from "../../services/service-registry";
import { Task, TaskResult } from "../../services/types";
import { Logger } from "../../utils/logger";
import { TaskDelegator, CompositeTask, ModelSelectionResult } from "./TaskDelegator";
import { ContextManager } from "./ContextManager";
import { performance } from "perf_hooks";

/**
 * Interface for orchestration metrics
 */
export interface OrchestrationMetrics {
  taskAnalysisTime: number;
  modelSelectionTime: number;
  contextPreparationTime: number;
  executionTime: number;
  totalTime: number;
  modelUsage: Record<string, number>;
  successRate: number;
  averageLatency: number;
  bottlenecks: string[];
}

/**
 * Interface for a model chain node
 */
export interface ModelChainNode {
  modelId: string;
  taskType: string;
  inputs: string[];
  outputs: string[];
  fallbackModels?: string[];
  isParallel?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

/**
 * Interface for a model chain
 */
export interface ModelChain {
  nodes: ModelChainNode[];
  entryPoints: string[];
  exitPoints: string[];
  dependencies: Record<string, string[]>;
}

/**
 * Interface for a task execution plan
 */
export interface TaskExecutionPlan {
  chain: ModelChain;
  context: Record<string, any>;
  priority: number;
  deadline?: Date;
  maxRetries: number;
  parallelizationStrategy: 'none' | 'full' | 'selective';
}

/**
 * Interface for a bottleneck detection result
 */
export interface BottleneckDetection {
  modelId: string;
  taskType: string;
  averageLatency: number;
  resourceUtilization: number;
  errorRate: number;
  impact: number; // 0-1 score indicating impact on overall performance
  recommendations: string[];
}

/**
 * Interface for feedback data
 */
export interface FeedbackData {
  taskId: string;
  modelId: string;
  taskType: string;
  success: boolean;
  latency: number;
  errorType?: string;
  contextSize?: number;
  resourceUtilization?: number;
  timestamp: number;
}

/**
 * Enhanced ModelOrchestrator for optimizing how the reasoning LLM interacts with GAMA and other specialized models
 */
export class ModelOrchestrator {
  private logger: Logger;
  private taskDelegator: TaskDelegator;
  private contextManager: ContextManager;
  private executionHistory: Map<string, TaskResult[]> = new Map();
  private feedbackData: FeedbackData[] = [];
  private bottleneckCache: Map<string, BottleneckDetection> = new Map();
  private modelPerformanceCache: Map<string, Map<string, number[]>> = new Map();
  private lastBottleneckAnalysis: number = 0;
  private bottleneckAnalysisInterval: number = 60 * 60 * 1000; // 1 hour

  constructor(
    private serviceRegistry: ServiceRegistry,
    contextManager: ContextManager
  ) {
    this.logger = new Logger({ namespace: "model-orchestrator" });
    this.taskDelegator = new TaskDelegator(serviceRegistry);
    this.contextManager = contextManager;
  }

  /**
   * Execute a task using the most appropriate model(s)
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = performance.now();
    const metrics: Partial<OrchestrationMetrics> = {
      modelUsage: {}
    };

    try {
      // 1. Analyze task to determine requirements
      const taskAnalysisStartTime = performance.now();
      const taskRequirements = await this.analyzeTask(task);
      metrics.taskAnalysisTime = performance.now() - taskAnalysisStartTime;

      // 2. Create execution plan
      const modelSelectionStartTime = performance.now();
      const executionPlan = await this.createExecutionPlan(task, taskRequirements);
      metrics.modelSelectionTime = performance.now() - modelSelectionStartTime;

      // 3. Prepare context for models
      const contextPrepStartTime = performance.now();
      const enrichedTask = await this.prepareTaskContext(task, executionPlan);
      metrics.contextPreparationTime = performance.now() - contextPrepStartTime;

      // 4. Execute the task according to the plan
      const executionStartTime = performance.now();
      let result: TaskResult;

      if (this.isCompositeTask(enrichedTask, executionPlan)) {
        // Handle as composite task with multiple models
        result = await this.executeCompositeTask(enrichedTask as CompositeTask, executionPlan);
      } else {
        // Handle as single model task
        result = await this.executeSingleModelTask(enrichedTask, executionPlan);
      }

      metrics.executionTime = performance.now() - executionStartTime;
      metrics.totalTime = performance.now() - startTime;

      // 5. Store execution history
      this.storeExecutionHistory(task.id, result);

      // 6. Collect feedback for future improvements
      this.collectFeedback(task, result, metrics as OrchestrationMetrics);

      // 7. Periodically analyze bottlenecks
      await this.checkAndAnalyzeBottlenecks();

      // 8. Enhance result with orchestration metrics
      const enhancedResult: TaskResult = {
        ...result,
        metadata: {
          ...result.metadata,
          duration: result.metadata?.duration || 0,
          timestamp: result.metadata?.timestamp || Date.now()
        }
      };

      // Add metrics to the data instead of metadata
      enhancedResult.data = {
        ...(enhancedResult.data || {}),
        orchestrationMetrics: metrics
      };

      return enhancedResult;
    } catch (error) {
      this.logger.error(`Task execution failed`, {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      });

      metrics.totalTime = performance.now() - startTime;

      // Return error result with orchestration metrics
      return {
        id: task.id,
        success: false,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: metrics.totalTime,
          timestamp: Date.now()
        },
        data: {
          orchestrationMetrics: metrics
        }
      };
    }
  }

  /**
   * Analyze a task to determine its requirements
   */
  private async analyzeTask(task: Task): Promise<Record<string, any>> {
    // Basic task analysis based on task type and data
    const requirements: Record<string, any> = {
      taskType: task.type,
      priority: task.priority || 5,
      requiresAudio: this.isAudioTask(task),
      requiresPatternRecognition: this.isPatternRecognitionTask(task),
      requiresHighQuality: this.isHighQualityTask(task),
      estimatedComplexity: this.estimateTaskComplexity(task),
      preferredModels: this.getPreferredModels(task)
    };

    // For complex tasks, determine if it should be split into subtasks
    if (requirements.estimatedComplexity > 7) {
      requirements.shouldSplit = true;
      requirements.suggestedSubtasks = await this.suggestSubtasks(task);
    }

    // Determine if task can be parallelized
    requirements.canParallelize = this.canParallelizeTask(task);

    // Determine context requirements
    requirements.contextRequirements = this.determineContextRequirements(task);

    this.logger.debug(`Analyzed task ${task.id}`, { requirements });

    return requirements;
  }

  /**
   * Create an execution plan for a task
   */
  private async createExecutionPlan(
    task: Task,
    requirements: Record<string, any>
  ): Promise<TaskExecutionPlan> {
    // Start building the model chain
    const chain: ModelChain = {
      nodes: [],
      entryPoints: [],
      exitPoints: [],
      dependencies: {}
    };

    // Determine if we need a composite task
    if (requirements.shouldSplit && requirements.suggestedSubtasks) {
      // Create a node for each subtask
      for (const subtask of requirements.suggestedSubtasks) {
        const modelSelection = await this.taskDelegator.selectModelForTask({
          ...task,
          type: subtask.type,
          data: subtask.data
        });

        const nodeId = `${subtask.type}-${modelSelection.modelId}`;

        chain.nodes.push({
          modelId: modelSelection.modelId,
          taskType: subtask.type,
          inputs: subtask.inputs || [],
          outputs: subtask.outputs || [],
          fallbackModels: modelSelection.fallbackModels,
          isParallel: subtask.isParallel || false,
          priority: subtask.priority || requirements.priority,
          metadata: {
            confidence: modelSelection.confidence,
            estimatedLatency: modelSelection.estimatedLatency
          }
        });

        // Set up dependencies
        if (subtask.dependencies) {
          chain.dependencies[nodeId] = subtask.dependencies.map(
            (dep: { type: string }) => `${dep.type}-${this.getModelForTaskType(dep.type)}`
          );
        } else {
          chain.entryPoints.push(nodeId);
        }

        // Identify exit points (nodes with no dependents)
        if (subtask.isExitPoint) {
          chain.exitPoints.push(nodeId);
        }
      }

      // If no exit points were explicitly defined, find nodes that are not dependencies of any other node
      if (chain.exitPoints.length === 0) {
        const allDependencies = Object.values(chain.dependencies).flat();
        chain.exitPoints = chain.nodes
          .map(node => `${node.taskType}-${node.modelId}`)
          .filter(nodeId => !allDependencies.includes(nodeId));
      }
    } else {
      // Simple single-model task
      const modelSelection = await this.taskDelegator.selectModelForTask(task);

      const nodeId = `${task.type}-${modelSelection.modelId}`;

      chain.nodes.push({
        modelId: modelSelection.modelId,
        taskType: task.type,
        inputs: ['input'],
        outputs: ['output'],
        fallbackModels: modelSelection.fallbackModels,
        isParallel: false,
        priority: requirements.priority,
        metadata: {
          confidence: modelSelection.confidence,
          estimatedLatency: modelSelection.estimatedLatency
        }
      });

      chain.entryPoints.push(nodeId);
      chain.exitPoints.push(nodeId);
    }

    // Determine parallelization strategy
    let parallelizationStrategy: 'none' | 'full' | 'selective' = 'none';

    if (requirements.canParallelize) {
      // Check if all nodes can be parallelized
      const allParallel = chain.nodes.every(node => node.isParallel);
      parallelizationStrategy = allParallel ? 'full' : 'selective';
    }

    // Create the execution plan
    const executionPlan: TaskExecutionPlan = {
      chain,
      context: {},
      priority: requirements.priority,
      maxRetries: this.determineMaxRetries(task, requirements),
      parallelizationStrategy
    };

    // Set deadline if specified
    if (task.timeout) {
      executionPlan.deadline = new Date(Date.now() + task.timeout);
    }

    this.logger.debug(`Created execution plan for task ${task.id}`, {
      nodeCount: chain.nodes.length,
      parallelizationStrategy
    });

    return executionPlan;
  }

  /**
   * Prepare context for a task based on the execution plan
   */
  private async prepareTaskContext(
    task: Task,
    executionPlan: TaskExecutionPlan
  ): Promise<Task> {
    // Get base context for the task
    let baseContext = task.context || {};

    // Enhance with model-specific contexts
    const modelContexts: Record<string, any> = {};

    for (const node of executionPlan.chain.nodes) {
      try {
        // Get context for this specific model
        const modelContext = await this.contextManager.getContextForModel(
          node.modelId,
          {
            types: ['model_parameters', 'processing_requirements'],
            minPriority: 1,
            tags: [node.taskType]
          }
        );

        if (modelContext) {
          modelContexts[node.modelId] = modelContext;
        }
      } catch (error) {
        this.logger.warn(`Failed to get context for model ${node.modelId}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // For composite tasks, prepare subtask contexts
    if (this.isCompositeTask(task, executionPlan)) {
      const subtasks = this.prepareSubtasks(task, executionPlan);

      // Create a composite task
      const compositeTask: CompositeTask = {
        ...task,
        subtasks,
        aggregationStrategy: this.determineAggregationStrategy(executionPlan),
        dependencies: this.createSubtaskDependencyMap(executionPlan)
      };

      // Add model contexts to the composite task
      compositeTask.context = {
        ...baseContext,
        modelContexts
      };

      return compositeTask;
    } else {
      // For single model tasks, just add the model context
      const modelId = executionPlan.chain.nodes[0].modelId;

      return {
        ...task,
        context: {
          ...baseContext,
          modelContext: modelContexts[modelId] || {}
        }
      };
    }
  }

  /**
   * Execute a task using a single model
   */
  private async executeSingleModelTask(
    task: Task,
    executionPlan: TaskExecutionPlan
  ): Promise<TaskResult> {
    const node = executionPlan.chain.nodes[0];
    const modelId = node.modelId;

    try {
      // Get the service for this model
      const service = await this.serviceRegistry.getService(modelId);

      // Execute the task
      const startTime = performance.now();
      const result = await service.executeTask(task);
      const executionTime = performance.now() - startTime;

      // Record model usage
      this.recordModelUsage(modelId, task.type, executionTime);

      // Update performance metrics
      this.updatePerformanceMetrics(modelId, task.type, {
        latency: executionTime,
        success: result.status === 'success',
        errorType: result.status === 'error' ? result.error?.name : undefined
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute task with model ${modelId}`, {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      });

      // Try fallback models if available
      if (node.fallbackModels && node.fallbackModels.length > 0) {
        return this.executeFallbackModels(task, node.fallbackModels);
      }

      // No fallbacks available, return error
      return {
        id: task.id,
        success: false,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: 0,
          timestamp: Date.now()
        }
      };
    }
  }

  /**
   * Execute a composite task with multiple models
   */
  private async executeCompositeTask(
    task: CompositeTask,
    executionPlan: TaskExecutionPlan
  ): Promise<TaskResult> {
    // Use the TaskDelegator to handle the composite task
    return this.taskDelegator.handleCompositeTask(task);
  }

  /**
   * Try fallback models when the primary model fails
   */
  private async executeFallbackModels(
    task: Task,
    fallbackModels: string[]
  ): Promise<TaskResult> {
    for (const modelId of fallbackModels) {
      try {
        this.logger.info(`Trying fallback model ${modelId} for task ${task.id}`);

        // Get the service for this model
        const service = await this.serviceRegistry.getService(modelId);

        // Execute the task
        const startTime = performance.now();
        const result = await service.executeTask(task);
        const executionTime = performance.now() - startTime;

        // Record model usage
        this.recordModelUsage(modelId, task.type, executionTime);

        // Update performance metrics
        this.updatePerformanceMetrics(modelId, task.type, {
          latency: executionTime,
          success: result.status === 'success',
          errorType: result.status === 'error' ? result.error?.name : undefined
        });

        // Add fallback information to result
        return {
          ...result,
          metadata: {
            ...result.metadata,
            fallbackModel: modelId
          }
        };
      } catch (error) {
        this.logger.warn(`Fallback model ${modelId} failed for task ${task.id}`, {
          error: error instanceof Error ? error.message : String(error)
        });

        // Continue to next fallback
      }
    }

    // All fallbacks failed
    return {
      id: task.id,
      success: false,
      status: 'error',
      error: new Error(`All models including fallbacks failed for task ${task.id}`),
      metadata: {
        duration: 0,
        timestamp: Date.now()
      },
      data: {
        triedModels: fallbackModels
      }
    };
  }

  /**
   * Store execution history for a task
   */
  private storeExecutionHistory(taskId: string, result: TaskResult): void {
    if (!this.executionHistory.has(taskId)) {
      this.executionHistory.set(taskId, []);
    }

    this.executionHistory.get(taskId)!.push(result);

    // Limit history size
    const history = this.executionHistory.get(taskId)!;
    if (history.length > 10) {
      this.executionHistory.set(taskId, history.slice(-10));
    }
  }

  /**
   * Collect feedback data for improving future delegations
   */
  private collectFeedback(
    task: Task,
    result: TaskResult,
    metrics: OrchestrationMetrics
  ): void {
    // Extract model usage from metrics
    for (const [modelId, usageTime] of Object.entries(metrics.modelUsage)) {
      const feedback: FeedbackData = {
        taskId: task.id,
        modelId,
        taskType: task.type,
        success: result.status === 'success',
        latency: usageTime as number,
        errorType: result.status === 'error' ? result.error?.name : undefined,
        contextSize: this.estimateContextSize(task.context),
        timestamp: Date.now()
      };

      this.feedbackData.push(feedback);
    }

    // Limit feedback data size
    if (this.feedbackData.length > 1000) {
      this.feedbackData = this.feedbackData.slice(-1000);
    }
  }

  /**
   * Check if it's time to analyze bottlenecks and do so if needed
   */
  private async checkAndAnalyzeBottlenecks(): Promise<void> {
    const now = Date.now();

    // Only analyze bottlenecks periodically
    if (now - this.lastBottleneckAnalysis < this.bottleneckAnalysisInterval) {
      return;
    }

    this.lastBottleneckAnalysis = now;

    try {
      const bottlenecks = await this.detectBottlenecks();

      if (bottlenecks.length > 0) {
        this.logger.info(`Detected ${bottlenecks.length} bottlenecks`, {
          bottlenecks: bottlenecks.map(b => `${b.modelId} (${b.impact.toFixed(2)})`)
        });

        // Cache bottleneck information
        for (const bottleneck of bottlenecks) {
          this.bottleneckCache.set(`${bottleneck.modelId}-${bottleneck.taskType}`, bottleneck);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to analyze bottlenecks', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Detect bottlenecks in the system
   */
  private async detectBottlenecks(): Promise<BottleneckDetection[]> {
    // Group feedback data by model and task type
    const modelTaskPerformance: Record<string, {
      latencies: number[];
      errorCount: number;
      totalCount: number;
    }> = {};

    for (const feedback of this.feedbackData) {
      const key = `${feedback.modelId}-${feedback.taskType}`;

      if (!modelTaskPerformance[key]) {
        modelTaskPerformance[key] = {
          latencies: [],
          errorCount: 0,
          totalCount: 0
        };
      }

      modelTaskPerformance[key].latencies.push(feedback.latency);
      modelTaskPerformance[key].totalCount++;

      if (!feedback.success) {
        modelTaskPerformance[key].errorCount++;
      }
    }

    // Calculate performance metrics and identify bottlenecks
    const bottlenecks: BottleneckDetection[] = [];

    for (const [key, performance] of Object.entries(modelTaskPerformance)) {
      const [modelId, taskType] = key.split('-');

      if (performance.totalCount < 5) {
        continue; // Not enough data
      }

      // Calculate average latency
      const averageLatency = performance.latencies.reduce((sum: number, latency: number) => sum + latency, 0) /
        performance.latencies.length;

      // Calculate error rate
      const errorRate = performance.errorCount / performance.totalCount;

      // Get resource utilization (mock value for now)
      const resourceUtilization = 0.7; // Would be obtained from monitoring system

      // Calculate impact score
      // Higher latency, error rate, and resource utilization increase impact
      const latencyFactor = Math.min(1, averageLatency / 5000); // Normalize to 0-1
      const errorFactor = errorRate;
      const utilizationFactor = resourceUtilization;

      const impact = (latencyFactor * 0.4) + (errorFactor * 0.4) + (utilizationFactor * 0.2);

      // Consider it a bottleneck if impact is high enough
      if (impact > 0.5) {
        bottlenecks.push({
          modelId,
          taskType,
          averageLatency,
          resourceUtilization,
          errorRate,
          impact,
          recommendations: this.generateRecommendations(modelId, taskType, {
            averageLatency,
            resourceUtilization,
            errorRate
          })
        });
      }
    }

    // Sort bottlenecks by impact (highest first)
    bottlenecks.sort((a, b) => b.impact - a.impact);

    return bottlenecks;
  }

  /**
   * Generate recommendations for addressing a bottleneck
   */
  private generateRecommendations(
    modelId: string,
    taskType: string,
    metrics: {
      averageLatency: number;
      resourceUtilization: number;
      errorRate: number;
    }
  ): string[] {
    const recommendations: string[] = [];

    // Latency recommendations
    if (metrics.averageLatency > 2000) {
      recommendations.push(`Consider optimizing ${modelId} for ${taskType} tasks to reduce latency`);
      recommendations.push(`Explore parallel processing for ${taskType} tasks`);
    }

    // Error rate recommendations
    if (metrics.errorRate > 0.1) {
      recommendations.push(`Investigate high error rate (${(metrics.errorRate * 100).toFixed(1)}%) for ${modelId} on ${taskType} tasks`);
      recommendations.push(`Consider adding more robust fallback models for ${taskType} tasks`);
    }

    // Resource utilization recommendations
    if (metrics.resourceUtilization > 0.8) {
      recommendations.push(`${modelId} is experiencing high resource utilization (${(metrics.resourceUtilization * 100).toFixed(1)}%)`);
      recommendations.push(`Consider scaling ${modelId} or adding load balancing`);
    }

    // General recommendations
    recommendations.push(`Monitor ${modelId} performance on ${taskType} tasks closely`);

    return recommendations;
  }

  /**
   * Record model usage for metrics
   */
  private recordModelUsage(modelId: string, taskType: string, executionTime: number): void {
    // This would be used to update the metrics.modelUsage in executeTask
    // For now, just log it
    this.logger.debug(`Model usage: ${modelId} for ${taskType}`, {
      executionTime
    });
  }

  /**
   * Update performance metrics for a model and task type
   */
  private updatePerformanceMetrics(
    modelId: string,
    taskType: string,
    metrics: {
      latency: number;
      success: boolean;
      errorType?: string;
    }
  ): void {
    if (!this.modelPerformanceCache.has(modelId)) {
      this.modelPerformanceCache.set(modelId, new Map());
    }

    const modelMetrics = this.modelPerformanceCache.get(modelId)!;

    if (!modelMetrics.has(taskType)) {
      modelMetrics.set(taskType, []);
    }

    const taskMetrics = modelMetrics.get(taskType)!;

    // Add new metrics
    taskMetrics.push(metrics.latency);

    // Limit metrics history
    if (taskMetrics.length > 100) {
      modelMetrics.set(taskType, taskMetrics.slice(-100));
    }
  }

  /**
   * Check if a task is a composite task
   */
  private isCompositeTask(task: Task, executionPlan: TaskExecutionPlan): boolean {
    return executionPlan.chain.nodes.length > 1;
  }

  /**
   * Prepare subtasks for a composite task
   */
  private prepareSubtasks(task: Task, executionPlan: TaskExecutionPlan): Task[] {
    const subtasks: Task[] = [];

    for (const node of executionPlan.chain.nodes) {
      // Create a subtask for each node in the chain
      const subtask: Task = {
        id: `${task.id}-${node.taskType}-${node.modelId}`,
        type: node.taskType,
        data: this.extractSubtaskData(task.data, node),
        priority: node.priority || task.priority,
        modelType: node.modelId,
        context: {
          parentTaskId: task.id,
          inputs: node.inputs,
          outputs: node.outputs,
          isParallel: node.isParallel
        }
      };

      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Extract data for a subtask from the parent task data
   */
  private extractSubtaskData(parentData: any, node: ModelChainNode): any {
    if (!parentData) {
      return {};
    }

    // For simple cases, just use the parent data
    if (!node.inputs || node.inputs.length === 0 || node.inputs.includes('*')) {
      return parentData;
    }

    // Extract only the inputs needed for this subtask
    const subtaskData: Record<string, any> = {};

    for (const input of node.inputs) {
      if (input in parentData) {
        subtaskData[input] = parentData[input];
      }
    }

    return subtaskData;
  }

  /**
   * Determine the aggregation strategy for a composite task
   */
  private determineAggregationStrategy(executionPlan: TaskExecutionPlan): 'sequential' | 'parallel' | 'conditional' {
    if (executionPlan.parallelizationStrategy === 'full') {
      return 'parallel';
    } else if (executionPlan.parallelizationStrategy === 'selective') {
      return 'conditional';
    } else {
      return 'sequential';
    }
  }

  /**
   * Create a dependency map for subtasks
   */
  private createSubtaskDependencyMap(executionPlan: TaskExecutionPlan): Record<string, string[]> {
    const dependencyMap: Record<string, string[]> = {};

    for (const [nodeId, dependencies] of Object.entries(executionPlan.chain.dependencies)) {
      const [taskType, modelId] = nodeId.split('-');
      const subtaskId = `${executionPlan.chain.nodes[0].taskType}-${taskType}-${modelId}`;

      dependencyMap[subtaskId] = dependencies.map(depId => {
        const [depTaskType, depModelId] = depId.split('-');
        return `${executionPlan.chain.nodes[0].taskType}-${depTaskType}-${depModelId}`;
      });
    }

    return dependencyMap;
  }

  /**
   * Check if a task is an audio task
   */
  private isAudioTask(task: Task): boolean {
    return (
      task.type.includes('audio') ||
      task.type.includes('speech') ||
      task.type.includes('sound') ||
      task.type.includes('music')
    );
  }

  /**
   * Check if a task is a pattern recognition task
   */
  private isPatternRecognitionTask(task: Task): boolean {
    return (
      task.type.includes('pattern') ||
      task.type.includes('recognition') ||
      task.type.includes('classification') ||
      task.type.includes('detection') ||
      (task.data && task.data.operation === 'recognize')
    );
  }

  /**
   * Check if a task requires high quality
   */
  private isHighQualityTask(task: Task): boolean {
    return (
      (task.context && task.context.quality === 'high') ||
      (task.data && task.data.quality === 'high') ||
      (task.priority && task.priority > 7)
    );
  }

  /**
   * Estimate the complexity of a task on a scale of 1-10
   */
  private estimateTaskComplexity(task: Task): number {
    let complexity = 5; // Default medium complexity

    // Adjust based on task type
    if (task.type.includes('simple') || task.type.includes('basic')) {
      complexity -= 2;
    } else if (task.type.includes('complex') || task.type.includes('advanced')) {
      complexity += 2;
    }

    // Adjust based on data size
    if (task.data) {
      const dataSize = this.estimateDataSize(task.data);
      if (dataSize > 1024 * 1024) { // > 1MB
        complexity += 2;
      } else if (dataSize > 100 * 1024) { // > 100KB
        complexity += 1;
      }
    }

    // Adjust based on context size
    if (task.context) {
      const contextSize = this.estimateContextSize(task.context);
      if (contextSize > 100 * 1024) { // > 100KB
        complexity += 1;
      }
    }

    // Clamp to 1-10 range
    return Math.max(1, Math.min(10, complexity));
  }

  /**
   * Estimate the size of data in bytes
   */
  private estimateDataSize(data: any): number {
    if (!data) {
      return 0;
    }

    // Simple approximation based on JSON stringification
    return JSON.stringify(data).length;
  }

  /**
   * Estimate the size of context in bytes
   */
  private estimateContextSize(context: any): number {
    if (!context) {
      return 0;
    }

    // Simple approximation based on JSON stringification
    return JSON.stringify(context).length;
  }

  /**
   * Get preferred models for a task based on task properties
   */
  private getPreferredModels(task: Task): string[] {
    const preferred: string[] = [];

    // Check for explicit preferences
    if (task.modelType) {
      preferred.push(task.modelType);
    }

    if (task.context && task.context.preferredModel) {
      preferred.push(task.context.preferredModel);
    }

    // Add preferences based on task type
    if (this.isAudioTask(task)) {
      if (this.isPatternRecognitionTask(task)) {
        preferred.push('gama'); // GAMA is good for audio pattern recognition
      } else if (task.type.includes('speech-to-text')) {
        preferred.push('wav2vec2');
      } else if (task.type.includes('generation')) {
        preferred.push('audioldm');
      }
    }

    return preferred;
  }

  /**
   * Suggest subtasks for a complex task
   */
  private async suggestSubtasks(task: Task): Promise<Array<{
    type: string;
    data: any;
    inputs: string[];
    outputs: string[];
    dependencies?: Array<{ type: string }>;
    isParallel?: boolean;
    priority?: number;
    isExitPoint?: boolean;
  }>> {
    // This would ideally use a reasoning LLM to decompose the task
    // For now, use simple heuristics

    if (this.isAudioTask(task)) {
      if (task.type.includes('analysis') || task.type.includes('process')) {
        // Split audio analysis into preprocessing, feature extraction, and classification
        return [
          {
            type: 'audio-preprocessing',
            data: { audio: task.data.audio },
            inputs: ['audio'],
            outputs: ['processedAudio'],
            isParallel: false,
            priority: task.priority
          },
          {
            type: 'audio-feature-extraction',
            data: {},
            inputs: ['processedAudio'],
            outputs: ['features'],
            dependencies: [{ type: 'audio-preprocessing' }],
            isParallel: false,
            priority: task.priority
          },
          {
            type: 'audio-pattern-recognition',
            data: {},
            inputs: ['features'],
            outputs: ['patterns'],
            dependencies: [{ type: 'audio-feature-extraction' }],
            isParallel: false,
            priority: task.priority,
            isExitPoint: true
          }
        ];
      } else if (task.type.includes('generation')) {
        // Split generation into planning and generation
        return [
          {
            type: 'audio-generation-planning',
            data: { prompt: task.data.prompt },
            inputs: ['prompt'],
            outputs: ['plan'],
            isParallel: false,
            priority: task.priority
          },
          {
            type: 'audio-generation',
            data: {},
            inputs: ['plan'],
            outputs: ['audio'],
            dependencies: [{ type: 'audio-generation-planning' }],
            isParallel: false,
            priority: task.priority,
            isExitPoint: true
          }
        ];
      }
    }

    // Default: no splitting
    return [{
      type: task.type,
      data: task.data,
      inputs: ['input'],
      outputs: ['output'],
      isParallel: false,
      priority: task.priority,
      isExitPoint: true
    }];
  }

  /**
   * Determine if a task can be parallelized
   */
  private canParallelizeTask(task: Task): boolean {
    // Check for explicit parallelization flag
    if (task.context && task.context.canParallelize !== undefined) {
      return !!task.context.canParallelize;
    }

    // Some task types are inherently parallelizable
    if (
      task.type.includes('batch') ||
      task.type.includes('parallel') ||
      task.type.includes('multi')
    ) {
      return true;
    }

    // Check if data structure suggests parallelization
    if (task.data && Array.isArray(task.data.items) && task.data.items.length > 1) {
      return true;
    }

    // Default to false
    return false;
  }

  /**
   * Determine context requirements for a task
   */
  private determineContextRequirements(task: Task): {
    requiredTypes: string[];
    optionalTypes: string[];
    priority: number;
  } {
    const requiredTypes: string[] = [];
    const optionalTypes: string[] = [];

    // Basic context types needed for most tasks
    requiredTypes.push('task_parameters');

    // Add context types based on task type
    if (this.isAudioTask(task)) {
      requiredTypes.push('audio_parameters');
      optionalTypes.push('stylistic_preferences');
    }

    if (this.isPatternRecognitionTask(task)) {
      requiredTypes.push('pattern_recognition_parameters');
      optionalTypes.push('feature_extraction_parameters');
    }

    if (this.isHighQualityTask(task)) {
      requiredTypes.push('quality_parameters');
    }

    return {
      requiredTypes,
      optionalTypes,
      priority: task.priority || 5
    };
  }

  /**
   * Determine the maximum number of retries for a task
   */
  private determineMaxRetries(task: Task, requirements: Record<string, any>): number {
    // Use explicit retry count if specified
    if (task.retries !== undefined) {
      return task.retries;
    }

    // Base retries on priority and complexity
    const priority = requirements.priority || 5;
    const complexity = requirements.estimatedComplexity || 5;

    // Higher priority and lower complexity tasks get more retries
    return Math.min(5, Math.max(0, Math.floor((priority - complexity / 2) + 3)));
  }

  /**
   * Get the most appropriate model for a task type
   */
  private getModelForTaskType(taskType: string): string {
    // Simple mapping of task types to models
    const taskModelMap: Record<string, string> = {
      'audio-preprocessing': 'wav2vec2',
      'audio-feature-extraction': 'gama',
      'audio-pattern-recognition': 'gama',
      'audio-generation-planning': 'reasoning',
      'audio-generation': 'audioldm',
      'speech-to-text': 'wav2vec2',
      'text-to-audio': 'audioldm',
      'music-generation': 'audioldm'
    };

    return taskModelMap[taskType] || 'reasoning';
  }

  /**
   * Get statistics about the model orchestrator
   */
  getStats(): {
    executionHistorySize: number;
    feedbackDataSize: number;
    bottleneckCount: number;
    modelPerformanceMetrics: Record<string, Record<string, {
      averageLatency: number;
      sampleCount: number;
    }>>;
  } {
    // Calculate model performance metrics
    const modelPerformanceMetrics: Record<string, Record<string, {
      averageLatency: number;
      sampleCount: number;
    }>> = {};

    for (const [modelId, taskMetrics] of this.modelPerformanceCache.entries()) {
      modelPerformanceMetrics[modelId] = {};

      for (const [taskType, latencies] of taskMetrics.entries()) {
        const averageLatency = latencies.reduce((sum, latency) => sum + latency, 0) /
          Math.max(1, latencies.length);

        modelPerformanceMetrics[modelId][taskType] = {
          averageLatency,
          sampleCount: latencies.length
        };
      }
    }

    return {
      executionHistorySize: this.executionHistory.size,
      feedbackDataSize: this.feedbackData.length,
      bottleneckCount: this.bottleneckCache.size,
      modelPerformanceMetrics
    };
  }
}
