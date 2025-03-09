"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTests = exports.TestExecutor = void 0;
const health_1 = require("./types/health");
class TestExecutor {
    constructor() {
        this.currentContext = {
            healthState: (0, health_1.createDefaultHealthState)(),
            startTime: Date.now()
        };
    }
    async runSuite(suite) {
        const results = [];
        try {
            // Initialize suite health monitoring
            this.currentContext.healthState = (0, health_1.createDefaultHealthState)();
            this.currentContext.startTime = Date.now();
            // Run each test
            for (const test of suite.tests) {
                try {
                    // Check health before test
                    if (!this.isHealthyToRun()) {
                        throw new Error('System health check failed before test');
                    }
                    // Run test
                    const startTime = Date.now();
                    await test.run();
                    const endTime = Date.now();
                    // Record success
                    results.push({
                        name: test.name,
                        success: true,
                        duration: endTime - startTime,
                        health: this.currentContext.healthState
                    });
                }
                catch (error) {
                    // Handle test failure
                    this.handleTestFailure(error, test.name, results);
                }
                // Update health metrics after each test
                this.updateHealthMetrics();
            }
        }
        catch (error) {
            // Handle suite-level failures
            this.handleSuiteFailure(error, results);
        }
        // Record suite completion
        this.currentContext.endTime = Date.now();
        return results;
    }
    isHealthyToRun() {
        const health = this.currentContext.healthState.health;
        return (health.errorRate < 0.1 &&
            health.cpu < 0.9 &&
            health.memory < 0.9);
    }
    updateHealthMetrics() {
        const health = this.currentContext.healthState.health;
        // Update metrics based on current system state
        health.cpu = process.cpuUsage().user / 1000000;
        health.memory = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
        // Update metrics
        this.currentContext.healthState.metrics.totalOperations++;
        this.currentContext.healthState.metrics.responseTime =
            (Date.now() - this.currentContext.startTime) /
                this.currentContext.healthState.metrics.totalOperations;
    }
    handleTestFailure(error, testName, results) {
        const errorState = (0, health_1.createErrorHealthState)(error instanceof Error ? error : new Error('Unknown error'));
        results.push({
            name: testName,
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error'),
            duration: Date.now() - this.currentContext.startTime,
            health: errorState
        });
        // Update suite health state
        this.currentContext.healthState.errorCount++;
        this.currentContext.healthState.health.errorRate =
            this.currentContext.healthState.errorCount /
                this.currentContext.healthState.metrics.totalOperations;
    }
    handleSuiteFailure(error, results) {
        const errorState = (0, health_1.createErrorHealthState)(error instanceof Error ? error : new Error('Suite execution failed'));
        // Mark all remaining tests as skipped
        results.forEach(result => {
            if (!result.success && !result.error) {
                result.skipped = true;
                result.health = errorState;
            }
        });
        this.currentContext.healthState = errorState;
    }
}
exports.TestExecutor = TestExecutor;
async function runTests(suite) {
    const executor = new TestExecutor();
    return executor.runSuite(suite);
}
exports.runTests = runTests;
//# sourceMappingURL=run-tests.js.map