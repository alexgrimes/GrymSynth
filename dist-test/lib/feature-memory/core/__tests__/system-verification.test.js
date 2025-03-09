"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_collector_1 = require("../metrics-collector");
const pattern_recognizer_1 = require("../pattern-recognizer");
const pattern_storage_1 = require("../pattern-storage");
const health_monitor_1 = require("../health-monitor");
const test_helpers_1 = require("./test-helpers");
describe('System Verification Tests', () => {
    let metrics;
    let recognizer;
    let storage;
    let healthMonitor;
    beforeEach(async () => {
        metrics = new metrics_collector_1.MetricsCollector();
        recognizer = new pattern_recognizer_1.PatternRecognizer({
            cacheSize: 1000,
            threshold: 0.8,
            maxPatterns: 10000
        });
        storage = new pattern_storage_1.PatternStorage({
            cacheSizeLimit: 1000,
            persistenceEnabled: false
        });
        healthMonitor = new health_monitor_1.HealthMonitor(metrics);
        // Warm up the system
        await (0, test_helpers_1.warmupSystem)(async () => {
            const pattern = (0, test_helpers_1.createTestPattern)(0);
            const [_, __] = await Promise.all([
                storage.store(pattern),
                recognizer.recognizePatterns(pattern.features)
            ]);
        });
    });
    describe('Core Performance Verification', () => {
        it('should verify pattern recognition latency requirements', async () => {
            const pattern = (0, test_helpers_1.createTestPattern)(1);
            const latencies = await (0, test_helpers_1.measureOperations)(async () => {
                const result = await recognizer.recognizePatterns(pattern.features);
                return result;
            }, 1000);
            const metrics = calculateLatencyMetrics(latencies);
            expect(metrics.average).toBeLessThan(50);
            expect(metrics.p95).toBeLessThan(100);
            console.log('Recognition Metrics:', metrics);
        });
        it('should verify pattern storage latency requirements', async () => {
            const latencies = await (0, test_helpers_1.measureOperations)(async () => {
                const result = await storage.store((0, test_helpers_1.createTestPattern)(Date.now()));
                return result;
            }, 1000);
            const metrics = calculateLatencyMetrics(latencies);
            expect(metrics.average).toBeLessThan(20);
            expect(metrics.p95).toBeLessThan(50);
            console.log('Storage Metrics:', metrics);
        });
    });
    describe('Concurrent Operation Verification', () => {
        it('should maintain performance under concurrent load', async () => {
            const concurrentOperations = 100;
            const pattern = (0, test_helpers_1.createTestPattern)(1);
            const metrics = await (0, test_helpers_1.measureConcurrentOperations)([
                async () => storage.store(pattern),
                async () => recognizer.recognizePatterns(pattern.features)
            ], 50);
            expect(metrics.average).toBeLessThan(30);
            expect(metrics.p95).toBeLessThan(100);
            console.log('Concurrent Operation Metrics:', metrics);
        });
        it('should verify system stability under sustained load', async () => {
            const pattern = (0, test_helpers_1.createTestPattern)(1);
            const isStable = await (0, test_helpers_1.verifySystemStability)(async () => {
                const result = await storage.store(pattern);
                return result;
            }, 5000, // 5 second test
            1000 // 1 second sampling
            );
            expect(isStable).toBe(true);
            expect(healthMonitor.checkHealth().status).toBe('healthy');
        });
    });
    describe('Memory Management Verification', () => {
        it('should verify memory usage under load', async () => {
            const getMemoryUsage = (0, test_helpers_1.monitorMemory)();
            const pattern = (0, test_helpers_1.createTestPattern)(1);
            // Generate significant load
            await (0, test_helpers_1.generateLoad)(async () => {
                const result = await storage.store(pattern);
                return result;
            }, 5000, // 5 second test
            50 // 50 concurrent operations
            );
            const memoryIncreaseMB = getMemoryUsage();
            expect(memoryIncreaseMB).toBeLessThan(200); // Less than 200MB increase
            console.log('Memory Increase (MB):', memoryIncreaseMB);
        });
        it('should verify cache eviction effectiveness', async () => {
            const pattern = (0, test_helpers_1.createTestPattern)(1);
            const initialMemory = process.memoryUsage().heapUsed;
            // Fill cache beyond capacity
            for (let i = 0; i < 2000; i++) {
                await storage.store({ ...pattern, id: `test_${i}` });
            }
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            const memoryIncreaseMB = (process.memoryUsage().heapUsed - initialMemory) / (1024 * 1024);
            expect(memoryIncreaseMB).toBeLessThan(300); // Less than 300MB even with full cache
        });
    });
    describe('Error Recovery Verification', () => {
        it('should verify performance during error recovery', async () => {
            // Generate errors
            const invalidPattern = { ...(0, test_helpers_1.createTestPattern)(1), confidence: 2 };
            await Promise.all(Array.from({ length: 50 }, () => storage.store(invalidPattern).catch(() => { })));
            // Measure performance during recovery
            const latencies = await (0, test_helpers_1.measureOperations)(async () => {
                const result = await storage.store((0, test_helpers_1.createTestPattern)(Date.now()));
                return result;
            }, 100);
            const metrics = calculateLatencyMetrics(latencies);
            expect(metrics.average).toBeLessThan(30); // Slightly higher latency allowed during recovery
            expect(healthMonitor.checkHealth().status).not.toBe('unhealthy');
            console.log('Recovery Metrics:', metrics);
        });
    });
    describe('System Integration Verification', () => {
        it('should verify all components working together', async () => {
            const pattern = (0, test_helpers_1.createTestPattern)(1);
            const metrics = await (0, test_helpers_1.generateLoad)(async () => {
                const [storeResult, recognizeResult, searchResult] = await Promise.all([
                    storage.store(pattern),
                    recognizer.recognizePatterns(pattern.features),
                    storage.search({ metadata: { category: 'test' } })
                ]);
                return { storeResult, recognizeResult, searchResult };
            }, 5000, // 5 second test
            20 // 20 concurrent operations
            );
            expect(metrics.average).toBeLessThan(50);
            expect(metrics.p95).toBeLessThan(100);
            expect(healthMonitor.checkHealth().status).toBe('healthy');
            console.log('Integration Test Metrics:', metrics);
        });
    });
});
function calculateLatencyMetrics(samples) {
    const sorted = [...samples].sort((a, b) => a - b);
    return {
        average: samples.reduce((a, b) => a + b) / samples.length,
        p95: sorted[Math.floor(sorted.length * 0.95)],
        min: Math.min(...samples),
        max: Math.max(...samples),
        totalSamples: samples.length
    };
}
//# sourceMappingURL=system-verification.test.js.map