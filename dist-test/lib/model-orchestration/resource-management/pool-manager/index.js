"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CIRCUIT_BREAKER_CONFIG = exports.DEFAULT_POOL_CONFIG = exports.CircuitBreaker = exports.PoolCache = exports.ResourcePoolManager = void 0;
var pool_manager_1 = require("./pool-manager");
Object.defineProperty(exports, "ResourcePoolManager", { enumerable: true, get: function () { return pool_manager_1.ResourcePoolManager; } });
var pool_cache_1 = require("./pool-cache");
Object.defineProperty(exports, "PoolCache", { enumerable: true, get: function () { return pool_cache_1.PoolCache; } });
var circuit_breaker_1 = require("./circuit-breaker");
Object.defineProperty(exports, "CircuitBreaker", { enumerable: true, get: function () { return circuit_breaker_1.CircuitBreaker; } });
// Default configurations
exports.DEFAULT_POOL_CONFIG = {
    maxPoolSize: 1000,
    minPoolSize: 10,
    cleanupIntervalMs: 60000,
    resourceTimeoutMs: 30000,
    cacheMaxSize: 100,
    enableCircuitBreaker: true,
    warningThreshold: 0.7,
    criticalThreshold: 0.9 // 90% utilization triggers critical
};
exports.DEFAULT_CIRCUIT_BREAKER_CONFIG = {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
    halfOpenMaxAttempts: 3
};
//# sourceMappingURL=index.js.map