"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRetry = exports.hasErrors = exports.isHealthy = exports.createErrorHealthState = exports.createDefaultHealthState = void 0;
function createDefaultHealthState() {
    return {
        status: 'healthy',
        health: {
            cpu: 0,
            memory: 0,
            errorRate: 0
        },
        errorCount: 0,
        metrics: {
            responseTime: 0,
            throughput: 0,
            errorRate: 0,
            totalOperations: 0
        },
        timestamp: new Date()
    };
}
exports.createDefaultHealthState = createDefaultHealthState;
function createErrorHealthState(error) {
    return {
        status: 'error',
        health: {
            cpu: 0,
            memory: 0,
            errorRate: 1
        },
        errorCount: 1,
        metrics: {
            responseTime: 0,
            throughput: 0,
            errorRate: 1,
            totalOperations: 0
        },
        errors: {
            errorCount: 1,
            lastError: error,
            errorTypes: new Map([[error.name, 1]])
        },
        timestamp: new Date()
    };
}
exports.createErrorHealthState = createErrorHealthState;
function isHealthy(state) {
    return state.status === 'healthy' && state.health.errorRate === 0;
}
exports.isHealthy = isHealthy;
function hasErrors(state) {
    return state.errorCount > 0 || state.health.errorRate > 0;
}
exports.hasErrors = hasErrors;
function shouldRetry(state) {
    return state.status !== 'unavailable' && state.errorCount < 3;
}
exports.shouldRetry = shouldRetry;
//# sourceMappingURL=health.js.map