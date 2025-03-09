import { HealthMonitor } from './health-monitor';
import { MetricsCollector } from './metrics-collector';
import { HealthConfig } from './types';
interface ModelMetrics {
    resources: {
        memoryAvailable: number;
        cpuAvailable: number;
        activeModels: number;
    };
    orchestration: {
        activeHandoffs: number;
        queueDepth: number;
    };
}
interface ModelHealth {
    resources: ModelMetrics['resources'];
    orchestration: {
        status: 'available' | 'degraded' | 'unavailable';
        activeHandoffs: number;
        queueDepth: number;
    };
    canAcceptTasks: boolean;
}
interface ModelConfig {
    minAvailableMemory: number;
    maxActiveModels: number;
    maxQueueDepth: number;
    handoffTimeoutMs: number;
}
/**
 * Focused health monitor for model orchestration, tracking only
 * essential metrics needed for model handoffs and task management.
 */
export declare class ModelHealthMonitor extends HealthMonitor {
    private readonly modelConfig;
    constructor(metrics: MetricsCollector, config?: Partial<HealthConfig>, modelConfig?: Partial<ModelConfig>);
    /**
     * Check model orchestration health metrics
     */
    checkModelHealth(): Promise<ModelHealth>;
    /**
     * Get current model-specific metrics
     */
    protected getModelMetrics(): Promise<ModelMetrics>;
    /**
     * Get current number of active model handoffs
     */
    private getActiveHandoffs;
    /**
     * Get current task queue depth
     */
    private getTaskQueueDepth;
    /**
     * Evaluate if system can accept more tasks
     */
    private evaluateCapacity;
    /**
     * Determine orchestration status
     */
    private determineStatus;
}
export {};
