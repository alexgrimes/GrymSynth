"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHealthStatus = exports.isResourceMetrics = exports.isFeatureMemoryMetrics = exports.isRecognitionMetrics = exports.isStorageMetrics = exports.createStorageOperationResult = exports.createFeatureMemoryMetrics = exports.DEFAULT_HEALTH_STATUS = exports.DEFAULT_BASIC_METRICS = exports.DEFAULT_RESOURCE_METRICS = void 0;
// Default values
exports.DEFAULT_RESOURCE_METRICS = {
    memoryUsage: 0,
    cpuUsage: 0,
    storageUsage: 0,
    storageLimit: 1000
};
exports.DEFAULT_BASIC_METRICS = {
    responseTime: 0,
    throughput: 0,
    errorRate: 0,
    totalOperations: 0,
    latency: 0
};
exports.DEFAULT_HEALTH_STATUS = {
    status: 'healthy',
    lastCheck: new Date(),
    indicators: {
        memory: {
            heapUsage: 0,
            heapLimit: process.memoryUsage().heapTotal,
            cacheUtilization: 0,
            status: 'healthy'
        },
        performance: {
            averageLatency: 0,
            p95Latency: 0,
            throughput: 0,
            status: 'healthy',
            latencyVariance: 0,
            spikeFactor: 0,
            recentThroughput: 0
        },
        errors: {
            errorRate: 0,
            recentErrors: 0,
            status: 'healthy'
        },
        metrics: exports.DEFAULT_BASIC_METRICS
    },
    recommendations: [],
    metrics: exports.DEFAULT_BASIC_METRICS
};
// Helper functions
function createFeatureMemoryMetrics(baseMetrics = {}, resourceUsage = {}, healthStatus = {}) {
    return {
        kind: 'feature',
        timestamp: new Date(),
        durationMs: 0,
        patternRecognitionLatency: 0,
        storageOperationLatency: 0,
        optimizationEffectiveness: 0,
        recentLatencies: [],
        recentLatencyTimestamps: [],
        resourceUsage: { ...exports.DEFAULT_RESOURCE_METRICS, ...resourceUsage },
        healthStatus: { ...exports.DEFAULT_HEALTH_STATUS, ...healthStatus },
        ...baseMetrics
    };
}
exports.createFeatureMemoryMetrics = createFeatureMemoryMetrics;
function createStorageOperationResult(data = null, operationType, startTime, success = true, error, errorType = 'processing', affectedPatterns = 0) {
    const metrics = {
        ...createFeatureMemoryMetrics(),
        operationType,
        durationMs: performance.now() - startTime
    };
    if (!success || error || data === null) {
        return {
            success: false,
            error: error || 'Operation returned no data',
            errorType,
            data: null,
            metrics,
            health: metrics.healthStatus,
            affectedPatterns,
        };
    }
    return {
        success: true,
        data,
        metrics,
        health: metrics.healthStatus,
        affectedPatterns,
    };
}
exports.createStorageOperationResult = createStorageOperationResult;
// Type guards
function isStorageMetrics(metrics) {
    if (!isFeatureMemoryMetrics(metrics))
        return false;
    const m = metrics;
    return ['storage', 'retrieval', 'search'].includes(m.operationType);
}
exports.isStorageMetrics = isStorageMetrics;
function isRecognitionMetrics(metrics) {
    if (!isFeatureMemoryMetrics(metrics))
        return false;
    const m = metrics;
    return m.operationType === 'recognition';
}
exports.isRecognitionMetrics = isRecognitionMetrics;
function isFeatureMemoryMetrics(metrics) {
    if (!metrics || typeof metrics !== 'object')
        return false;
    const m = metrics;
    return (m.kind === 'feature' &&
        typeof m.patternRecognitionLatency === 'number' &&
        typeof m.storageOperationLatency === 'number' &&
        typeof m.optimizationEffectiveness === 'number' &&
        Array.isArray(m.recentLatencies) &&
        isResourceMetrics(m.resourceUsage) &&
        isHealthStatus(m.healthStatus));
}
exports.isFeatureMemoryMetrics = isFeatureMemoryMetrics;
function isResourceMetrics(metrics) {
    if (!metrics || typeof metrics !== 'object')
        return false;
    const m = metrics;
    return (typeof m.memoryUsage === 'number' &&
        typeof m.cpuUsage === 'number' &&
        typeof m.storageUsage === 'number' &&
        typeof m.storageLimit === 'number');
}
exports.isResourceMetrics = isResourceMetrics;
function isHealthStatus(status) {
    if (!status || typeof status !== 'object')
        return false;
    const s = status;
    return (['healthy', 'degraded', 'unhealthy'].includes(s.status) &&
        s.lastCheck instanceof Date &&
        typeof s.indicators === 'object' &&
        Array.isArray(s.recommendations));
}
exports.isHealthStatus = isHealthStatus;
//# sourceMappingURL=types.js.map