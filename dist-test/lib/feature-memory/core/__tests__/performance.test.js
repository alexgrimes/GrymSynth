"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feature_memory_system_1 = require("../feature-memory-system");
const perf_helpers_1 = require("./perf-helpers");
describe('Feature Memory System Performance', () => {
    let system;
    const testPattern = (0, perf_helpers_1.createTestPattern)(1);
    beforeEach(async () => {
        system = new feature_memory_system_1.FeatureMemorySystem({
            cacheSize: 1000,
            maxPatterns: 10000,
            persistenceEnabled: false
        });
        // Warm up the system
        await (0, perf_helpers_1.warmupSystem)(system);
    });
    afterEach(async () => {
        await system.destroy();
    });
    describe('Pattern Recognition Performance', () => {
        it('should meet latency targets for pattern recognition', async () => {
            const results = await (0, perf_helpers_1.runPerformanceTest)({
                operation: () => system.recognizePattern(testPattern.features),
                samples: 1000,
                targetAvg: 50,
                targetP95: 100 // 100ms P95 target
            });
            console.log('\nPattern Recognition Performance:');
            console.log((0, perf_helpers_1.formatResults)(results));
            (0, perf_helpers_1.verifyResults)(results, { targetAvg: 50, targetP95: 100 }, expect);
        });
        it('should maintain performance under sustained load', async () => {
            const results = await (0, perf_helpers_1.runPerformanceTest)({
                operation: () => system.recognizePattern(testPattern.features),
                samples: 5000,
                targetAvg: 50,
                targetP95: 100
            });
            console.log('\nSustained Recognition Performance:');
            console.log((0, perf_helpers_1.formatResults)(results));
            (0, perf_helpers_1.verifyResults)(results, { targetAvg: 50, targetP95: 100 }, expect);
        });
    });
    describe('Pattern Storage Performance', () => {
        it('should meet latency targets for pattern storage', async () => {
            const results = await (0, perf_helpers_1.runPerformanceTest)({
                operation: () => system.storePattern({ ...testPattern, id: `test_${Date.now()}` }),
                samples: 1000,
                targetAvg: 20,
                targetP95: 50 // 50ms P95 target
            });
            console.log('\nPattern Storage Performance:');
            console.log((0, perf_helpers_1.formatResults)(results));
            (0, perf_helpers_1.verifyResults)(results, { targetAvg: 20, targetP95: 50 }, expect);
        });
        it('should handle bulk storage operations efficiently', async () => {
            const results = await (0, perf_helpers_1.runConcurrentTest)({
                operation: () => system.storePattern({ ...testPattern, id: `test_${Date.now()}` }),
                concurrentOps: 100,
                targetAvg: 30 // 30ms average per operation under load
            });
            console.log('\nBulk Storage Performance:');
            console.log((0, perf_helpers_1.formatResults)(results));
            expect(results.avgLatency).toBeLessThan(30);
            expect(results.failureRate).toBeLessThan(0.01);
        });
    });
    describe('Memory Management', () => {
        it('should maintain stable memory usage under load', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            const results = await (0, perf_helpers_1.runPerformanceTest)({
                operation: () => system.storePattern({ ...testPattern, id: `test_${Date.now()}` }),
                samples: 10000,
                targetAvg: 30,
                targetP95: 100
            });
            const memoryGrowthMB = results.memoryDelta;
            console.log('\nMemory Usage:');
            console.log(`Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
            console.log(`Memory Growth: ${memoryGrowthMB.toFixed(2)}MB`);
            expect(memoryGrowthMB).toBeLessThan(200); // Less than 200MB growth
        });
        it('should properly handle cache eviction', async () => {
            const pattern = (0, perf_helpers_1.createTestPattern)(1);
            // Fill beyond cache capacity
            for (let i = 0; i < 2000; i++) {
                await system.storePattern({ ...pattern, id: `test_${i}` });
            }
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            const results = await (0, perf_helpers_1.runPerformanceTest)({
                operation: () => system.storePattern({ ...pattern, id: `test_${Date.now()}` }),
                samples: 100,
                targetAvg: 30,
                targetP95: 100
            });
            console.log('\nPost-Eviction Performance:');
            console.log((0, perf_helpers_1.formatResults)(results));
            expect(results.avgLatency).toBeLessThan(30);
            expect(results.memoryDelta).toBeLessThan(50); // Memory should be stable
        });
    });
    describe('System Stability', () => {
        it('should maintain performance during extended operation', async () => {
            const iterations = 5;
            const results = [];
            for (let i = 0; i < iterations; i++) {
                const result = await (0, perf_helpers_1.runPerformanceTest)({
                    operation: () => system.storePattern({ ...testPattern, id: `test_${Date.now()}` }),
                    samples: 1000,
                    targetAvg: 30,
                    targetP95: 100
                });
                results.push(result);
                await new Promise(resolve => setTimeout(resolve, 100)); // Cool down
            }
            console.log('\nStability Test Results:');
            results.forEach((result, i) => {
                console.log(`\nIteration ${i + 1}:`);
                console.log((0, perf_helpers_1.formatResults)(result));
            });
            // Verify performance remains stable
            const avgLatencies = results.map(r => r.avgLatency);
            const variance = Math.max(...avgLatencies) - Math.min(...avgLatencies);
            expect(variance).toBeLessThan(15); // Less than 15ms variance
            expect(Math.max(...results.map(r => r.failureRate))).toBeLessThan(0.01);
        });
    });
});
//# sourceMappingURL=performance.test.js.map