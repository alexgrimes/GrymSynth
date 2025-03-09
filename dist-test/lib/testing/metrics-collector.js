"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
class MetricsCollector {
    constructor() {
        this.collectionInterval = null;
        this.snapshots = [];
        this.modelMemoryUsage = new Map();
        this.timings = new Map();
    }
    startCollection() {
        if (this.collectionInterval) {
            return;
        }
        this.collectionInterval = setInterval(() => {
            this.collectSnapshot();
        }, 1000); // Collect every second
    }
    stopCollection() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
    }
    async collectMetrics(sampleDuration) {
        const startTime = performance.now();
        const startMemory = process.memoryUsage().heapUsed;
        let peakMemory = startMemory;
        // Collect samples for the specified duration
        while (performance.now() - startTime < sampleDuration) {
            const currentMemory = process.memoryUsage().heapUsed;
            peakMemory = Math.max(peakMemory, currentMemory);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const endMemory = process.memoryUsage().heapUsed;
        return {
            memoryUsage: {
                baseline: startMemory,
                peak: peakMemory,
                afterRelease: endMemory
            },
            contextStats: {
                loadTime: this.getAverageTime('load'),
                transitionTime: this.getAverageTime('transition'),
                compressionRatio: this.calculateCompressionRatio()
            },
            modelMetrics: {
                inferenceTime: this.getAverageTime('inference'),
                responseLatency: this.getAverageTime('response'),
                contextSwitchTime: this.getAverageTime('switch')
            }
        };
    }
    recordModelMemory(modelId, memoryUsage) {
        if (!this.modelMemoryUsage.has(modelId)) {
            this.modelMemoryUsage.set(modelId, []);
        }
        this.modelMemoryUsage.get(modelId).push(memoryUsage);
    }
    recordTiming(type, duration) {
        if (!this.timings.has(type)) {
            this.timings.set(type, []);
        }
        this.timings.get(type).push(duration);
    }
    getModelMemoryMetrics() {
        const metrics = {};
        this.modelMemoryUsage.forEach((usages, modelId) => {
            const avg = usages.reduce((a, b) => a + b, 0) / usages.length;
            const peak = Math.max(...usages);
            metrics[modelId] = { avg, peak };
        });
        return metrics;
    }
    getAverages() {
        const averages = {};
        this.timings.forEach((times, type) => {
            averages[`avg${type.charAt(0).toUpperCase() + type.slice(1)}Time`] =
                times.reduce((a, b) => a + b, 0) / times.length;
        });
        return averages;
    }
    collectSnapshot() {
        const metrics = this.getCurrentMetrics();
        this.snapshots.push({
            timestamp: Date.now(),
            metrics
        });
    }
    getCurrentMetrics() {
        const memUsage = process.memoryUsage();
        return {
            memoryUsage: {
                baseline: memUsage.heapUsed,
                peak: memUsage.heapTotal,
                afterRelease: memUsage.external
            },
            contextStats: {
                loadTime: this.getAverageTime('load'),
                transitionTime: this.getAverageTime('transition'),
                compressionRatio: this.calculateCompressionRatio()
            },
            modelMetrics: {
                inferenceTime: this.getAverageTime('inference'),
                responseLatency: this.getAverageTime('response'),
                contextSwitchTime: this.getAverageTime('switch')
            }
        };
    }
    getAverageTime(type) {
        const times = this.timings.get(type) || [];
        return times.length > 0
            ? times.reduce((a, b) => a + b, 0) / times.length
            : 0;
    }
    calculateCompressionRatio() {
        // Simulate compression ratio calculation
        // In a real implementation, this would be based on actual context size measurements
        return 0.8; // Example: 80% compression ratio
    }
    getSystemMetrics() {
        const memUsage = process.memoryUsage();
        return {
            timestamp: Date.now(),
            memory: {
                total: memUsage.heapTotal,
                used: memUsage.heapUsed,
                free: memUsage.heapTotal - memUsage.heapUsed
            },
            cpu: {
                user: 0,
                system: 0,
                idle: 0
            }
        };
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metrics-collector.js.map