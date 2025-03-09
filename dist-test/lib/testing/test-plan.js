"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestPlan = void 0;
const perf_hooks_1 = require("perf_hooks");
const performance_suite_1 = require("./performance-suite");
const metrics_collector_1 = require("./metrics-collector");
const types_1 = require("./types");
/**
 * Manages test execution phases and orchestrates the testing process
 */
class TestPlan {
    constructor() {
        this.testSuite = new performance_suite_1.PerformanceTestSuite();
        this.metricsCollector = new metrics_collector_1.MetricsCollector();
        this.phases = new Map();
        this.initializePhases();
    }
    /**
     * Run all test phases
     */
    async runAll() {
        const results = [];
        try {
            // Run baseline phase
            const baselineResults = await this.runBaselinePhase();
            results.push(baselineResults);
            // Only continue if baseline passes
            if (baselineResults.success) {
                // Run cross-model phase
                const crossModelResults = await this.runCrossModelPhase();
                results.push(crossModelResults);
                // Run load phase if previous phases pass
                if (crossModelResults.success) {
                    const loadResults = await this.runLoadPhase();
                    results.push(loadResults);
                }
            }
            return results;
        }
        catch (error) {
            console.error('Error running test plan:', error);
            // Use baseline as the fallback phase for errors
            results.push(this.createErrorResult('baseline', error));
            return results;
        }
        finally {
            this.metricsCollector.stopCollection();
        }
    }
    /**
     * Clean up resources and stop metrics collection
     */
    async cleanup() {
        try {
            // Stop metrics collection
            this.metricsCollector.stopCollection();
            // Clean up any test-specific resources
            await this.cleanupTestResources();
        }
        catch (error) {
            console.error('Error during test plan cleanup:', error);
        }
    }
    /**
     * Initialize test phase configurations
     */
    initializePhases() {
        const baselineConfig = {
            name: 'baseline',
            duration: 1000,
            metrics: ['memoryUsage', 'responseTime', 'contextPreservation'],
            thresholds: types_1.DEFAULT_THRESHOLDS
        };
        const crossModelConfig = {
            name: 'cross-model',
            duration: 1000,
            metrics: ['switchingLatency', 'contextAccuracy', 'memoryGrowth'],
            thresholds: types_1.DEFAULT_THRESHOLDS
        };
        const loadConfig = {
            name: 'load',
            duration: 1000,
            metrics: ['concurrentRequests', 'systemStability', 'errorRate'],
            thresholds: types_1.DEFAULT_THRESHOLDS
        };
        this.phases.clear();
        this.phases.set('baseline', baselineConfig);
        this.phases.set('cross-model', crossModelConfig);
        this.phases.set('load', loadConfig);
    }
    /**
     * Run baseline performance phase
     */
    async runBaselinePhase() {
        const phase = this.phases.get('baseline');
        const startTime = perf_hooks_1.performance.now();
        try {
            const metrics = await this.testSuite.runBaseline();
            const success = this.validateBaselineMetrics(metrics, phase.thresholds);
            return {
                timestamp: new Date().toISOString(),
                phaseName: 'baseline',
                metrics,
                success,
                duration: perf_hooks_1.performance.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult('baseline', error);
        }
    }
    /**
     * Run cross-model interaction phase
     */
    async runCrossModelPhase() {
        const phase = this.phases.get('cross-model');
        const startTime = perf_hooks_1.performance.now();
        try {
            const results = await this.testSuite.testCrossModelInteractions();
            const success = this.validateCrossModelMetrics(results, phase.thresholds);
            return {
                timestamp: new Date().toISOString(),
                phaseName: 'cross-model',
                metrics: this.convertCrossModelMetrics(results),
                success,
                duration: perf_hooks_1.performance.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult('cross-model', error);
        }
    }
    /**
     * Run load testing phase
     */
    async runLoadPhase() {
        const phase = this.phases.get('load');
        const startTime = perf_hooks_1.performance.now();
        try {
            // Start metrics collection for load test
            this.metricsCollector.startCollection();
            // Run load test scenarios
            const metrics = await this.simulateLoad(phase.duration);
            const success = this.validateLoadMetrics(metrics, phase.thresholds);
            return {
                timestamp: new Date().toISOString(),
                phaseName: 'load',
                metrics,
                success,
                duration: perf_hooks_1.performance.now() - startTime
            };
        }
        catch (error) {
            return this.createErrorResult('load', error);
        }
        finally {
            this.metricsCollector.stopCollection();
        }
    }
    /**
     * Clean up test-specific resources
     */
    async cleanupTestResources() {
        // Clean up any temporary files or resources created during testing
        // This is a placeholder for actual cleanup logic
    }
    /**
     * Convert cross-model results to standard metrics format
     */
    convertCrossModelMetrics(results) {
        return {
            memoryUsage: {
                baseline: 0,
                peak: 0,
                afterRelease: 0
            },
            contextStats: {
                loadTime: 0,
                transitionTime: results.switchingLatency?.averageSwitchTime || 0,
                compressionRatio: results.contextPreservation?.preservationRate || 0
            },
            modelMetrics: {
                inferenceTime: results.inferenceTime || 0,
                responseLatency: results.responseLatency || 0,
                contextSwitchTime: results.contextSwitchTime || 0
            }
        };
    }
    /**
     * Simulate load testing
     */
    async simulateLoad(duration) {
        const startTime = perf_hooks_1.performance.now();
        const endTime = startTime + duration;
        while (perf_hooks_1.performance.now() < endTime) {
            await this.simulateLoadIteration();
        }
        return await this.metricsCollector.collectMetrics(5000); // 5 second sample
    }
    /**
     * Simulate a single load test iteration
     */
    async simulateLoadIteration() {
        const iterationTime = Math.random() * 1000 + 500; // 500-1500ms
        await new Promise(resolve => setTimeout(resolve, iterationTime));
    }
    /**
     * Validate baseline metrics against thresholds
     */
    validateBaselineMetrics(metrics, thresholds) {
        return (metrics.memoryUsage.peak <= thresholds.maxMemoryUsage &&
            metrics.modelMetrics.responseLatency <= thresholds.avgResponseTime &&
            metrics.contextStats.compressionRatio >= thresholds.contextPreservation);
    }
    /**
     * Validate cross-model metrics against thresholds
     */
    validateCrossModelMetrics(results, thresholds) {
        return (results.switchingLatency?.maxSwitchTime <= thresholds.modelSwitchTime &&
            results.contextPreservation?.preservationRate >= thresholds.contextAccuracy &&
            (results.memoryProfile?.peak - results.memoryProfile?.samples[0]) <= thresholds.memoryGrowth);
    }
    /**
     * Validate load test metrics against thresholds
     */
    validateLoadMetrics(metrics, thresholds) {
        // For load testing, we use memory metrics as a proxy for system stability
        const memoryStability = metrics.memoryUsage.peak / metrics.memoryUsage.baseline;
        return memoryStability <= 1.5; // Allow up to 50% memory growth under load
    }
    /**
     * Create error result for failed phase
     */
    createErrorResult(phaseName, error) {
        return {
            timestamp: new Date().toISOString(),
            phaseName,
            metrics: {
                memoryUsage: { baseline: 0, peak: 0, afterRelease: 0 },
                contextStats: { loadTime: 0, transitionTime: 0, compressionRatio: 0 },
                modelMetrics: { inferenceTime: 0, responseLatency: 0, contextSwitchTime: 0 }
            },
            success: false,
            error: error.message,
            duration: 0
        };
    }
}
exports.TestPlan = TestPlan;
//# sourceMappingURL=test-plan.js.map