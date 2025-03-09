"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const test_plan_1 = require("./test-plan");
class TestRunner {
    constructor(outputDir) {
        this.testPlan = new test_plan_1.TestPlan();
        this.outputDir = outputDir;
    }
    async runTests() {
        // Create output directory if it doesn't exist
        await promises_1.default.mkdir(this.outputDir, { recursive: true });
        // Run all test phases
        const results = await this.testPlan.runAll();
        // Generate report
        const report = this.generateReport(results);
        // Save results and report
        await this.saveResults(results, report);
        return { results, report };
    }
    async cleanup() {
        try {
            // Clean up test artifacts
            const files = await promises_1.default.readdir(this.outputDir);
            const oldFiles = files.filter(file => file.startsWith('results-') ||
                file.startsWith('report-'));
            // Keep only the last 5 test runs
            if (oldFiles.length > 5) {
                const filesToDelete = oldFiles
                    .sort()
                    .slice(0, oldFiles.length - 5);
                await Promise.all(filesToDelete.map(file => promises_1.default.unlink(path_1.default.join(this.outputDir, file))));
            }
            // Stop any ongoing metrics collection
            if (this.testPlan) {
                await this.testPlan.cleanup?.();
            }
        }
        catch (error) {
            console.error('Error during cleanup:', error);
            // Don't throw the error to avoid failing the entire test run
        }
    }
    generateReport(results) {
        const passedPhases = results.filter(r => r.success).length;
        const phaseResults = results.map(result => ({
            name: result.phaseName,
            status: result.success ? 'pass' : 'fail',
            metrics: this.generateMetricResults(result),
            errors: result.error ? [result.error] : undefined
        }));
        const recommendations = this.generateRecommendations(results);
        return {
            title: 'Performance Test Results',
            timestamp: new Date().toISOString(),
            summary: {
                status: passedPhases === results.length ? 'pass' : 'fail',
                duration: results.reduce((sum, r) => sum + r.duration, 0),
                totalPhases: results.length,
                passedPhases
            },
            phases: phaseResults,
            recommendations
        };
    }
    generateMetricResults(result) {
        const metrics = [];
        // Memory metrics
        metrics.push({
            name: 'Peak Memory Usage',
            value: result.metrics.memoryUsage.peak,
            threshold: 1024 * 1024 * 1024,
            status: result.metrics.memoryUsage.peak <= 1024 * 1024 * 1024 ? 'pass' : 'fail'
        });
        // Context metrics
        metrics.push({
            name: 'Context Load Time',
            value: result.metrics.contextStats.loadTime,
            threshold: 1000,
            status: result.metrics.contextStats.loadTime <= 1000 ? 'pass' : 'fail'
        });
        // Model metrics
        metrics.push({
            name: 'Inference Time',
            value: result.metrics.modelMetrics.inferenceTime,
            threshold: 500,
            status: result.metrics.modelMetrics.inferenceTime <= 500 ? 'pass' : 'fail'
        });
        return metrics;
    }
    generateRecommendations(results) {
        const recommendations = [];
        // Analyze memory usage
        const peakMemory = Math.max(...results.map(r => r.metrics.memoryUsage.peak));
        if (peakMemory > 1024 * 1024 * 1024) {
            recommendations.push('Memory usage exceeds 1GB threshold. Consider implementing memory optimization strategies.');
        }
        // Analyze response times
        const avgResponseTime = results.reduce((sum, r) => sum + r.metrics.modelMetrics.responseLatency, 0) /
            results.length;
        if (avgResponseTime > 1000) {
            recommendations.push('Average response time exceeds 1 second. Consider implementing response time optimizations.');
        }
        // Analyze context preservation
        const avgCompressionRatio = results.reduce((sum, r) => sum + r.metrics.contextStats.compressionRatio, 0) /
            results.length;
        if (avgCompressionRatio < 0.8) {
            recommendations.push('Context compression ratio is below 80%. Consider reviewing context management strategy.');
        }
        return recommendations;
    }
    async saveResults(results, report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // Save raw results
        await promises_1.default.writeFile(path_1.default.join(this.outputDir, `results-${timestamp}.json`), JSON.stringify(results, null, 2));
        // Save report
        await promises_1.default.writeFile(path_1.default.join(this.outputDir, `report-${timestamp}.json`), JSON.stringify(report, null, 2));
    }
}
exports.TestRunner = TestRunner;
//# sourceMappingURL=test-runner.js.map