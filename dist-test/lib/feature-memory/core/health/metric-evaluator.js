"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMetricEvaluator = void 0;
class HealthMetricEvaluator {
    constructor(thresholds) {
        this.thresholds = thresholds;
    }
    evaluateMemoryHealth(metrics) {
        const heapUsageRatio = metrics.heapUsage / metrics.heapLimit;
        const heapResult = this.evaluateThreshold(heapUsageRatio, this.thresholds.memory.heapUsage, 'Heap usage');
        const cacheResult = this.evaluateThreshold(metrics.cacheUtilization, this.thresholds.memory.cacheUtilization, 'Cache utilization');
        // Combine results with weighted scoring
        const score = (heapResult.score * 0.6) + (cacheResult.score * 0.4);
        const violations = [...heapResult.violations, ...cacheResult.violations];
        const recommendations = [...heapResult.recommendations, ...cacheResult.recommendations];
        return {
            isValid: score >= 0.8,
            violations,
            recommendations,
            score
        };
    }
    evaluatePerformanceHealth(metrics) {
        // Calculate latency statistics
        const avgLatency = metrics.latencies.length > 0
            ? metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length
            : 0;
        const latencyResult = this.evaluateThreshold(avgLatency, this.thresholds.performance.latency, 'Average latency');
        const throughputResult = this.evaluateThreshold(metrics.throughput, this.thresholds.performance.throughput, 'Throughput');
        // Detect latency spikes
        const latencyVariance = this.calculateVariance(metrics.latencies, avgLatency);
        const spikeScore = this.evaluateLatencySpikes(metrics.latencies, avgLatency, latencyVariance);
        // Combine results with weighted scoring
        const score = (latencyResult.score * 0.4) +
            (throughputResult.score * 0.3) +
            (spikeScore * 0.3);
        const violations = [...latencyResult.violations, ...throughputResult.violations];
        const recommendations = [...latencyResult.recommendations, ...throughputResult.recommendations];
        // Add spike-specific recommendations
        if (spikeScore < 0.8) {
            violations.push('High latency variance detected');
            recommendations.push('Investigate potential resource contention', 'Monitor system load patterns', 'Review concurrent operations');
        }
        return {
            isValid: score >= 0.8,
            violations,
            recommendations,
            score
        };
    }
    evaluateErrorHealth(metrics) {
        const errorRate = metrics.totalOperations > 0
            ? metrics.errorCount / metrics.totalOperations
            : 0;
        const result = this.evaluateThreshold(errorRate, this.thresholds.error.errorRate, 'Error rate');
        // Add error-specific recommendations
        if (result.score < 0.8) {
            result.recommendations.push('Review error patterns and frequencies', 'Check error handling mechanisms', 'Consider implementing circuit breakers');
        }
        return result;
    }
    getAggregateScore(results) {
        if (results.length === 0)
            return 1.0;
        return results.reduce((sum, result) => sum + result.score, 0) / results.length;
    }
    evaluateThreshold(value, thresholds, metricName) {
        let score = 1.0;
        const violations = [];
        const recommendations = [];
        if (value >= thresholds.critical) {
            score = 0.2;
            violations.push(`${metricName} exceeds critical threshold: ${value}`);
            recommendations.push(`Immediate action required: ${metricName} is critically high`);
        }
        else if (value >= thresholds.warning) {
            score = 0.6;
            violations.push(`${metricName} exceeds warning threshold: ${value}`);
            recommendations.push(`Monitor ${metricName}: approaching critical levels`);
        }
        else if (value > thresholds.recovery * 1.1) {
            score = 0.8;
            recommendations.push(`Continue monitoring ${metricName} for stability`);
        }
        return {
            isValid: score >= 0.8,
            violations,
            recommendations,
            score
        };
    }
    calculateVariance(values, mean) {
        if (values.length === 0)
            return 0;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }
    evaluateLatencySpikes(latencies, mean, variance) {
        if (latencies.length < 3)
            return 1.0;
        const stdDev = Math.sqrt(variance);
        const spikes = latencies.filter(l => Math.abs(l - mean) > 2 * stdDev);
        const spikeRatio = spikes.length / latencies.length;
        // Score decreases as spike ratio increases
        return Math.max(0, 1 - (spikeRatio * 5));
    }
}
exports.HealthMetricEvaluator = HealthMetricEvaluator;
//# sourceMappingURL=metric-evaluator.js.map