"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultSystemResources = exports.getBufferValueFromResources = exports.getCpuUsageFromResources = exports.getMemoryUsageFromResources = exports.getContextWindowFromResources = exports.getModelConstraints = exports.isModelConstraintsArray = exports.getContextWindow = exports.getBufferValue = exports.getMemoryUsage = exports.isMemoryPressureConfig = exports.isNumber = exports.isBufferThresholds = exports.ResourceError = void 0;
class ResourceError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ResourceError';
        this.code = code;
    }
}
exports.ResourceError = ResourceError;
// Type guards and helper functions
const isBufferThresholds = (value) => {
    return typeof value === 'object' && value !== null && ('initial' in value ||
        'max' in value ||
        'optimizationThreshold' in value ||
        'compressionThreshold' in value);
};
exports.isBufferThresholds = isBufferThresholds;
const isNumber = (value) => {
    return typeof value === 'number';
};
exports.isNumber = isNumber;
const isMemoryPressureConfig = (value) => {
    return typeof value === 'object' && value !== null && ('warning' in value ||
        'critical' in value ||
        'action' in value);
};
exports.isMemoryPressureConfig = isMemoryPressureConfig;
const getMemoryUsage = (metrics) => {
    return metrics.memoryUsage || 0;
};
exports.getMemoryUsage = getMemoryUsage;
const getBufferValue = (value) => {
    if (!value)
        return 0;
    if (typeof value === 'number')
        return value;
    return value.initial || value.max || 0;
};
exports.getBufferValue = getBufferValue;
const getContextWindow = (context) => {
    return context.contextWindow || context.constraints.contextWindow;
};
exports.getContextWindow = getContextWindow;
const isModelConstraintsArray = (value) => {
    return Array.isArray(value);
};
exports.isModelConstraintsArray = isModelConstraintsArray;
const getModelConstraints = (resources) => {
    const constraints = resources.modelConstraints;
    if (!constraints) {
        return {
            maxTokens: 0,
            contextWindow: 0
        };
    }
    if ((0, exports.isModelConstraintsArray)(constraints)) {
        return constraints[0] || { maxTokens: 0, contextWindow: 0 };
    }
    return constraints;
};
exports.getModelConstraints = getModelConstraints;
const getContextWindowFromResources = (resources) => {
    const constraints = (0, exports.getModelConstraints)(resources);
    return constraints.contextWindow;
};
exports.getContextWindowFromResources = getContextWindowFromResources;
const getMemoryUsageFromResources = (resources) => {
    return resources.memory || 0;
};
exports.getMemoryUsageFromResources = getMemoryUsageFromResources;
const getCpuUsageFromResources = (resources) => {
    return resources.cpu || 0;
};
exports.getCpuUsageFromResources = getCpuUsageFromResources;
const getBufferValueFromResources = (resources, key) => {
    return resources.buffers?.[key] || 0;
};
exports.getBufferValueFromResources = getBufferValueFromResources;
const createDefaultSystemResources = () => ({
    memory: 0,
    cpu: 0,
    totalMemory: 0,
    allocatedMemory: 0,
    availableMemory: 0,
    peakMemory: 0,
    memoryPressure: 0,
    modelConstraints: { maxTokens: 0, contextWindow: 0 },
    timestamp: Date.now()
});
exports.createDefaultSystemResources = createDefaultSystemResources;
//# sourceMappingURL=types.js.map