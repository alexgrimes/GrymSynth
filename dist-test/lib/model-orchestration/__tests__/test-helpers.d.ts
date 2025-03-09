import { LLMModel, ModelCapability, Task, TaskRequirements, ModelResult, ModelChain, ModelPhase, ModelRegistry } from '../types';
/**
 * Create a mock task with specified capabilities and requirements
 */
export declare function createTestTask(taskType: string, taskPriority?: 'speed' | 'quality' | 'efficiency', taskOptions?: {
    primaryCapability?: ModelCapability;
    secondaryCapabilities?: ModelCapability[];
    minScores?: Map<ModelCapability, number>;
    contextSize?: number;
    resourceConstraints?: {
        maxMemory?: number;
        maxCpu?: number;
        maxLatency?: number;
    };
}): Task;
/**
 * Create a mock model with specified capabilities
 */
export declare function createMockModel(config: {
    id: string;
    name: string;
    capabilities: Partial<Record<ModelCapability, number>>;
    contextWindow?: number;
    mockProcess?: (input: any) => Promise<any>;
}): LLMModel;
/**
 * Create a mock model chain for testing
 */
export declare function createMockModelChain(options?: {
    plannerCapabilities?: Partial<Record<ModelCapability, number>>;
    executorCapabilities?: Partial<Record<ModelCapability, number>>;
    reviewerCapabilities?: Partial<Record<ModelCapability, number>>;
    contextCapabilities?: Partial<Record<ModelCapability, number>>;
}): ModelChain;
/**
 * Create a mock model result
 */
export declare function createMockModelResult(success?: boolean, output?: any, phase?: ModelPhase, metrics?: {
    executionTime?: number;
    memoryUsed?: number;
    tokensUsed?: number;
    tokensProcessed?: number;
}): ModelResult;
/**
 * Create a mock registry
 */
export declare class MockRegistry implements ModelRegistry {
    private models;
    constructor(initialModels?: LLMModel[]);
    registerModel(model: LLMModel): Promise<void>;
    unregisterModel(modelId: string): Promise<void>;
    getModel(modelId: string): LLMModel | undefined;
    listModels(): LLMModel[];
    findModels(criteria: {
        capabilities?: ModelCapability[];
        minScores?: Map<ModelCapability, number>;
        contextSize?: number;
    }): LLMModel[];
    getModelChain(requirements: TaskRequirements): Promise<ModelChain>;
}
/**
 * Generate test execution results for performance testing
 */
export declare function generateTestExecutionResults(count: number): Array<{
    task: Task;
    execution: ModelResult;
}>;
/**
 * Wait for a specified duration (useful for async tests)
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Create error simulation function
 */
export declare function createErrorSimulator(errorRate?: number, errorMessage?: string): (input: any) => Promise<any>;
