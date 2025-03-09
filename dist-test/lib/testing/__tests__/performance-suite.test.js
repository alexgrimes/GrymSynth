"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const performance_suite_1 = require("../performance-suite");
const metrics_collector_1 = require("../metrics-collector");
const test_plan_1 = require("../test-plan");
const test_runner_1 = require("../test-runner");
const promises_1 = __importDefault(require("fs/promises"));
jest.mock('fs/promises', () => ({
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    unlink: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../test-plan', () => {
    return {
        TestPlan: jest.fn().mockImplementation(() => ({
            runAll: jest.fn().mockResolvedValue([{
                    timestamp: new Date().toISOString(),
                    phaseName: 'baseline',
                    metrics: {
                        memoryUsage: { baseline: 100, peak: 200, afterRelease: 150 },
                        contextStats: { loadTime: 100, transitionTime: 50, compressionRatio: 0.8 },
                        modelMetrics: { inferenceTime: 50, responseLatency: 100, contextSwitchTime: 30 }
                    },
                    success: true,
                    duration: 1000
                }]),
            cleanup: jest.fn()
        }))
    };
});
jest.mock('../metrics-collector', () => {
    return {
        MetricsCollector: jest.fn().mockImplementation(() => ({
            collectionInterval: null,
            snapshots: [],
            modelMemoryUsage: new Map(),
            timings: new Map(),
            startCollection: jest.fn(),
            stopCollection: jest.fn(),
            collectMetrics: jest.fn().mockResolvedValue({
                memoryUsage: {
                    baseline: 100,
                    peak: 200,
                    afterRelease: 150
                },
                contextStats: {
                    loadTime: 100,
                    transitionTime: 50,
                    compressionRatio: 0.8
                },
                modelMetrics: {
                    inferenceTime: 50,
                    responseLatency: 100,
                    contextSwitchTime: 30
                }
            }),
            recordModelMemory: jest.fn(),
            recordTiming: jest.fn(),
            getModelMemoryMetrics: jest.fn().mockReturnValue({}),
            getAverages: jest.fn().mockReturnValue({}),
            getSystemMetrics: jest.fn().mockReturnValue({
                timestamp: Date.now(),
                memory: {
                    total: 1000,
                    used: 500,
                    free: 500
                },
                cpu: {
                    user: 0,
                    system: 0,
                    idle: 0
                }
            })
        }))
    };
});
// Mock process.memoryUsage
const mockMemoryUsage = jest.fn(() => ({
    heapUsed: 100,
    heapTotal: 200,
    external: 50,
    rss: 300,
    arrayBuffers: 25
}));
process.memoryUsage = mockMemoryUsage;
// Mock performance.now
const mockNow = jest.fn().mockReturnValue(1000);
global.performance.now = mockNow;
// Mock global.gc
global.gc = jest.fn();
describe('Performance Test Suite', () => {
    let testSuite;
    let metricsCollector;
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        // Create a new instance of PerformanceTestSuite
        testSuite = new performance_suite_1.PerformanceTestSuite();
        // Get the mocked MetricsCollector instance that was created inside PerformanceTestSuite
        metricsCollector = testSuite.metricsCollector;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Baseline Tests', () => {
        it('should collect baseline metrics for all models', async () => {
            const results = await testSuite.runBaseline();
            expect(results).toBeDefined();
            expect(results.memoryUsage).toBeDefined();
            expect(results.contextStats).toBeDefined();
            expect(results.modelMetrics).toBeDefined();
        });
        it('should handle memory measurements correctly', async () => {
            const results = await testSuite.runBaseline();
            expect(results.memoryUsage.baseline).toBeGreaterThan(0);
            expect(results.memoryUsage.peak).toBeGreaterThanOrEqual(results.memoryUsage.baseline);
            expect(results.memoryUsage.afterRelease).toBeLessThanOrEqual(results.memoryUsage.peak);
        });
    });
    describe('Cross-Model Tests', () => {
        it('should measure model switching performance', async () => {
            const results = await testSuite.testCrossModelInteractions();
            expect(results.switchingLatency).toBeDefined();
            expect(results.switchingLatency.averageSwitchTime).toBeGreaterThan(0);
            expect(results.switchingLatency.maxSwitchTime).toBeGreaterThan(0);
            expect(results.switchingLatency.minSwitchTime).toBeGreaterThan(0);
            expect(results.switchingLatency.samples).toHaveLength(5); // We simulate 5 switches
        });
        it('should track context preservation', async () => {
            const results = await testSuite.testCrossModelInteractions();
            expect(results.contextPreservation).toBeDefined();
            expect(results.contextPreservation.preservationRate).toBeGreaterThanOrEqual(0);
            expect(results.contextPreservation.preservationRate).toBeLessThanOrEqual(1);
            expect(results.contextPreservation.contextSize).toHaveLength(5);
            expect(results.contextPreservation.accuracy).toHaveLength(5);
        });
        it('should maintain memory profile during model switches', async () => {
            const results = await testSuite.testCrossModelInteractions();
            expect(results.memoryProfile).toBeDefined();
            expect(results.memoryProfile.samples).toHaveLength(5);
            expect(results.memoryProfile.peak).toBeGreaterThan(0);
            expect(results.memoryProfile.average).toBeGreaterThan(0);
            expect(results.memoryProfile.timeline).toHaveLength(5);
            expect(results.memoryProfile.timeline[0]).toHaveProperty('timestamp');
            expect(results.memoryProfile.timeline[0]).toHaveProperty('usage');
            expect(results.memoryProfile.timeline[0]).toHaveProperty('event');
        });
        it('should handle errors during model switching', async () => {
            // Mock simulateModelSwitch to throw an error
            jest.spyOn(testSuite, 'simulateModelSwitch').mockImplementation(() => {
                throw new Error('Model switch failed');
            });
            await expect(testSuite.testCrossModelInteractions()).rejects.toThrow('Model switch failed');
        });
        it('should handle memory collection errors', async () => {
            // Save original memoryUsage function
            const originalMemoryUsage = process.memoryUsage;
            // Create a new mock function
            const mockMemoryUsage = jest.fn(() => {
                throw new Error('Memory usage collection failed');
            });
            // Cast and assign the mock
            process.memoryUsage = mockMemoryUsage;
            await expect(testSuite.testCrossModelInteractions()).rejects.toThrow('Memory usage collection failed');
            // Restore original memoryUsage function
            process.memoryUsage = originalMemoryUsage;
        });
    });
});
describe('Metrics Collector', () => {
    let collector;
    beforeEach(() => {
        collector = new metrics_collector_1.MetricsCollector();
    });
    it('should collect memory metrics', async () => {
        const metrics = await collector.collectMetrics(1000); // 1 second test
        expect(metrics.memoryUsage.baseline).toBeGreaterThan(0);
        expect(metrics.memoryUsage.peak).toBeGreaterThan(0);
        expect(metrics.memoryUsage.peak).toBeGreaterThanOrEqual(metrics.memoryUsage.baseline);
    });
    it('should track model-specific memory usage', () => {
        collector.recordModelMemory('test-model', 1000000);
        const modelMetrics = collector.getModelMemoryMetrics();
        expect(modelMetrics['test-model']).toBeDefined();
        expect(modelMetrics['test-model'].avg).toBeGreaterThan(0);
        expect(modelMetrics['test-model'].peak).toBeGreaterThan(0);
    });
    it('should handle timing measurements', () => {
        collector.recordTiming('load', 100);
        collector.recordTiming('inference', 50);
        const averages = collector.getAverages();
        expect(averages.avgLoadTime).toBe(100);
        expect(averages.avgInferenceTime).toBe(50);
    });
    it('should start and stop collection', () => {
        collector.startCollection();
        expect(collector['collectionInterval']).toBeTruthy();
        collector.stopCollection();
        expect(collector['collectionInterval']).toBeNull();
    });
});
describe('Test Plan', () => {
    let testPlan;
    beforeEach(() => {
        testPlan = new test_plan_1.TestPlan();
    });
    it('should execute all test phases', async () => {
        const results = await testPlan.runAll();
        expect(results).toBeInstanceOf(Array);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].phaseName).toBeDefined();
        expect(results[0].metrics).toBeDefined();
    });
    it('should stop on critical failures', async () => {
        // Mock a critical failure
        jest.spyOn(testPlan, 'runBaselinePhase').mockImplementation(() => {
            throw new Error('Critical failure');
        });
        const results = await testPlan.runAll();
        expect(results.length).toBe(1);
        expect(results[0].success).toBe(false);
    });
});
describe('Test Runner', () => {
    let runner;
    const testOutputDir = 'test-output';
    beforeEach(() => {
        runner = new test_runner_1.TestRunner(testOutputDir);
        promises_1.default.mkdir.mockResolvedValue(undefined);
        promises_1.default.writeFile.mockResolvedValue(undefined);
    });
    it('should create output directory if it doesn\'t exist', async () => {
        await runner.runTests();
        expect(promises_1.default.mkdir).toHaveBeenCalledWith(testOutputDir, { recursive: true });
    });
    it('should save test results and report', async () => {
        const { results, report } = await runner.runTests();
        expect(promises_1.default.writeFile).toHaveBeenCalledTimes(2); // Results and report
        expect(results).toBeDefined();
        expect(report).toBeDefined();
    });
    it('should handle test failures gracefully', async () => {
        // Mock a test failure
        jest.spyOn(test_plan_1.TestPlan.prototype, 'runAll').mockImplementation(() => {
            throw new Error('Test failure');
        });
        await expect(runner.runTests()).rejects.toThrow('Test failure');
    });
    it('should clean up resources after test completion', async () => {
        const { results, report } = await runner.runTests();
        // Verify cleanup operations
        expect(promises_1.default.writeFile).toHaveBeenCalledTimes(2);
        expect(test_plan_1.TestPlan.prototype.cleanup).toHaveBeenCalled();
        // Verify test artifacts are properly saved
        expect(promises_1.default.writeFile).toHaveBeenCalledWith(expect.stringContaining('test-output'), expect.any(String), expect.any(String));
    });
});
//# sourceMappingURL=performance-suite.test.js.map