"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
/**
 * MetricsCollector - Collects and aggregates performance metrics
 */
const types_1 = require("./types");
class MetricsCollector {
    constructor() {
        this.operationMetrics = new Map();
        this.startTimes = new Map();
        this.recentErrors = [];
        this.metricsWindow = 60000; // 1 minute window
        this.errorWindow = 300000; // 5 minute window
        this.lastCleanup = Date.now();
        this.maxStorageSize = 1000; // Maximum number of operations to track
    }
    /**
     * Start timing an operation
     */
    startOperation(operation) {
        this.startTimes.set(operation, performance.now());
        this.ensureOperationMetrics(operation);
    }
    /**
     * End timing an operation and record its duration
     */
    endOperation(operation) {
        const startTime = this.startTimes.get(operation);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.recordLatency(operation, duration);
            this.startTimes.delete(operation);
            const metrics = this.operationMetrics.get(operation);
            if (metrics) {
                metrics.totalOperations++;
                metrics.lastUpdated = Date.now();
            }
        }
    }
    /**
     * Record a latency measurement for an operation
     */
    recordLatency(operation, duration) {
        const metrics = this.ensureOperationMetrics(operation);
        const now = Date.now();
        metrics.latencies.push(duration);
        metrics.latencyTimestamps.push(now);
        metrics.lastUpdated = now;
        if (now - this.lastCleanup > this.metricsWindow / 4) {
            this.cleanupOldMetrics();
        }
    }
    /**
     * Record an error for an operation
     */
    recordError(operation, type = 'storage') {
        const metrics = this.ensureOperationMetrics(operation);
        metrics.errorCount++;
        metrics.lastUpdated = Date.now();
        this.recentErrors.push({
            timestamp: Date.now(),
            operation,
            type
        });
        this.cleanupOldErrors();
    }
    /**
     * Get total number of operations across all types
     */
    getTotalOperations() {
        let total = 0;
        for (const metrics of this.operationMetrics.values()) {
            total += metrics.totalOperations;
        }
        return total;
    }
    /**
     * Get error rate for specific operation or overall
     */
    getErrorRate(operation) {
        const now = Date.now();
        const windowStart = now - this.metricsWindow;
        if (operation) {
            const metrics = this.operationMetrics.get(operation);
            if (!metrics || metrics.totalOperations === 0)
                return 0;
            return metrics.errorCount / metrics.totalOperations;
        }
        let totalErrors = 0;
        let totalOps = 0;
        for (const metrics of this.operationMetrics.values()) {
            if (metrics.lastUpdated >= windowStart) {
                totalErrors += metrics.errorCount;
                totalOps += metrics.totalOperations;
            }
        }
        return totalOps === 0 ? 0 : totalErrors / totalOps;
    }
    /**
     * Get number of recent errors within the specified time window
     */
    getRecentErrorCount(timeWindow = this.errorWindow) {
        const cutoff = Date.now() - timeWindow;
        return this.recentErrors.filter(error => error.timestamp > cutoff).length;
    }
    /**
     * Get aggregated metrics
     */
    getMetrics() {
        this.cleanupOldMetrics();
        const now = Date.now();
        const metrics = this.calculateAggregatedMetrics();
        const resourceMetrics = this.calculateResourceMetrics();
        const healthStatus = this.calculateHealthStatus(metrics);
        const recentData = this.getRecentLatencyData();
        return (0, types_1.createFeatureMemoryMetrics)({
            timestamp: new Date(),
            durationMs: metrics.avgLatency,
            patternRecognitionLatency: metrics.avgLatency,
            storageOperationLatency: metrics.p95Latency,
            optimizationEffectiveness: this.calculateOptimizationScore(metrics.avgLatency),
            recentLatencies: recentData.map(d => d.latency),
            recentLatencyTimestamps: recentData.map(d => d.timestamp)
        }, resourceMetrics, healthStatus);
    }
    calculateAggregatedMetrics() {
        let totalLatency = 0;
        let totalOperations = 0;
        let totalErrors = 0;
        const allLatencies = [];
        // Pre-calculate array size to avoid resizing
        let totalLatencyCount = 0;
        for (const metrics of this.operationMetrics.values()) {
            totalLatencyCount += metrics.latencies.length;
        }
        allLatencies.length = totalLatencyCount;
        // Fill array iteratively
        let latencyIndex = 0;
        for (const metrics of this.operationMetrics.values()) {
            for (let i = 0; i < metrics.latencies.length; i++) {
                allLatencies[latencyIndex++] = metrics.latencies[i];
                totalLatency += metrics.latencies[i];
            }
            totalOperations += metrics.totalOperations;
            totalErrors += metrics.errorCount;
        }
        const avgLatency = totalOperations > 0 ? totalLatency / totalOperations : 0;
        const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
        const throughput = totalOperations / (this.metricsWindow / 1000);
        const p95Latency = this.calculateP95Latency(allLatencies);
        return {
            totalLatency,
            totalOperations,
            totalErrors,
            allLatencies,
            avgLatency,
            errorRate,
            throughput,
            p95Latency
        };
    }
    calculateResourceMetrics() {
        return {
            memoryUsage: process.memoryUsage().heapUsed,
            cpuUsage: this.calculateCpuUsage(),
            storageUsage: this.calculateStorageUsage(),
            storageLimit: this.maxStorageSize
        };
    }
    calculateHealthStatus(metrics) {
        const healthStatus = this.determineHealthStatus(metrics.errorRate, metrics.avgLatency);
        return {
            status: healthStatus,
            indicators: {
                memory: {
                    heapUsage: process.memoryUsage().heapUsed,
                    heapLimit: process.memoryUsage().heapTotal,
                    cacheUtilization: this.calculateStorageUsage() / this.maxStorageSize,
                    status: healthStatus
                },
                performance: {
                    averageLatency: metrics.avgLatency,
                    p95Latency: metrics.p95Latency,
                    throughput: metrics.throughput,
                    status: healthStatus,
                    latencyVariance: this.calculateLatencyVariance(metrics.allLatencies, metrics.avgLatency),
                    spikeFactor: this.calculateSpikeFactor(metrics.allLatencies, metrics.avgLatency),
                    recentThroughput: this.calculateRecentThroughput()
                },
                errors: {
                    errorRate: metrics.errorRate,
                    recentErrors: this.getRecentErrorCount(),
                    status: healthStatus
                }
            },
            lastCheck: new Date(),
            recommendations: this.generateRecommendations(metrics.errorRate, metrics.avgLatency),
            metrics: {
                errorRate: metrics.errorRate,
                responseTime: metrics.avgLatency,
                throughput: metrics.throughput,
                totalOperations: metrics.totalOperations
            }
        };
    }
    getRecentLatencyData() {
        // Pre-calculate total size
        let totalSize = 0;
        for (const metrics of this.operationMetrics.values()) {
            totalSize += metrics.latencies.length;
        }
        // Pre-allocate arrays
        const latencyData = new Array(totalSize);
        let index = 0;
        // Fill arrays iteratively
        for (const metrics of this.operationMetrics.values()) {
            for (let i = 0; i < metrics.latencies.length; i++) {
                latencyData[index++] = {
                    latency: metrics.latencies[i],
                    timestamp: metrics.latencyTimestamps[i]
                };
            }
        }
        // Sort in-place and take most recent 100
        return latencyData
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 100);
    }
    /**
     * Clean up old metrics that are outside the tracking window
     */
    cleanupOldMetrics() {
        const now = Date.now();
        if (now - this.lastCleanup < this.metricsWindow / 4)
            return;
        const cutoff = now - this.metricsWindow;
        for (const [operation, metrics] of this.operationMetrics.entries()) {
            if (metrics.lastUpdated < cutoff) {
                this.operationMetrics.delete(operation);
            }
            else {
                // Keep only recent latencies and their timestamps
                const recentIndices = metrics.latencyTimestamps
                    .map((ts, idx) => ({ ts, idx }))
                    .filter(({ ts }) => ts > cutoff)
                    .map(({ idx }) => idx);
                metrics.latencies = recentIndices.map(idx => metrics.latencies[idx]);
                metrics.latencyTimestamps = recentIndices.map(idx => metrics.latencyTimestamps[idx]);
            }
        }
        this.lastCleanup = now;
    }
    /**
     * Clean up old error events
     */
    cleanupOldErrors() {
        const cutoff = Date.now() - this.errorWindow;
        this.recentErrors = this.recentErrors.filter(error => error.timestamp > cutoff);
    }
    /**
     * Calculate optimization effectiveness score
     */
    calculateOptimizationScore(avgLatency) {
        const targetLatency = 20; // 20ms target
        return Math.max(0, Math.min(1, 1 - (avgLatency / targetLatency)));
    }
    /**
     * Calculate CPU usage approximation
     */
    calculateCpuUsage() {
        let totalOperations = 0;
        for (const metrics of this.operationMetrics.values()) {
            totalOperations += metrics.totalOperations;
        }
        return Math.min(1, totalOperations / this.maxStorageSize);
    }
    /**
     * Calculate storage usage based on tracked metrics
     */
    calculateStorageUsage() {
        let totalEntries = 0;
        for (const metrics of this.operationMetrics.values()) {
            totalEntries += metrics.latencies.length;
        }
        return totalEntries;
    }
    /**
     * Calculate 95th percentile latency
     */
    calculateP95Latency(latencies) {
        if (latencies.length === 0)
            return 0;
        const sorted = [...latencies].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.95);
        return sorted[index];
    }
    /**
     * Calculate latency variance
     */
    calculateLatencyVariance(latencies, avgLatency) {
        if (latencies.length === 0)
            return 0;
        const squaredDiffs = latencies.map(l => Math.pow(l - avgLatency, 2));
        return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / latencies.length);
    }
    /**
     * Calculate spike factor
     */
    calculateSpikeFactor(latencies, avgLatency) {
        if (latencies.length === 0)
            return 0;
        const variance = this.calculateLatencyVariance(latencies, avgLatency);
        if (variance === 0)
            return 0;
        // Calculate how many standard deviations the max latency is from the mean
        const maxLatency = Math.max(...latencies);
        return (maxLatency - avgLatency) / variance;
    }
    /**
     * Calculate recent throughput
     */
    calculateRecentThroughput() {
        const now = Date.now();
        const recentWindow = 10000; // Look at last 10 seconds
        let recentOperations = 0;
        for (const metrics of this.operationMetrics.values()) {
            const recentLatencies = metrics.latencyTimestamps.filter(ts => now - ts <= recentWindow).length;
            recentOperations += recentLatencies;
        }
        return (recentOperations / recentWindow) * 1000; // Convert to ops/sec
    }
    /**
     * Determine system health status
     */
    determineHealthStatus(errorRate, avgLatency) {
        // More lenient thresholds during initial warmup period
        const isWarmupPhase = this.getTotalOperations() < 100;
        if (isWarmupPhase) {
            if (errorRate > 0.2 || avgLatency > 200)
                return 'unhealthy';
            if (errorRate > 0.1 || avgLatency > 100)
                return 'degraded';
            return 'healthy';
        }
        // Normal operation thresholds with gradual degradation
        if (errorRate > 0.15 || avgLatency > 150)
            return 'unhealthy';
        if (errorRate > 0.08 || avgLatency > 75)
            return 'degraded';
        return 'healthy';
    }
    /**
     * Generate health recommendations based on metrics
     */
    generateRecommendations(errorRate, avgLatency) {
        const recommendations = [];
        if (errorRate > 0.1) {
            recommendations.push('High error rate detected. Consider implementing circuit breakers.');
        }
        else if (errorRate > 0.05) {
            recommendations.push('Elevated error rate. Monitor error patterns.');
        }
        if (avgLatency > 100) {
            recommendations.push('High latency detected. Consider optimizing operations.');
        }
        else if (avgLatency > 50) {
            recommendations.push('Latency is above target. Review performance bottlenecks.');
        }
        const memUsage = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
        if (memUsage > 0.9) {
            recommendations.push('Memory usage is critical. Consider garbage collection.');
        }
        else if (memUsage > 0.7) {
            recommendations.push('Memory usage is high. Monitor allocation patterns.');
        }
        return recommendations;
    }
    /**
     * Ensure operation metrics exist
     */
    ensureOperationMetrics(operation) {
        if (!this.operationMetrics.has(operation)) {
            this.operationMetrics.set(operation, {
                latencies: [],
                latencyTimestamps: [],
                errorCount: 0,
                totalOperations: 0,
                lastUpdated: Date.now()
            });
        }
        return this.operationMetrics.get(operation);
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metrics-collector.js.map