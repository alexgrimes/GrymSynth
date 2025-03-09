import { FeatureMemorySystem } from './feature-memory-system';
import { ModelHealthMonitor } from './model-health-monitor';
interface Model {
    id: string;
    type: 'processing' | 'analysis';
    memoryRequirement?: number;
    status: 'inactive' | 'active' | 'busy';
}
interface HandoffOptions {
    priority?: 'high' | 'normal' | 'low';
    timeout?: number;
}
/**
 * ProjectManager handles model orchestration and coordinates with health monitoring
 * to ensure safe and efficient model handoffs.
 */
export declare class ProjectManager {
    private memorySystem;
    private healthMonitor;
    private models;
    private activeHandoffs;
    constructor(memorySystem: FeatureMemorySystem, healthMonitor: ModelHealthMonitor);
    /**
     * Initialize a new model
     */
    initializeModel(id: string, config: {
        type: Model['type'];
        memoryRequirement?: number;
    }): Promise<Model>;
    /**
     * Get a model by ID
     */
    getModel(id: string): Promise<Model>;
    /**
     * Activate a model for use
     */
    activateModel(model: Model): Promise<void>;
    /**
     * Deactivate a model
     */
    deactivateModel(model: Model): Promise<void>;
    /**
     * Destroy a model and free resources
     */
    destroyModel(model: Model): Promise<void>;
    /**
     * Handle model handoff for processing
     */
    handoff(sourceModel: Model, targetModel: Model, options?: HandoffOptions): Promise<void>;
    /**
     * Get current number of active handoffs
     */
    getActiveHandoffCount(): number;
}
export {};
