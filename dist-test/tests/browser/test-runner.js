"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRunner = void 0;
const test_scenarios_1 = require("./test-scenarios");
class BrowserTestRunner {
    constructor() {
        this.environment = this.detectEnvironment();
    }
    detectEnvironment() {
        return {
            network: {
                latency: 0,
                bandwidth: Infinity,
                packetLoss: 0
            },
            device: {
                userAgent: navigator.userAgent,
                screenSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                deviceMemory: navigator.deviceMemory,
                hardwareConcurrency: navigator.hardwareConcurrency
            },
            audio: {
                sampleRate: 44100,
                channels: 2,
                duration: 5,
                format: 'wav'
            }
        };
    }
    async runTests() {
        const startTime = performance.now();
        const results = [];
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        console.log('Starting browser validation tests...');
        // Run all test scenarios
        for (const [name, scenario] of Object.entries(test_scenarios_1.testScenarios)) {
            try {
                console.log(`Running scenario: ${name}`);
                const scenarioResult = await scenario().run();
                const testResult = this.createTestResult(name, scenarioResult, startTime);
                results.push(testResult);
                if (testResult.passed)
                    passed++;
                else
                    failed++;
            }
            catch (error) {
                console.error(`Error in scenario ${name}:`, error);
                failed++;
                results.push({
                    name,
                    passed: false,
                    duration: performance.now() - startTime,
                    metrics: this.createEmptyMetrics(),
                    error: error instanceof Error ? error : new Error('Unknown error')
                });
            }
        }
        const endTime = performance.now();
        const duration = endTime - startTime;
        // Aggregate metrics
        const metrics = this.aggregateMetrics(results);
        return {
            suiteName: 'Browser Audio Learning Tests',
            environment: this.environment,
            results,
            summary: {
                total: results.length,
                passed,
                failed,
                skipped,
                duration
            },
            metrics,
            timestamp: new Date()
        };
    }
    createTestResult(name, result, startTime) {
        return {
            name,
            passed: result.passed,
            duration: performance.now() - startTime,
            metrics: this.transformMetrics(result.metrics || {})
        };
    }
    transformMetrics(scenarioMetrics) {
        // Create base metrics structure
        const metrics = this.createEmptyMetrics();
        // Map scenario metrics to our standard format
        if (typeof scenarioMetrics.memory === 'object' && scenarioMetrics.memory) {
            const memory = scenarioMetrics.memory;
            metrics.memory.heapUsed = memory.heapUsed || 0;
            metrics.memory.heapTotal = memory.heapTotal || 0;
            metrics.memory.external = memory.external || 0;
        }
        if (typeof scenarioMetrics.timing === 'object' && scenarioMetrics.timing) {
            const timing = scenarioMetrics.timing;
            metrics.timing.processing = timing.processing || 0;
            metrics.timing.learning = timing.learning || 0;
            metrics.timing.total = timing.total || 0;
        }
        if (typeof scenarioMetrics.audio === 'object' && scenarioMetrics.audio) {
            const audio = scenarioMetrics.audio;
            metrics.audio.buffersProcessed = audio.buffersProcessed || 0;
            metrics.audio.totalDuration = audio.totalDuration || 0;
            metrics.audio.averageLatency = audio.averageLatency || 0;
        }
        if (typeof scenarioMetrics.performance === 'object' && scenarioMetrics.performance) {
            const perf = scenarioMetrics.performance;
            metrics.performance.fps = perf.fps || 0;
            metrics.performance.dropped = perf.dropped || 0;
        }
        return metrics;
    }
    createEmptyMetrics() {
        return {
            memory: {
                heapUsed: 0,
                heapTotal: 0,
                external: 0
            },
            timing: {
                processing: 0,
                learning: 0,
                total: 0
            },
            audio: {
                buffersProcessed: 0,
                totalDuration: 0,
                averageLatency: 0
            },
            performance: {
                fps: 0,
                dropped: 0
            }
        };
    }
    aggregateMetrics(results) {
        const metrics = this.createEmptyMetrics();
        let validResults = 0;
        results.forEach(result => {
            validResults++;
            // Aggregate memory metrics
            metrics.memory.heapUsed += result.metrics.memory.heapUsed;
            metrics.memory.heapTotal += result.metrics.memory.heapTotal;
            metrics.memory.external += result.metrics.memory.external;
            // Aggregate timing metrics
            metrics.timing.processing += result.metrics.timing.processing;
            metrics.timing.learning += result.metrics.timing.learning;
            metrics.timing.total += result.metrics.timing.total;
            // Aggregate audio metrics
            metrics.audio.buffersProcessed += result.metrics.audio.buffersProcessed;
            metrics.audio.totalDuration += result.metrics.audio.totalDuration;
            metrics.audio.averageLatency =
                (metrics.audio.averageLatency * (validResults - 1) +
                    result.metrics.audio.averageLatency) / validResults;
            // Aggregate performance metrics
            metrics.performance.fps =
                (metrics.performance.fps * (validResults - 1) +
                    result.metrics.performance.fps) / validResults;
            metrics.performance.dropped += result.metrics.performance.dropped;
        });
        // Average out the cumulative metrics
        if (validResults > 0) {
            metrics.memory.heapUsed /= validResults;
            metrics.memory.heapTotal /= validResults;
            metrics.memory.external /= validResults;
            metrics.timing.processing /= validResults;
            metrics.timing.learning /= validResults;
            metrics.timing.total /= validResults;
        }
        return metrics;
    }
}
// Export singleton instance
exports.testRunner = new BrowserTestRunner();
window.testRunner = exports.testRunner;
//# sourceMappingURL=test-runner.js.map