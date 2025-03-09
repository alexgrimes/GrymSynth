"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestMetricsCollector = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Get default test metrics
 */
function getDefaultMetrics() {
    return {
        timestamp: new Date().toISOString(),
        duration: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        coverage: {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0
        },
        performance: {
            avgTestDuration: 0,
            slowestTests: [],
            memoryUsage: 0
        }
    };
}
/**
 * Collects and analyzes test metrics
 */
class TestMetricsCollector {
    constructor() {
        this.metricsPath = (0, path_1.resolve)(__dirname, '../metrics/test-history.json');
        this.history = this.loadHistory();
    }
    /**
     * Record metrics from a test run
     */
    async recordMetrics(metrics) {
        // Update history
        this.history.lastRun = metrics;
        this.history.history.push(metrics);
        // Keep last 100 runs
        if (this.history.history.length > 100) {
            this.history.history.shift();
        }
        // Update trends
        this.updateTrends();
        // Save metrics
        await this.saveHistory();
    }
    /**
     * Get test run summary
     */
    getRunSummary() {
        return this.history.lastRun || getDefaultMetrics();
    }
    /**
     * Get performance trends
     */
    getTrends() {
        return this.history.trends;
    }
    /**
     * Get performance alerts
     */
    getAlerts() {
        const alerts = [];
        const lastRun = this.getRunSummary();
        // Check pass rate
        const passRate = (lastRun.passed / (lastRun.passed + lastRun.failed)) * 100;
        if (passRate < 95) {
            alerts.push(`Pass rate below 95%: ${passRate.toFixed(1)}%`);
        }
        // Check coverage
        const minCoverage = 85;
        Object.entries(lastRun.coverage).forEach(([type, value]) => {
            if (value < minCoverage) {
                alerts.push(`${type} coverage below ${minCoverage}%: ${value}%`);
            }
        });
        // Check performance
        const avgDuration = this.getAverageDuration();
        if (lastRun.duration > avgDuration * 1.5) {
            alerts.push(`Test duration 50% above average: ${lastRun.duration}ms`);
        }
        return alerts;
    }
    /**
     * Generate metrics report
     */
    generateReport() {
        const lastRun = this.getRunSummary();
        const trends = this.getTrends();
        const alerts = this.getAlerts();
        return `
Test Metrics Report
==================

Last Run: ${lastRun.timestamp}
Duration: ${lastRun.duration}ms

Results
-------
✅ Passed: ${lastRun.passed}
❌ Failed: ${lastRun.failed}
⏭️ Skipped: ${lastRun.skipped}

Coverage
--------
📊 Statements: ${lastRun.coverage.statements}%
📊 Branches: ${lastRun.coverage.branches}%
📊 Functions: ${lastRun.coverage.functions}%
📊 Lines: ${lastRun.coverage.lines}%

Performance
----------
⚡ Average test duration: ${lastRun.performance.avgTestDuration}ms
🐌 Slowest tests:
${lastRun.performance.slowestTests
            .map(test => `  - ${test.name}: ${test.duration}ms`)
            .join('\n')}
💾 Memory usage: ${(lastRun.performance.memoryUsage / 1024 / 1024).toFixed(1)}MB

Trends
------
📈 Pass rate trend: ${this.formatTrend(trends.passRate)}
⏱️ Duration trend: ${this.formatTrend(trends.duration)}
📊 Coverage trend: ${this.formatTrend(trends.coverage)}

${alerts.length > 0 ? `
Alerts
------
${alerts.map(alert => `⚠️ ${alert}`).join('\n')}
` : ''}
    `.trim();
    }
    loadHistory() {
        if ((0, fs_1.existsSync)(this.metricsPath)) {
            return JSON.parse((0, fs_1.readFileSync)(this.metricsPath, 'utf8'));
        }
        return {
            history: [],
            trends: {
                passRate: [],
                duration: [],
                coverage: []
            }
        };
    }
    async saveHistory() {
        (0, fs_1.writeFileSync)(this.metricsPath, JSON.stringify(this.history, null, 2));
    }
    updateTrends() {
        const { history } = this;
        // Calculate trends from last 10 runs
        const recentRuns = history.history.slice(-10);
        this.history.trends = {
            passRate: recentRuns.map(run => (run.passed / (run.passed + run.failed)) * 100),
            duration: recentRuns.map(run => run.duration),
            coverage: recentRuns.map(run => Object.values(run.coverage).reduce((a, b) => a + b, 0) / 4)
        };
    }
    getAverageDuration() {
        if (this.history.history.length === 0)
            return 0;
        const durations = this.history.history.map(run => run.duration);
        return durations.reduce((a, b) => a + b, 0) / durations.length;
    }
    formatTrend(values) {
        const arrows = values.slice(0, -1).map((val, i) => {
            const next = values[i + 1];
            if (next > val)
                return '↗️';
            if (next < val)
                return '↘️';
            return '➡️';
        });
        return arrows.join(' ') || '➡️'; // Default arrow if no trend
    }
}
exports.TestMetricsCollector = TestMetricsCollector;
//# sourceMappingURL=metrics-collector.js.map