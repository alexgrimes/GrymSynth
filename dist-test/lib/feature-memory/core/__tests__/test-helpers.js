"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySystemStability = exports.measureConcurrentOperations = exports.sleep = exports.monitorMemory = exports.createTestPattern = exports.generateLoad = exports.measureOperations = exports.calculateMetrics = exports.warmupSystem = void 0;
async function warmupSystem(operation, iterations = 100) {
    for (let i = 0; i < iterations; i++) {
        await operation();
    }
    // Allow system to stabilize
    await new Promise(resolve => setTimeout(resolve, 100));
}
exports.warmupSystem = warmupSystem;
function calculateMetrics(samples) {
    const sorted = [...samples].sort((a, b) => a - b);
    return {
        average: samples.reduce((a, b) => a + b, 0) / samples.length,
        p95: sorted[Math.floor(sorted.length * 0.95)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        totalSamples: samples.length
    };
}
exports.calculateMetrics = calculateMetrics;
async function measureOperations(operation, count, concurrency = 1) {
    const latencies = [];
    const batchSize = Math.min(count, concurrency);
    const batches = Math.ceil(count / batchSize);
    for (let i = 0; i < batches; i++) {
        const batchOperations = Array.from({ length: batchSize }, async () => {
            const start = performance.now();
            await operation();
            return performance.now() - start;
        });
        const batchLatencies = await Promise.all(batchOperations);
        latencies.push(...batchLatencies);
    }
    return latencies;
}
exports.measureOperations = measureOperations;
async function generateLoad(operation, duration, concurrency) {
    const startTime = Date.now();
    const latencies = [];
    while (Date.now() - startTime < duration) {
        const batchLatencies = await measureOperations(operation, concurrency, concurrency);
        latencies.push(...batchLatencies);
    }
    return calculateMetrics(latencies);
}
exports.generateLoad = generateLoad;
function createTestPattern(id) {
    return {
        id: `test_${id}`,
        features: new Map([
            ['type', 'test'],
            ['category', 'unit_test'],
            ['value', id.toString()]
        ]),
        confidence: 0.9,
        timestamp: new Date(),
        metadata: {
            source: 'test',
            category: 'test',
            frequency: 1,
            lastUpdated: new Date()
        }
    };
}
exports.createTestPattern = createTestPattern;
function monitorMemory() {
    const initial = process.memoryUsage().heapUsed;
    return () => {
        const current = process.memoryUsage().heapUsed;
        return (current - initial) / (1024 * 1024); // Return MB difference
    };
}
exports.monitorMemory = monitorMemory;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
async function measureConcurrentOperations(operations, batchSize) {
    const latencies = [];
    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const startTime = performance.now();
        await Promise.all(batch.map(op => op().catch(error => {
            console.error('Operation failed:', error);
            return null;
        })));
        latencies.push(performance.now() - startTime);
    }
    return calculateMetrics(latencies);
}
exports.measureConcurrentOperations = measureConcurrentOperations;
async function verifySystemStability(operation, duration, samplingInterval = 1000) {
    const startTime = Date.now();
    const measurements = [];
    while (Date.now() - startTime < duration) {
        const metrics = await generateLoad(operation, samplingInterval, 10);
        measurements.push(metrics);
        await sleep(100); // Prevent overwhelming the system
    }
    // Check for stability
    const averages = measurements.map(m => m.average);
    const variance = calculateVariance(averages);
    return variance < 0.25; // Less than 25% variance considered stable
}
exports.verifySystemStability = verifySystemStability;
function calculateVariance(samples) {
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const squareDiffs = samples.map(x => (x - mean) ** 2);
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff) / mean; // Coefficient of variation
}
//# sourceMappingURL=test-helpers.js.map