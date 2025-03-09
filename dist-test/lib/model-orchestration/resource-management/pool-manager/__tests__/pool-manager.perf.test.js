"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pool_manager_1 = require("../pool-manager");
const types_1 = require("../../types");
const index_1 = require("../index");
const test_helpers_1 = require("./test-helpers");
// Increase timeout for performance tests
jest.setTimeout(120000);
async function waitForStateChange(ms = 100) {
    // First, allow any pending microtasks to complete
    await Promise.resolve();
    // Advance timers incrementally to avoid long jumps
    const increment = 10;
    for (let elapsed = 0; elapsed < ms; elapsed += increment) {
        jest.advanceTimersByTime(increment);
        // Allow any timer callbacks to execute
        await Promise.resolve();
        await new Promise(resolve => setImmediate(resolve));
    }
    // Final timer advance for any remainder
    const remainder = ms % increment;
    if (remainder > 0) {
        jest.advanceTimersByTime(remainder);
        await Promise.resolve();
        await new Promise(resolve => setImmediate(resolve));
    }
    // Ensure all promises are settled
    await new Promise(resolve => setTimeout(resolve, 0));
}
describe('ResourcePoolManager Performance', () => {
    let poolManager;
    let detector;
    beforeEach(async () => {
        jest.useFakeTimers();
        jest.clearAllTimers();
        jest.clearAllMocks();
        // Create detector with quieter logging
        detector = new test_helpers_1.TestResourceDetector(() => { }, // Skip resource logging
        () => { } // Skip alert logging
        );
        // Create pool manager with faster intervals
        poolManager = new pool_manager_1.ResourcePoolManager(detector, {
            ...index_1.DEFAULT_POOL_CONFIG,
            cleanupIntervalMs: 50,
            resourceTimeoutMs: 25,
            cacheMaxSize: 1000 // Larger cache for performance tests
        });
        // Start monitoring and wait for initial state
        detector.start();
        await waitForStateChange(100);
        // Verify initial state is healthy
        const initialState = poolManager.monitor();
        expect(initialState.health).toBe('healthy');
        expect(initialState.utilization).toBeLessThan(0.7);
    });
    afterEach(async () => {
        // Ensure cleanup completes
        await waitForStateChange(200);
        detector.stop();
        detector.dispose();
        poolManager.dispose();
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.clearAllTimers();
    });
    describe('Performance Targets', () => {
        it('should meet pool allocation time target (<5ms)', async () => {
            const iterations = 1000;
            const monitor = detector.getResourceMonitor();
            // Initial snapshot
            monitor.takeSnapshot(detector.getCurrentResources(), poolManager.monitor().health);
            // Measure allocation times
            const allocations = await Promise.all(Array.from({ length: iterations }, async (_, i) => {
                const start = performance.now();
                const resource = await poolManager.allocate({
                    id: `test-${i}`,
                    type: types_1.ResourceType.Memory,
                    priority: types_1.Priority.Medium,
                    requirements: {
                        memory: 1024,
                        cpu: 5
                    }
                });
                const elapsed = performance.now() - start;
                await poolManager.release(resource);
                return elapsed;
            }));
            // Final snapshot
            monitor.takeSnapshot(detector.getCurrentResources(), poolManager.monitor().health);
            const averageTime = allocations.reduce((a, b) => a + b) / allocations.length;
            const maxTime = Math.max(...allocations);
            const p95Time = allocations.sort((a, b) => a - b)[Math.floor(allocations.length * 0.95)];
            expect(averageTime).toBeLessThan(5); // Target: <5ms
            expect(p95Time).toBeLessThan(8); // 95th percentile should be reasonable
            expect(poolManager.monitor().health).toBe('healthy');
        });
        it('should achieve target cache hit rate (>85%)', async () => {
            const iterations = 1000;
            const uniqueRequests = 100;
            const monitor = detector.getResourceMonitor();
            let cacheHits = 0;
            // Create a pool of requests to cycle through
            const requestPool = Array.from({ length: uniqueRequests }, (_, i) => ({
                id: `test-${i}`,
                type: types_1.ResourceType.Memory,
                priority: types_1.Priority.Medium,
                requirements: {
                    memory: 1024 + (i % 5) * 512,
                    cpu: 5 + (i % 3)
                }
            }));
            // Perform allocations and releases
            for (let i = 0; i < iterations; i++) {
                const request = requestPool[i % uniqueRequests];
                const start = performance.now();
                const resource = await poolManager.allocate(request);
                const time = performance.now() - start;
                if (time < 1) {
                    cacheHits++;
                }
                await poolManager.release(resource);
                if (i % 100 === 0) {
                    await waitForStateChange(10);
                    monitor.takeSnapshot(detector.getCurrentResources(), poolManager.monitor().health);
                }
            }
            const hitRate = (cacheHits / iterations) * 100;
            expect(hitRate).toBeGreaterThan(85);
            expect(poolManager.monitor().health).toBe('healthy');
        });
        it('should handle high concurrency without degradation', async () => {
            const monitor = detector.getResourceMonitor();
            const concurrentOperations = 100;
            const iterations = 10;
            const results = [];
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                // Perform concurrent allocations and releases
                await Promise.all(Array.from({ length: concurrentOperations }, async (_, j) => {
                    const resource = await poolManager.allocate({
                        id: `test-${i}-${j}`,
                        type: types_1.ResourceType.Memory,
                        priority: types_1.Priority.Medium,
                        requirements: {
                            memory: 1024,
                            cpu: 5
                        }
                    });
                    await poolManager.release(resource);
                }));
                results.push(performance.now() - start);
                await waitForStateChange(20);
                monitor.takeSnapshot(detector.getCurrentResources(), poolManager.monitor().health);
            }
            const averageTime = results.reduce((a, b) => a + b) / results.length;
            expect(averageTime).toBeLessThan(100);
            expect(Math.max(...results)).toBeLessThan(200);
            expect(poolManager.monitor().health).toBe('healthy');
        });
    });
});
//# sourceMappingURL=pool-manager.perf.test.js.map