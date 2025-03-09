import { Task, ModelChain, ModelResult, ModelRegistry } from './types';
export declare class ModelOrchestrator {
    private registry;
    private config;
    private results;
    constructor(registry: ModelRegistry, config?: {
        maxRetries: number;
    });
    handleTask(task: Task): Promise<ModelResult>;
    executeChain(chain: ModelChain, task: Task): Promise<ModelResult[]>;
    private executePlanningPhase;
    private initializeContext;
    private executeWithRetries;
    private getCurrentPhase;
    private getMetrics;
    private aggregateMetrics;
}
