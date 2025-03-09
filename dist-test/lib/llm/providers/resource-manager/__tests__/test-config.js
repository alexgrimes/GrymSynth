"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestConfig = exports.mockConfig = exports.TEST_MODEL_IDS = void 0;
exports.TEST_MODEL_IDS = {
    MODEL_1: 'test-model-1',
    MODEL_2: 'test-model-2',
    MODEL_3: 'test-model-3',
    DEFAULT: 'test-model'
};
const defaultSummarizationConfig = {
    maxTokens: 1000,
    method: 'extractive',
    preserveRecentMessages: 5,
    compressionRatio: 0.5,
    minPreservedQuality: 0.7
};
exports.mockConfig = {
    limits: {
        maxModelsLoaded: 2,
        memoryThreshold: 0.8,
        inactivityTimeout: 1000
    },
    buffers: {
        context: {
            initial: 1000,
            max: 2000,
            compressionThreshold: 0.8,
            optimizationThreshold: 0.9
        },
        working: {
            initial: 500,
            max: 1000,
            optimizationThreshold: 0.9
        }
    },
    modelSizes: {
        [exports.TEST_MODEL_IDS.DEFAULT]: 5000,
        [exports.TEST_MODEL_IDS.MODEL_1]: 5000,
        [exports.TEST_MODEL_IDS.MODEL_2]: 5000,
        [exports.TEST_MODEL_IDS.MODEL_3]: 5000
    },
    memoryPressure: {
        warning: 0.7,
        critical: 0.9,
        action: 'compress'
    },
    contextPreservation: {
        enabled: true,
        preservationStrategy: 'selective',
        maxPreservedContexts: 5,
        preservationThreshold: 0.6,
        summarizationConfig: defaultSummarizationConfig
    },
    debug: true
};
const mergeSummarizationConfig = (base, override) => ({
    maxTokens: override?.maxTokens ?? base.maxTokens,
    method: override?.method ?? base.method,
    preserveRecentMessages: override?.preserveRecentMessages ?? base.preserveRecentMessages,
    compressionRatio: override?.compressionRatio ?? base.compressionRatio,
    minPreservedQuality: override?.minPreservedQuality ?? base.minPreservedQuality
});
const createTestConfig = (overrides = {}) => {
    const baseConfig = { ...exports.mockConfig };
    if (overrides.contextPreservation) {
        baseConfig.contextPreservation = {
            ...exports.mockConfig.contextPreservation,
            ...overrides.contextPreservation,
            summarizationConfig: mergeSummarizationConfig(defaultSummarizationConfig, overrides.contextPreservation.summarizationConfig)
        };
    }
    return {
        ...baseConfig,
        ...overrides,
        limits: {
            ...exports.mockConfig.limits,
            ...(overrides.limits || {})
        },
        buffers: {
            context: {
                ...exports.mockConfig.buffers.context,
                ...(overrides.buffers?.context || {})
            },
            working: {
                ...exports.mockConfig.buffers.working,
                ...(overrides.buffers?.working || {})
            }
        },
        modelSizes: {
            ...exports.mockConfig.modelSizes,
            ...(overrides.modelSizes || {})
        },
        memoryPressure: {
            ...exports.mockConfig.memoryPressure,
            ...(overrides.memoryPressure || {})
        }
    };
};
exports.createTestConfig = createTestConfig;
//# sourceMappingURL=test-config.js.map