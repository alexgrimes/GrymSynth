"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateResourcePressure = exports.waitForEvent = exports.mockCleanupEvent = exports.mockExhaustionEvent = exports.mockPressureEvent = exports.createMockEvent = exports.sleep = exports.createTestProvider = exports.createTestContext = exports.createTestSystemResources = exports.createTestModelConstraints = exports.DEFAULT_MODEL_CONSTRAINTS = exports.createTestMessage = void 0;
const mock_llm_provider_1 = require("./mock-llm-provider");
const createTestMessage = (content) => ({
    content,
    role: 'user',
    timestamp: Date.now()
});
exports.createTestMessage = createTestMessage;
exports.DEFAULT_MODEL_CONSTRAINTS = {
    maxTokens: 1000,
    contextWindow: 2048,
    truncateMessages: true
};
const createTestModelConstraints = (overrides = {}) => ({
    ...exports.DEFAULT_MODEL_CONSTRAINTS,
    ...overrides
});
exports.createTestModelConstraints = createTestModelConstraints;
const createTestSystemResources = (overrides = {}) => ({
    memory: 0,
    cpu: 0,
    totalMemory: 1024 * 1024 * 1024,
    availableCores: 4,
    gpuMemory: 0,
    timestamp: Date.now(),
    memoryPressure: 0,
    ...overrides
});
exports.createTestSystemResources = createTestSystemResources;
const createTestContext = (modelId, constraints = exports.DEFAULT_MODEL_CONSTRAINTS, overrides = {}) => ({
    modelId,
    messages: [],
    tokenCount: 0,
    tokens: 0,
    constraints,
    metadata: {
        lastAccess: Date.now(),
        createdAt: Date.now(),
        priority: 1,
        lastUpdated: Date.now(),
        importance: 0
    },
    ...overrides
});
exports.createTestContext = createTestContext;
const createTestProvider = (name = 'test-provider', config) => {
    const { specialization, errorRate = 0, maxTokens = 1000, resourceUsage } = config;
    return new mock_llm_provider_1.MockLLMProvider(name, `mock://${name}`, 2048, specialization, {
        errorRate,
        maxTokens,
        resourceUsage: resourceUsage || {
            memoryUsage: 0,
            cpuUsage: 0,
            tokenCount: 0,
            messageCount: 0
        }
    });
};
exports.createTestProvider = createTestProvider;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.sleep = sleep;
const createMockEvent = (type, data = {}) => ({
    type,
    timestamp: Date.now(),
    data
});
exports.createMockEvent = createMockEvent;
exports.mockPressureEvent = {
    type: 'resourcePressure',
    timestamp: Date.now(),
    data: {
        pressure: 0.85,
        threshold: 0.8,
        source: 'memory'
    }
};
exports.mockExhaustionEvent = {
    type: 'resourceExhausted',
    timestamp: Date.now(),
    data: {
        reason: 'Memory limit exceeded',
        limit: 1000,
        current: 1100
    }
};
exports.mockCleanupEvent = {
    type: 'resourceCleanup',
    timestamp: Date.now(),
    data: {
        bytesFreed: 500,
        messageCount: 3,
        duration: 50
    }
};
const waitForEvent = async (emitter, eventName, timeout = 1000) => {
    return new Promise((resolve, reject) => {
        let resolved = false;
        const timer = setTimeout(() => {
            if (!resolved) {
                reject(new Error(`Timeout waiting for event: ${eventName}`));
            }
        }, timeout);
        emitter.on(eventName, (data) => {
            resolved = true;
            clearTimeout(timer);
            resolve(data);
        });
    });
};
exports.waitForEvent = waitForEvent;
const simulateResourcePressure = async (provider, pressure = 0.9) => {
    await provider.simulateMemoryPressure(pressure);
};
exports.simulateResourcePressure = simulateResourcePressure;
//# sourceMappingURL=test-helpers.js.map