"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectManager = void 0;
/**
 * ProjectManager handles model orchestration and coordinates with health monitoring
 * to ensure safe and efficient model handoffs.
 */
class ProjectManager {
    constructor(memorySystem, healthMonitor) {
        this.memorySystem = memorySystem;
        this.healthMonitor = healthMonitor;
        this.models = new Map();
        this.activeHandoffs = new Set();
    }
    /**
     * Initialize a new model
     */
    async initializeModel(id, config) {
        const health = await this.healthMonitor.checkModelHealth();
        // Verify we have capacity for new model
        if (!health.canAcceptTasks) {
            throw new Error('Cannot initialize model: insufficient resources');
        }
        const model = {
            id,
            type: config.type,
            memoryRequirement: config.memoryRequirement,
            status: 'inactive'
        };
        this.models.set(id, model);
        return model;
    }
    /**
     * Get a model by ID
     */
    async getModel(id) {
        const model = this.models.get(id);
        if (!model) {
            throw new Error(`Model ${id} not found`);
        }
        return model;
    }
    /**
     * Activate a model for use
     */
    async activateModel(model) {
        const health = await this.healthMonitor.checkModelHealth();
        // Check if we have resources to activate
        if (model.memoryRequirement &&
            model.memoryRequirement > health.resources.memoryAvailable) {
            throw new Error('Insufficient memory to activate model');
        }
        if (health.resources.activeModels >= 3) {
            throw new Error('Maximum number of active models reached');
        }
        const currentModel = await this.getModel(model.id);
        currentModel.status = 'active';
        this.models.set(model.id, currentModel);
    }
    /**
     * Deactivate a model
     */
    async deactivateModel(model) {
        const currentModel = await this.getModel(model.id);
        if (currentModel.status === 'busy') {
            throw new Error('Cannot deactivate busy model');
        }
        currentModel.status = 'inactive';
        this.models.set(model.id, currentModel);
    }
    /**
     * Destroy a model and free resources
     */
    async destroyModel(model) {
        const currentModel = await this.getModel(model.id);
        if (currentModel.status !== 'inactive') {
            await this.deactivateModel(currentModel);
        }
        this.models.delete(model.id);
    }
    /**
     * Handle model handoff for processing
     */
    async handoff(sourceModel, targetModel, options = {}) {
        const health = await this.healthMonitor.checkModelHealth();
        // Verify system can handle handoff
        if (!health.canAcceptTasks) {
            throw new Error('Insufficient resources');
        }
        if (health.orchestration.queueDepth >= 5) {
            throw new Error('Maximum queue depth reached');
        }
        // Generate handoff ID
        const handoffId = `${sourceModel.id}-${targetModel.id}-${Date.now()}`;
        this.activeHandoffs.add(handoffId);
        try {
            // Update model statuses
            sourceModel.status = 'busy';
            targetModel.status = 'busy';
            this.models.set(sourceModel.id, sourceModel);
            this.models.set(targetModel.id, targetModel);
            // Simulate handoff processing
            await new Promise(resolve => setTimeout(resolve, options.priority === 'high' ? 1000 : 2000));
            // Reset model statuses
            sourceModel.status = 'active';
            targetModel.status = 'active';
            this.models.set(sourceModel.id, sourceModel);
            this.models.set(targetModel.id, targetModel);
        }
        finally {
            this.activeHandoffs.delete(handoffId);
        }
    }
    /**
     * Get current number of active handoffs
     */
    getActiveHandoffCount() {
        return this.activeHandoffs.size;
    }
}
exports.ProjectManager = ProjectManager;
//# sourceMappingURL=project-manager.js.map