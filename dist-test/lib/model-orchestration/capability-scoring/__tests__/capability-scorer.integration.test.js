"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_orchestrator_1 = require("../../model-orchestrator");
const capability_scorer_1 = require("../capability-scorer");
// Mock implementations
class MockModelCapabilities {
    constructor() {
        this.scores = new Map();
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
        return new Map(this.scores);
    }
}
class MockLLMModel {
    constructor(id, name, contextWindow, supportedCapabilities) {
        this.id = id;
        this.name = name;
        this.contextWindow = contextWindow;
        this.supportedCapabilities = supportedCapabilities;
        this.capabilities = new MockModelCapabilities();
    }
    async process(input) {
        if (this.id === 'code-model' && input.task?.type === 'code-generation') {
            // Simulate failure for primary model in fallback test
            if (input.task.metadata?.requireFallback) {
                return {
                    success: false,
                    output: null,
                    phase: input.type || 'execution',
                    phases: [{
                            name: input.type || 'execution',
                            status: 'failed',
                            result: {
                                success: false,
                                output: null,
                                metrics: {
                                    executionTime: 0,
                                    memoryUsed: 0,
                                    tokensUsed: 0
                                }
                            }
                        }],
                    metrics: {
                        executionTime: 0,
                        memoryUsed: 0,
                        tokensUsed: 0
                    }
                };
            }
        }
        return {
            success: true,
            output: { result: 'mock output' },
            phase: input.type || 'execution',
            phases: [{
                    name: input.type || 'execution',
                    status: 'completed',
                    result: {
                        success: true,
                        output: { result: 'mock output' },
                        metrics: {
                            executionTime: 100,
                            memoryUsed: 100,
                            tokensUsed: 100
                        }
                    }
                }],
            metrics: {
                executionTime: 100,
                memoryUsed: 100,
                tokensUsed: 100
            }
        };
    }
    async testCapability(capability) {
        return {
            score: 0.8,
            confidence: 0.9,
            lastUpdated: new Date(),
            sampleSize: 10
        };
    }
    async getResourceMetrics() {
        return {
            memoryUsage: 100,
            cpuUsage: 0.5,
            averageLatency: 100,
            tokensProcessed: 1000
        };
    }
    async getTokenStats() {
        return {
            total: 1000,
            prompt: 400,
            completion: 600
        };
    }
}
class MockModelRegistry {
    constructor() {
        this.models = new Map();
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
        return this.listModels().filter(model => criteria.capabilities?.every(cap => model.capabilities.has(cap)));
    }
    async getModelChain(requirements) {
        const models = this.listModels();
        const primaryModel = models.find(m => m.id === 'code-model') || models[0];
        const fallbackModel = models.find(m => m.id === 'general-model');
        return {
            planner: primaryModel,
            executor: primaryModel,
            fallback: fallbackModel ? [fallbackModel] : undefined
        };
    }
}
describe('CapabilityScorer Integration', () => {
    let scorer;
    let orchestrator;
    let registry;
    beforeEach(() => {
        scorer = new capability_scorer_1.CapabilityScorer({
            decayFactor: 0.95,
            timeWindow: 7 * 24 * 60 * 60 * 1000,
            minSamples: 5
        });
        registry = new MockModelRegistry();
        // Register test models
        const codeModel = new MockLLMModel('code-model', 'Code Model', 4096, ['code']);
        const generalModel = new MockLLMModel('general-model', 'General Model', 4096, ['code', 'reasoning']);
        registry.registerModel(codeModel);
        registry.registerModel(generalModel);
        orchestrator = new model_orchestrator_1.ModelOrchestrator(registry);
    });
    it('should route tasks based on capability scores', async () => {
        // Train the scorer with historical data
        for (let i = 0; i < 5; i++) {
            await scorer.recordSuccess('code-model', 'code', {
                latency: 100,
                resourceUsage: 0.3
            });
        }
        const task = {
            id: 'test-1',
            type: 'code-generation',
            description: 'Create a React component',
            input: 'Create a button component',
            requirements: {
                primaryCapability: 'code',
                secondaryCapabilities: [],
                minCapabilityScores: new Map([['code', 0.7]]),
                contextSize: 1000,
                priority: 'quality'
            }
        };
        const result = await orchestrator.handleTask(task);
        expect(result.success).toBe(true);
        expect(result.phases[0].name).toBe('planning');
    });
    it('should handle model failures and fallbacks', async () => {
        // Set up primary and fallback models
        for (let i = 0; i < 5; i++) {
            await scorer.recordSuccess('code-model', 'code', {
                latency: 100,
                resourceUsage: 0.3
            });
            await scorer.recordSuccess('general-model', 'code', {
                latency: 150,
                resourceUsage: 0.4
            });
        }
        // Simulate primary model failure
        await scorer.recordFailure('code-model', 'code', {
            latency: 500,
            resourceUsage: 0.8
        });
        const task = {
            id: 'test-2',
            type: 'code-generation',
            description: 'Generate code with fallback',
            input: 'Create a function',
            requirements: {
                primaryCapability: 'code',
                secondaryCapabilities: [],
                minCapabilityScores: new Map([['code', 0.5]]),
                contextSize: 1000,
                priority: 'speed'
            },
            metadata: {
                requireFallback: true // Trigger simulated failure
            }
        };
        const result = await orchestrator.handleTask(task);
        expect(result.success).toBe(true);
        expect(result.usedFallback).toBe(true);
    }, 15000); // Increase timeout to 15 seconds
    it('should handle concurrent model selection', async () => {
        // Set up model capabilities
        for (const modelId of ['code-model', 'general-model']) {
            for (let i = 0; i < 5; i++) {
                await scorer.recordSuccess(modelId, modelId === 'code-model' ? 'code' : 'reasoning', {
                    latency: 100 + Math.random() * 50,
                    resourceUsage: 0.3 + Math.random() * 0.2
                });
            }
        }
        const createTask = (id, capability) => ({
            id,
            type: capability === 'code' ? 'code-generation' : 'reasoning',
            description: `Test task ${id}`,
            input: 'Test input',
            requirements: {
                primaryCapability: capability,
                secondaryCapabilities: [],
                minCapabilityScores: new Map([[capability, 0.5]]),
                contextSize: 1000,
                priority: 'speed'
            }
        });
        const tasks = [
            createTask('concurrent-1', 'code'),
            createTask('concurrent-2', 'reasoning')
        ];
        const results = await Promise.all(tasks.map(task => orchestrator.handleTask(task)));
        expect(results.every(r => r.success)).toBe(true);
        expect(results[0].phases[0].name).toBe('planning');
        expect(results[1].phases[0].name).toBe('planning');
    });
});
//# sourceMappingURL=capability-scorer.integration.test.js.map