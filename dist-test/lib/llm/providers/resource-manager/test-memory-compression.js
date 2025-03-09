"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_manager_1 = require("./resource-manager");
const test_helpers_1 = require("./test-helpers");
describe('ResourceManager Memory Compression', () => {
    let resourceManager;
    beforeEach(() => {
        resourceManager = new resource_manager_1.ResourceManager(test_helpers_1.DEFAULT_TEST_CONFIG);
    });
    afterEach(async () => {
        // Clean up any loaded models
        const metrics = await resourceManager.getResourceMetrics();
        await Promise.all(Array.from(metrics.models.keys()).map(id => resourceManager.unloadModel(id)));
        resourceManager.destroy();
    });
    describe('Context Window Compression', () => {
        it('should compress context when threshold is exceeded', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            const options = {
                strategy: 'summarize',
                threshold: 0.8
            };
            // Track optimization events
            const optimizationEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'memoryOptimized') {
                    optimizationEvents.push(data);
                }
            });
            // Simulate high context usage
            const metrics = await resourceManager.getResourceMetrics();
            const model = metrics.models.get(modelId);
            if (model) {
                const maxContext = test_helpers_1.DEFAULT_TEST_BUFFER_CONFIG.context.max;
                const updatedMetrics = (0, test_helpers_1.simulateHighContextUsage)(model, 0.9, maxContext);
                metrics.models.set(modelId, updatedMetrics);
            }
            await resourceManager.optimizeMemory(modelId, options);
            expect(optimizationEvents.length).toBe(1);
            const event = optimizationEvents[0];
            expect(event.modelId).toBe(modelId);
            expect(event.strategy).toBe(options.strategy);
            expect(event.savedMemory).toBeGreaterThan(0);
            expect(event.type).toBe('memoryOptimized');
        });
        it('should handle multiple compression strategies', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            const strategies = [
                'summarize',
                'prune',
                'selective'
            ];
            const optimizationResults = await Promise.all(strategies.map(async (strategy) => {
                const options = {
                    strategy,
                    threshold: 0.8
                };
                const metrics = await resourceManager.getResourceMetrics();
                const model = metrics.models.get(modelId);
                if (model) {
                    const maxContext = test_helpers_1.DEFAULT_TEST_BUFFER_CONFIG.context.max;
                    const updatedMetrics = (0, test_helpers_1.simulateHighContextUsage)(model, 0.9, maxContext);
                    metrics.models.set(modelId, updatedMetrics);
                }
                await resourceManager.optimizeMemory(modelId, options);
                return resourceManager.getResourceMetrics();
            }));
            optimizationResults.forEach((result, index) => {
                const model = result.models.get(modelId);
                expect(model).toBeDefined();
                if (model) {
                    expect(model.buffers.context).toBeLessThan(test_helpers_1.DEFAULT_TEST_BUFFER_CONFIG.context.max * 0.9);
                }
            });
        });
    });
    describe('Working Memory Optimization', () => {
        it('should optimize working memory under pressure', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            // Track optimization events
            const optimizationEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'memoryOptimized') {
                    optimizationEvents.push(data);
                }
            });
            // Simulate high working memory usage
            const metrics = await resourceManager.getResourceMetrics();
            const model = metrics.models.get(modelId);
            if (model) {
                const maxWorking = test_helpers_1.DEFAULT_TEST_BUFFER_CONFIG.working.max;
                const updatedMetrics = (0, test_helpers_1.simulateHighWorkingMemory)(model, 0.95, maxWorking);
                metrics.models.set(modelId, updatedMetrics);
            }
            await resourceManager.optimizeMemory(modelId);
            expect(optimizationEvents.length).toBe(1);
            expect(optimizationEvents[0].modelId).toBe(modelId);
            expect(optimizationEvents[0].savedMemory).toBeGreaterThan(0);
            const updatedMetrics = await resourceManager.getResourceMetrics();
            const updatedModel = updatedMetrics.models.get(modelId);
            expect(updatedModel).toBeDefined();
            if (updatedModel) {
                expect(updatedModel.buffers.working).toBeLessThan(test_helpers_1.DEFAULT_TEST_BUFFER_CONFIG.working.max * 0.95);
            }
        });
    });
    describe('Memory Pressure Handling', () => {
        it('should handle critical memory pressure', async () => {
            // Load multiple models
            const modelIds = ['test-model-1', 'test-model-2'];
            await Promise.all(modelIds.map(id => resourceManager.loadModel(id)));
            // Track events
            const events = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'memoryOptimized' || type === 'modelUnloaded') {
                    events.push({
                        type,
                        data: data
                    });
                }
            });
            // Simulate critical memory pressure
            const metrics = await resourceManager.getResourceMetrics();
            const pressuredMetrics = (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.95);
            Object.assign(metrics.system, pressuredMetrics);
            // Try to load another model
            await resourceManager.loadModel('test-model-3');
            // Verify compression and unloading occurred
            const compressionEvents = events.filter(e => e.type === 'memoryOptimized');
            const unloadEvents = events.filter(e => e.type === 'modelUnloaded');
            expect(compressionEvents.length).toBeGreaterThan(0);
            expect(unloadEvents.length).toBeGreaterThan(0);
            const finalMetrics = await resourceManager.getResourceMetrics();
            expect(finalMetrics.system.memoryPressure).toBeLessThan(0.95);
        });
        it('should prioritize model unloading based on usage', async () => {
            // Load multiple models with different last used times
            const modelIds = ['test-model-1', 'test-model-2'];
            await Promise.all(modelIds.map(id => resourceManager.loadModel(id)));
            const metrics = await resourceManager.getResourceMetrics();
            // Set different last used times
            const now = Date.now();
            const model1 = metrics.models.get('test-model-1');
            const model2 = metrics.models.get('test-model-2');
            if (model1 && model2) {
                model1.lastUsed = now - 60000; // 1 minute ago
                model2.lastUsed = now - 300000; // 5 minutes ago
            }
            // Track unload events
            const unloadedModels = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'modelUnloaded') {
                    unloadedModels.push(data.modelId);
                }
            });
            // Simulate memory pressure and load new model
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.95));
            await resourceManager.loadModel('test-model-3');
            // Verify least recently used model was unloaded first
            expect(unloadedModels[0]).toBe('test-model-2');
        });
    });
});
//# sourceMappingURL=test-memory-compression.js.map