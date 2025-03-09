"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_manager_1 = require("./resource-manager");
const test_helpers_1 = require("./test-helpers");
// Type guard functions
function isMemoryOptimizedEvent(type, data) {
    return type === 'memoryOptimized';
}
function isModelLoadedEvent(type, data) {
    return type === 'modelLoaded';
}
function isErrorEvent(type, data) {
    return type === 'error';
}
function isMetricsUpdatedEvent(type, data) {
    return type === 'metricsUpdated';
}
describe('ResourceManager Disk Cache', () => {
    let resourceManager;
    beforeEach(() => {
        resourceManager = new resource_manager_1.ResourceManager(test_helpers_1.DEFAULT_TEST_CONFIG);
    });
    afterEach(() => {
        resourceManager.destroy();
    });
    describe('Cache Operations', () => {
        it('should move data to disk cache under memory pressure', async () => {
            // Load multiple models
            const modelIds = ['test-model-1', 'test-model-2', 'test-model-3'];
            await Promise.all(modelIds.map(id => resourceManager.loadModel(id)));
            // Track cache events
            const cacheEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (isMemoryOptimizedEvent(type, data) && data.strategy === 'cache') {
                    cacheEvents.push(data);
                }
            });
            // Simulate high memory pressure
            const metrics = await resourceManager.getResourceMetrics();
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.95));
            // Try to load another model to trigger caching
            await resourceManager.loadModel('test-model-4');
            expect(cacheEvents.length).toBeGreaterThan(0);
            expect(cacheEvents[0].savedMemory).toBeGreaterThan(0);
        });
        it('should prioritize caching based on model priority', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            const cacheOptions = {
                priority: 'low',
                ttl: 3600000 // 1 hour
            };
            // Track cache operations
            const cacheEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (isMemoryOptimizedEvent(type, data) && data.strategy === 'cache') {
                    cacheEvents.push(data);
                }
            });
            // Simulate memory pressure and trigger cache
            const metrics = await resourceManager.getResourceMetrics();
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.9));
            await resourceManager.optimizeMemory(modelId);
            expect(cacheEvents.length).toBe(1);
            expect(cacheEvents[0].modelId).toBe(modelId);
            expect(cacheEvents[0].priority).toBe('low');
        });
        it('should handle cache expiration', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            const shortTTL = 100; // 100ms TTL for testing
            const cacheOptions = {
                priority: 'low',
                ttl: shortTTL
            };
            // Cache the model data
            const metrics = await resourceManager.getResourceMetrics();
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.9));
            await resourceManager.optimizeMemory(modelId);
            // Wait for TTL to expire
            await new Promise(resolve => setTimeout(resolve, shortTTL + 50));
            // Track reload events
            const reloadEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (isModelLoadedEvent(type, data)) {
                    reloadEvents.push(data);
                }
            });
            // Try to access the model
            await resourceManager.loadModel(modelId);
            expect(reloadEvents.length).toBe(1);
            expect(reloadEvents[0].modelId).toBe(modelId);
            expect(reloadEvents[0].fromCache).toBe(false);
        });
        it('should restore cached data when needed', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            // Cache the model
            const metrics = await resourceManager.getResourceMetrics();
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.9));
            await resourceManager.optimizeMemory(modelId);
            // Track restore events
            const restoreEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (isModelLoadedEvent(type, data) && data.fromCache) {
                    restoreEvents.push(data);
                }
            });
            // Simulate memory pressure reduction
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.5));
            // Try to access the cached model
            await resourceManager.loadModel(modelId);
            expect(restoreEvents.length).toBe(1);
            expect(restoreEvents[0].modelId).toBe(modelId);
            expect(restoreEvents[0].fromCache).toBe(true);
        });
        it('should handle cache corruption gracefully', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            // Mock cache corruption
            jest.spyOn(resourceManager, 'restoreFromCache')
                .mockRejectedValue(new Error('Cache corrupted'));
            // Cache the model
            const metrics = await resourceManager.getResourceMetrics();
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.9));
            await resourceManager.optimizeMemory(modelId);
            // Track error events
            const errorEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (isErrorEvent(type, data)) {
                    errorEvents.push(data);
                }
            });
            // Try to restore corrupted cache
            await resourceManager.loadModel(modelId);
            expect(errorEvents.length).toBe(1);
            expect(errorEvents[0].type).toBe('error');
            expect(errorEvents[0].code).toBe('CACHE_OPERATION_FAILED');
            expect(errorEvents[0].recoverable).toBe(false);
            expect(errorEvents[0].modelId).toBe(modelId);
        });
    });
    describe('Cache Performance', () => {
        it('should measure cache operation performance', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            // Track performance metrics
            const performanceMetrics = [];
            resourceManager.addEventListener((type, data) => {
                if (isMetricsUpdatedEvent(type, data)) {
                    performanceMetrics.push(data);
                }
            });
            // Perform cache operations
            const metrics = await resourceManager.getResourceMetrics();
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.9));
            const startTime = Date.now();
            await resourceManager.optimizeMemory(modelId);
            const endTime = Date.now();
            expect(performanceMetrics.length).toBeGreaterThan(0);
            const lastMetrics = performanceMetrics[performanceMetrics.length - 1];
            expect(lastMetrics.cacheOperations).toBeDefined();
            expect(lastMetrics.cacheOperations?.duration).toBeLessThan(endTime - startTime);
        });
    });
});
//# sourceMappingURL=test-disk-cache.js.map