"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_manager_1 = require("./resource-manager");
const test_helpers_1 = require("./test-helpers");
const types_1 = require("./types");
describe('ResourceManager Error Recovery', () => {
    let resourceManager;
    beforeEach(() => {
        resourceManager = new resource_manager_1.ResourceManager(test_helpers_1.DEFAULT_TEST_CONFIG);
    });
    afterEach(() => {
        resourceManager.destroy();
        jest.restoreAllMocks();
    });
    describe('Model Loading Errors', () => {
        it('should handle model load failures gracefully', async () => {
            // Mock a failed model load
            jest.spyOn(resourceManager, 'performModelLoad')
                .mockRejectedValue(new Error('Model load failed'));
            const errorEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'error') {
                    errorEvents.push(data);
                }
            });
            await expect(resourceManager.loadModel('test-model'))
                .rejects
                .toThrow('MODEL_LOAD_FAILED');
            expect(errorEvents.length).toBe(1);
            expect(errorEvents[0].code).toBe('MODEL_LOAD_FAILED');
            expect(errorEvents[0].recoverable).toBe(true);
        });
        it('should retry model loading with backoff', async () => {
            const loadAttempts = [];
            jest.spyOn(resourceManager, 'performModelLoad')
                .mockImplementation(async () => {
                loadAttempts.push(Date.now());
                if (loadAttempts.length < 3) {
                    throw new Error('Temporary failure');
                }
                return (0, test_helpers_1.createMockModelMetrics)('test-model');
            });
            await resourceManager.loadModel('test-model');
            expect(loadAttempts.length).toBe(3);
            // Verify exponential backoff
            const delays = loadAttempts.slice(1).map((time, i) => time - loadAttempts[i]);
            expect(delays[1]).toBeGreaterThan(delays[0]);
        });
    });
    describe('Memory Optimization Errors', () => {
        it('should handle compression failures', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            // Mock compression failure
            jest.spyOn(resourceManager, 'compressMemory')
                .mockRejectedValue(new Error('Compression failed'));
            const errorEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'error') {
                    errorEvents.push(data);
                }
            });
            await expect(resourceManager.optimizeMemory(modelId))
                .rejects
                .toThrow('MEMORY_OPTIMIZATION_FAILED');
            expect(errorEvents.length).toBe(1);
            expect(errorEvents[0].code).toBe('MEMORY_OPTIMIZATION_FAILED');
        });
        it('should fallback to alternative optimization strategies', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            // Mock primary strategy failure
            jest.spyOn(resourceManager, 'compressContextWindow')
                .mockRejectedValue(new Error('Primary strategy failed'));
            const optimizationEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'memoryOptimized') {
                    optimizationEvents.push(data);
                }
            });
            await resourceManager.optimizeMemory(modelId);
            expect(optimizationEvents.length).toBeGreaterThan(0);
            expect(optimizationEvents[0].strategy).not.toBe('compress');
        });
    });
    describe('Resource Limit Errors', () => {
        it('should handle resource exhaustion gracefully', async () => {
            // Get max models limit from config or use default
            const maxModels = test_helpers_1.DEFAULT_TEST_CONFIG.limits?.maxModelsLoaded ?? 2;
            // Load models until we hit the limit
            const modelIds = Array.from({ length: maxModels + 1 }, (_, i) => `test-model-${i + 1}`);
            const loadResults = await Promise.allSettled(modelIds.map(id => resourceManager.loadModel(id)));
            const failures = loadResults.filter(result => result.status === 'rejected');
            expect(failures.length).toBe(1);
            expect(failures[0].reason)
                .toBeInstanceOf(types_1.ResourceError);
        });
        it('should recover from memory pressure', async () => {
            // Load multiple models
            const modelIds = ['test-model-1', 'test-model-2'];
            await Promise.all(modelIds.map(id => resourceManager.loadModel(id)));
            // Simulate extreme memory pressure
            const metrics = await resourceManager.getResourceMetrics();
            Object.assign(metrics.system, (0, test_helpers_1.simulateMemoryPressure)(metrics.system, 0.95));
            const recoveryEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'resourcesFreed') {
                    recoveryEvents.push(data);
                }
            });
            // Trigger recovery by loading another model
            await resourceManager.loadModel('test-model-3');
            expect(recoveryEvents.length).toBeGreaterThan(0);
            expect(metrics.system.memoryPressure).toBeLessThan(0.95);
        });
    });
    describe('System-Level Errors', () => {
        it('should handle system metric collection failures', async () => {
            // Mock system metrics failure
            jest.spyOn(resourceManager, 'updateSystemMetrics')
                .mockRejectedValue(new Error('Metrics collection failed'));
            const errorEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'error') {
                    errorEvents.push(data);
                }
            });
            // Wait for monitoring interval
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(errorEvents.length).toBeGreaterThan(0);
            expect(errorEvents[0].code).toBe('SYSTEM_ERROR');
            expect(errorEvents[0].recoverable).toBe(true);
        });
        it('should maintain operation during partial failures', async () => {
            // Mock GPU detection failure
            jest.spyOn(resourceManager, 'detectGPUMemory')
                .mockImplementation(() => {
                throw new Error('GPU detection failed');
            });
            // System should still function
            await expect(resourceManager.loadModel('test-model'))
                .resolves
                .toBe(true);
            const metrics = await resourceManager.getResourceMetrics();
            expect(metrics.system.gpuMemory).toBeUndefined();
            expect(metrics.system.totalMemory).toBeGreaterThan(0);
        });
    });
    describe('Recovery Strategies', () => {
        it('should implement circuit breaker for repeated failures', async () => {
            let failureCount = 0;
            jest.spyOn(resourceManager, 'performModelLoad')
                .mockImplementation(async () => {
                failureCount++;
                throw new Error('Persistent failure');
            });
            const maxAttempts = 5;
            for (let i = 0; i < maxAttempts; i++) {
                try {
                    await resourceManager.loadModel('test-model');
                }
                catch (error) {
                    // Expected failures
                }
            }
            // Circuit breaker should prevent additional attempts
            expect(failureCount).toBeLessThan(maxAttempts);
        });
        it('should cleanup resources after unrecoverable errors', async () => {
            const modelId = 'test-model';
            await resourceManager.loadModel(modelId);
            // Simulate unrecoverable error
            jest.spyOn(resourceManager, 'updateModelMetrics')
                .mockRejectedValue(new Error('Unrecoverable error'));
            const cleanupEvents = [];
            resourceManager.addEventListener((type, data) => {
                if (type === 'modelUnloaded') {
                    cleanupEvents.push(data);
                }
            });
            try {
                await resourceManager.optimizeMemory(modelId);
            }
            catch (error) {
                // Expected error
            }
            expect(cleanupEvents.length).toBe(1);
            expect(cleanupEvents[0].modelId).toBe(modelId);
            expect(cleanupEvents[0].reason).toBe('error_cleanup');
        });
    });
});
//# sourceMappingURL=test-error-recovery.js.map