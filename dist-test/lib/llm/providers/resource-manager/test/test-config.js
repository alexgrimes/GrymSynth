"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConfig = void 0;
exports.testConfig = {
    maxMemoryUsage: 1024 * 1024 * 1024,
    maxCpuUsage: 80,
    optimizationThreshold: 0.8,
    cleanupInterval: 1000,
    cacheDir: './test-cache',
    limits: {
        maxModels: 5,
        maxTokensPerModel: 8192,
        maxTotalTokens: 32768
    },
    contextPreservation: {
        enabled: true,
        maxSize: 1024 * 1024,
        preservationStrategy: 'hybrid'
    },
    debug: true
};
//# sourceMappingURL=test-config.js.map