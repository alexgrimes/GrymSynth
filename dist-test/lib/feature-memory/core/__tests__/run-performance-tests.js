"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPerformanceTest = void 0;
const feature_memory_system_1 = require("../feature-memory-system");
const test_helpers_1 = require("./test-helpers");
const fs_1 = require("fs");
const path_1 = require("path");
async function runPerformanceTest() {
    const results = [];
    const system = new feature_memory_system_1.FeatureMemorySystem({
        cacheSize: 1000,
        maxPatterns: 10000,
        persistenceEnabled: false
    });
    try {
        // Warm up
        console.log('Warming up system...');
        const warmupPattern = (0, test_helpers_1.createTestPattern)(0);
        for (let i = 0; i < 100; i++) {
            await system.storePattern({ ...warmupPattern, id: `warmup_${i}` });
        }
        // Test 1: Pattern Recognition Performance
        console.log('\nTesting Pattern Recognition Performance...');
        const recognitionLatencies = [];
        const testPattern = (0, test_helpers_1.createTestPattern)(1);
        const startMemory = process.memoryUsage().heapUsed;
        for (let i = 0; i < 1000; i++) {
            const start = performance.now();
            await system.recognizePattern(testPattern.features);
            recognitionLatencies.push(performance.now() - start);
        }
        results.push({
            name: 'Pattern Recognition',
            metrics: {
                averageLatency: recognitionLatencies.reduce((a, b) => a + b) / recognitionLatencies.length,
                p95Latency: recognitionLatencies.sort((a, b) => a - b)[Math.floor(recognitionLatencies.length * 0.95)],
                operationsPerSecond: 1000 / (recognitionLatencies.reduce((a, b) => a + b) / recognitionLatencies.length / 1000),
                errorRate: 0,
                memoryUsageMB: (process.memoryUsage().heapUsed - startMemory) / (1024 * 1024)
            },
            success: true,
            timestamp: new Date().toISOString()
        });
        // Test 2: Storage Performance
        console.log('\nTesting Storage Performance...');
        const storageLatencies = [];
        const storageErrors = [];
        const storageStartMemory = process.memoryUsage().heapUsed;
        for (let i = 0; i < 1000; i++) {
            try {
                const start = performance.now();
                await system.storePattern({ ...testPattern, id: `test_${i}` });
                storageLatencies.push(performance.now() - start);
            }
            catch (error) {
                storageErrors.push(error);
            }
        }
        results.push({
            name: 'Pattern Storage',
            metrics: {
                averageLatency: storageLatencies.reduce((a, b) => a + b) / storageLatencies.length,
                p95Latency: storageLatencies.sort((a, b) => a - b)[Math.floor(storageLatencies.length * 0.95)],
                operationsPerSecond: 1000 / (storageLatencies.reduce((a, b) => a + b) / storageLatencies.length / 1000),
                errorRate: storageErrors.length / 1000,
                memoryUsageMB: (process.memoryUsage().heapUsed - storageStartMemory) / (1024 * 1024)
            },
            success: true,
            timestamp: new Date().toISOString()
        });
        // Test 3: Concurrent Operations
        console.log('\nTesting Concurrent Operations...');
        const concurrentStartTime = performance.now();
        const concurrentStartMemory = process.memoryUsage().heapUsed;
        const concurrentErrors = [];
        const concurrentOps = Array.from({ length: 100 }, (_, i) => ({
            store: system.storePattern({ ...testPattern, id: `concurrent_${i}` }),
            recognize: system.recognizePattern(testPattern.features)
        }));
        try {
            await Promise.all(concurrentOps.flatMap(ops => [ops.store, ops.recognize]));
        }
        catch (error) {
            concurrentErrors.push(error);
        }
        results.push({
            name: 'Concurrent Operations',
            metrics: {
                averageLatency: (performance.now() - concurrentStartTime) / 200,
                p95Latency: 0,
                operationsPerSecond: 200000 / (performance.now() - concurrentStartTime),
                errorRate: concurrentErrors.length / 200,
                memoryUsageMB: (process.memoryUsage().heapUsed - concurrentStartMemory) / (1024 * 1024)
            },
            success: true,
            timestamp: new Date().toISOString()
        });
        // Save results
        const resultPath = (0, path_1.join)(__dirname, 'performance-results.json');
        (0, fs_1.writeFileSync)(resultPath, JSON.stringify(results, null, 2));
        console.log(`\nResults saved to ${resultPath}`);
        return results;
    }
    finally {
        await system.destroy();
    }
}
exports.runPerformanceTest = runPerformanceTest;
// Run tests if executed directly
if (require.main === module) {
    console.log('Starting Performance Tests...\n');
    runPerformanceTest()
        .then(results => {
        console.log('\nPerformance Test Results:');
        results.forEach(result => {
            console.log(`\n${result.name}:`);
            console.log(`  Average Latency: ${result.metrics.averageLatency.toFixed(2)}ms`);
            console.log(`  P95 Latency: ${result.metrics.p95Latency.toFixed(2)}ms`);
            console.log(`  Operations/sec: ${result.metrics.operationsPerSecond.toFixed(2)}`);
            console.log(`  Error Rate: ${(result.metrics.errorRate * 100).toFixed(2)}%`);
            console.log(`  Memory Usage: ${result.metrics.memoryUsageMB.toFixed(2)}MB`);
        });
    })
        .catch(error => {
        console.error('Performance test failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=run-performance-tests.js.map