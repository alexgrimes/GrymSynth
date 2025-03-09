"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelHealthMonitor = void 0;
const health_monitor_1 = require("./health-monitor");
/**
 * Focused health monitor for model orchestration, tracking only
 * essential metrics needed for model handoffs and task management.
 */
class ModelHealthMonitor extends health_monitor_1.HealthMonitor {
    constructor(metrics, config, modelConfig) {
        super(metrics, config);
        this.modelConfig = {
            minAvailableMemory: modelConfig?.minAvailableMemory ?? 512 * 1024 * 1024,
            maxActiveModels: modelConfig?.maxActiveModels ?? 5,
            maxQueueDepth: modelConfig?.maxQueueDepth ?? 10,
            handoffTimeoutMs: modelConfig?.handoffTimeoutMs ?? 5000
        };
    }
    /**
     * Check model orchestration health metrics
     */
    async checkModelHealth() {
        const metrics = await this.getModelMetrics();
        return {
            resources: metrics.resources,
            orchestration: {
                status: this.determineStatus(metrics),
                activeHandoffs: metrics.orchestration.activeHandoffs,
                queueDepth: metrics.orchestration.queueDepth
            },
            canAcceptTasks: this.evaluateCapacity(metrics)
        };
    }
    /**
     * Get current model-specific metrics
     */
    async getModelMetrics() {
        const baseMetrics = this.getRawMetrics();
        const metrics = this.getMetricsCollector();
        const heapUsed = process.memoryUsage().heapUsed;
        const heapTotal = process.memoryUsage().heapTotal;
        return {
            resources: {
                memoryAvailable: heapTotal - heapUsed,
                cpuAvailable: 100 - baseMetrics.resourceUsage.cpuUsage,
                activeModels: baseMetrics.resourceUsage.storageUsage
            },
            orchestration: {
                activeHandoffs: this.getActiveHandoffs(),
                queueDepth: this.getTaskQueueDepth()
            }
        };
    }
    /**
     * Get current number of active model handoffs
     */
    getActiveHandoffs() {
        const metrics = this.getMetricsCollector();
        return metrics.getTotalOperations() - metrics.getRecentErrorCount(this.modelConfig.handoffTimeoutMs);
    }
    /**
     * Get current task queue depth
     */
    getTaskQueueDepth() {
        const metrics = this.getRawMetrics();
        const now = Date.now();
        return metrics.recentLatencies.filter((_, idx) => now - metrics.recentLatencyTimestamps[idx] <= this.modelConfig.handoffTimeoutMs).length;
    }
    /**
     * Evaluate if system can accept more tasks
     */
    evaluateCapacity(metrics) {
        return (metrics.resources.memoryAvailable >= this.modelConfig.minAvailableMemory &&
            metrics.resources.activeModels < this.modelConfig.maxActiveModels &&
            metrics.orchestration.queueDepth < this.modelConfig.maxQueueDepth);
    }
    /**
     * Determine orchestration status
     */
    determineStatus(metrics) {
        // Check for critical conditions
        if (metrics.resources.memoryAvailable < this.modelConfig.minAvailableMemory * 0.5 ||
            metrics.orchestration.queueDepth >= this.modelConfig.maxQueueDepth) {
            return 'unavailable';
        }
        // Check for warning conditions
        if (metrics.resources.memoryAvailable < this.modelConfig.minAvailableMemory * 0.7 ||
            metrics.orchestration.queueDepth >= this.modelConfig.maxQueueDepth * 0.8 ||
            metrics.resources.activeModels >= this.modelConfig.maxActiveModels * 0.8) {
            return 'degraded';
        }
        return 'available';
    }
}
exports.ModelHealthMonitor = ModelHealthMonitor;
//# sourceMappingURL=model-health-monitor.js.map