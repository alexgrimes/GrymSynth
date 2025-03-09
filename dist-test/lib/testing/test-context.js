"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestContext = void 0;
class TestProjectManager {
    constructor() {
        this.models = new Map();
        this.activeModel = null;
    }
    async createModel(type) {
        const id = `${type}_${Date.now()}`;
        const model = {
            id,
            type,
            status: 'ready'
        };
        this.models.set(id, model);
        this.activeModel = model;
        return model;
    }
    getModel(id) {
        return this.models.get(id);
    }
    setModelStatus(id, status) {
        const model = this.models.get(id);
        if (model) {
            model.status = status;
        }
    }
    getActiveModel() {
        return this.activeModel;
    }
    clear() {
        this.models.clear();
        this.activeModel = null;
    }
}
class TestContext {
    constructor(resourcePool, healthMonitor) {
        this.resourcePool = resourcePool;
        this.healthMonitor = healthMonitor;
        this.projectManager = new TestProjectManager();
    }
    static async create() {
        let lastError = null;
        const resourcePool = {
            async mockError(error) {
                throw error;
            },
            async mockAllocation(resourceId) {
                await Promise.resolve();
            },
            async mockHandoffError(source, target) {
                const error = new Error(`Handoff failed from ${source.type} to ${target.type}`);
                error.code = 'HANDOFF_ERROR';
                error.source = source.id;
                error.target = target.id;
                throw error;
            },
            getMetrics() {
                return { poolSize: 10, available: 10, lastError };
            },
            async reset() {
                await Promise.resolve();
            },
            async mockCleanup(count) {
                await Promise.resolve();
            }
        };
        let currentHealth = 'healthy';
        let errorCount = 0;
        let lastMetricsError = null;
        const healthMonitor = {
            getStatus() {
                return currentHealth;
            },
            getFullState() {
                return {
                    health: currentHealth,
                    errorCount,
                    metrics: {
                        requestCount: 0,
                        errorRate: 0,
                        lastError: lastMetricsError
                    },
                    status: currentHealth,
                    lastCheck: new Date()
                };
            },
            handleError(error) {
                lastMetricsError = error;
                errorCount++;
                if (errorCount > 1) {
                    currentHealth = 'error';
                }
                else {
                    currentHealth = 'warning';
                }
            },
            reset() {
                currentHealth = 'healthy';
                errorCount = 0;
                lastMetricsError = null;
            }
        };
        return new TestContext(resourcePool, healthMonitor);
    }
    async mockError(error) {
        this.healthMonitor.handleError(error);
        // Update model status based on error type
        const activeModel = this.projectManager.getActiveModel();
        if (activeModel) {
            if (error.code === 'VALIDATION_ERROR') {
                // For validation errors, set both the active model and related models to error
                const details = error.details;
                if (details?.modelId) {
                    this.projectManager.setModelStatus(details.modelId, 'error');
                }
                if (details?.verifierId) {
                    this.projectManager.setModelStatus(details.verifierId, 'error');
                }
            }
            // Always set active model to error state
            this.projectManager.setModelStatus(activeModel.id, 'error');
        }
        try {
            await this.resourcePool.mockError(error);
        }
        catch (err) {
            if (err instanceof Error) {
                throw err;
            }
            throw new Error('Unknown error occurred');
        }
    }
    async mockHandoffError(source, target) {
        try {
            await this.resourcePool.mockHandoffError(source, target);
        }
        catch (err) {
            if (err instanceof Error) {
                this.healthMonitor.handleError(err);
                this.projectManager.setModelStatus(source.id, 'error');
                this.projectManager.setModelStatus(target.id, 'error');
                throw err;
            }
            throw new Error('Unknown error occurred during handoff');
        }
    }
    getState() {
        return this.healthMonitor.getStatus();
    }
    getFullState() {
        return this.healthMonitor.getFullState();
    }
    async reset() {
        this.healthMonitor.reset();
        await this.resourcePool.reset();
        this.projectManager.clear();
    }
    async cleanup() {
        await this.reset();
    }
}
exports.TestContext = TestContext;
//# sourceMappingURL=test-context.js.map