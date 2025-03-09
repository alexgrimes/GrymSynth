"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorSimulator = exports.delay = exports.generateTestExecutionResults = exports.MockRegistry = exports.createMockModelResult = exports.createMockModelChain = exports.createMockModel = exports.createTestTask = void 0;
/**
 * Create a mock task with specified capabilities and requirements
 */
function createTestTask(taskType, taskPriority = 'quality', taskOptions = {}) {
    // Create minimal requirements that allow TaskAnalyzer to do inference
    const taskRequirements = {
        // Only set primaryCapability if explicitly provided
        primaryCapability: taskOptions.primaryCapability || 'reasoning',
        // Let TaskAnalyzer infer secondary capabilities
        secondaryCapabilities: taskOptions.secondaryCapabilities || [],
        // Let TaskAnalyzer calculate scores
        minCapabilityScores: taskOptions.minScores || new Map(),
        // Let TaskAnalyzer determine context size
        contextSize: taskOptions.contextSize || 0,
        // Always set priority
        priority: taskPriority,
        // Only set constraints if provided
        resourceConstraints: taskOptions.resourceConstraints
    };
    // Create task with explicit property assignments
    const task = {
        id: `test-task-${Math.random().toString(36).substr(2, 9)}`,
        type: taskType,
        description: `Test task for ${taskType}`,
        input: {},
        requirements: taskRequirements
    };
    return task;
}
exports.createTestTask = createTestTask;
/**
 * Create a mock model with specified capabilities
 */
function createMockModel(config) {
    class MockCapabilities {
        constructor(initialScores) {
            this.scores = new Map();
            const allCapabilities = [
                'code', 'reasoning', 'vision', 'context',
                'analysis', 'interaction', 'specialized'
            ];
            // Initialize all capabilities with zero scores
            allCapabilities.forEach(cap => {
                this.scores.set(cap, {
                    score: 0,
                    confidence: 0.9,
                    lastUpdated: new Date(),
                    sampleSize: 100
                });
            });
            // Set provided scores
            Object.entries(initialScores).forEach(([capability, score]) => {
                this.scores.set(capability, {
                    score,
                    confidence: 0.9,
                    lastUpdated: new Date(),
                    sampleSize: 100
                });
            });
        }
        get(capability) {
            return this.scores.get(capability) || {
                score: 0,
                confidence: 0,
                lastUpdated: new Date(),
                sampleSize: 0
            };
        }
        set(capability, score) {
            this.scores.set(capability, score);
        }
        has(capability) {
            return this.scores.has(capability);
        }
        getAll() {
            return this.scores;
        }
    }
    // Create a deep copy of the config and ensure capabilities are properly typed
    const capabilities = { ...config.capabilities };
    // Ensure reviewer has high enough analysis score
    if (config.id.includes('reviewer')) {
        capabilities.analysis = Math.max(capabilities.analysis || 0, 0.85);
        capabilities.reasoning = Math.max(capabilities.reasoning || 0, 0.8);
    }
    // Ensure executor has high enough score for its primary capability
    if (config.id.includes('executor')) {
        const entries = Object.entries(capabilities);
        const primaryCap = entries.reduce((a, [k, v]) => v > (capabilities[a] || 0) ? k : a, 'reasoning');
        capabilities[primaryCap] = Math.max(capabilities[primaryCap] || 0, 0.85);
    }
    return {
        id: config.id,
        name: config.name,
        capabilities: new MockCapabilities(capabilities),
        contextWindow: config.contextWindow || 16000,
        async process(input) {
            if (config.mockProcess) {
                return config.mockProcess(input);
            }
            return input;
        },
        async testCapability(capability) {
            return this.capabilities.get(capability);
        },
        async getResourceMetrics() {
            return {
                memoryUsage: 100,
                cpuUsage: 0.5,
                averageLatency: 100,
                peakMemoryUsage: 150,
                totalProcessingTime: 500,
                tokensProcessed: 1000
            };
        },
        async getTokenStats() {
            return {
                total: 1000,
                prompt: 400,
                completion: 600,
                rate: 10,
                cached: 0
            };
        }
    };
}
exports.createMockModel = createMockModel;
/**
 * Create a mock model chain for testing
 */
function createMockModelChain(options = {}) {
    return {
        planner: createMockModel({
            id: 'mock-planner',
            name: 'Mock Planner',
            capabilities: options.plannerCapabilities || { reasoning: 0.9, analysis: 0.8 }
        }),
        executor: createMockModel({
            id: 'mock-executor',
            name: 'Mock Executor',
            capabilities: options.executorCapabilities || { code: 0.9, reasoning: 0.7 }
        }),
        ...(options.reviewerCapabilities && {
            reviewer: createMockModel({
                id: 'mock-reviewer',
                name: 'Mock Reviewer',
                capabilities: options.reviewerCapabilities
            })
        }),
        ...(options.contextCapabilities && {
            context: createMockModel({
                id: 'mock-context',
                name: 'Mock Context Manager',
                capabilities: options.contextCapabilities
            })
        })
    };
}
exports.createMockModelChain = createMockModelChain;
/**
 * Create a mock model result
 */
function createMockModelResult(success = true, output = null, phase = 'execution', metrics = {}) {
    return {
        success,
        output,
        phase,
        phases: [{
                name: phase,
                status: success ? 'completed' : 'failed',
                result: {
                    success,
                    output,
                    metrics: {
                        executionTime: metrics.executionTime || 100,
                        memoryUsed: metrics.memoryUsed || 100,
                        tokensUsed: metrics.tokensUsed || 1000,
                        tokensProcessed: metrics.tokensProcessed || 1000
                    }
                }
            }],
        metrics: {
            executionTime: metrics.executionTime || 100,
            memoryUsed: metrics.memoryUsed || 100,
            tokensUsed: metrics.tokensUsed || 1000,
            tokensProcessed: metrics.tokensProcessed || 1000
        }
    };
}
exports.createMockModelResult = createMockModelResult;
/**
 * Create a mock registry
 */
class MockRegistry {
    constructor(initialModels = []) {
        this.models = new Map();
        initialModels.forEach(model => this.models.set(model.id, model));
    }
    async registerModel(model) {
        this.models.set(model.id, model);
    }
    async unregisterModel(modelId) {
        this.models.delete(modelId);
    }
    getModel(modelId) {
        return this.models.get(modelId);
    }
    listModels() {
        return Array.from(this.models.values());
    }
    findModels(criteria) {
        return this.listModels().filter(model => {
            if (criteria.capabilities) {
                return criteria.capabilities.every(cap => model.capabilities.has(cap));
            }
            return true;
        });
    }
    async getModelChain(requirements) {
        return createMockModelChain({
            plannerCapabilities: { reasoning: 0.9 },
            executorCapabilities: { [requirements.primaryCapability]: 0.9 },
            ...(requirements.priority === 'quality' && {
                reviewerCapabilities: { analysis: 0.9 }
            })
        });
    }
}
exports.MockRegistry = MockRegistry;
/**
 * Generate test execution results for performance testing
 */
function generateTestExecutionResults(count) {
    return Array.from({ length: count }, (_, i) => ({
        task: createTestTask(`performance-test-${i}`),
        execution: createMockModelResult(true, { result: `Result ${i}` }, 'execution', {
            executionTime: Math.random() * 1000,
            memoryUsed: Math.random() * 500,
            tokensUsed: Math.floor(Math.random() * 2000)
        })
    }));
}
exports.generateTestExecutionResults = generateTestExecutionResults;
/**
 * Wait for a specified duration (useful for async tests)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
/**
 * Create error simulation function
 */
function createErrorSimulator(errorRate = 0.2, errorMessage = 'Simulated error') {
    return async (input) => {
        if (Math.random() < errorRate) {
            throw new Error(errorMessage);
        }
        return input;
    };
}
exports.createErrorSimulator = createErrorSimulator;
//# sourceMappingURL=test-helpers.js.map