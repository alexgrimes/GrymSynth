"use strict";
/**
 * Performance testing types and interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_THRESHOLDS = exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    baselineIterations: 100,
    crossModelPairs: 5,
    loadTestDuration: 3600000,
    metricsInterval: 5000,
    maxConcurrentRequests: 10,
    memoryThreshold: 1024 * 1024 * 1024,
    responseTimeThreshold: 1000,
    outputDir: './test-results',
    maxMemory: 2 * 1024 * 1024 * 1024 // 2GB
};
exports.DEFAULT_THRESHOLDS = {
    maxMemoryUsage: 1024 * 1024 * 1024,
    avgResponseTime: 1000,
    contextPreservation: 0.95,
    modelSwitchTime: 500,
    contextAccuracy: 0.9,
    memoryGrowth: 512 * 1024 * 1024,
    errorRate: 0.01,
    concurrentRequests: 10
};
//# sourceMappingURL=types.js.map