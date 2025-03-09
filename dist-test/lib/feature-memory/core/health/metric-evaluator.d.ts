import { MetricEvaluator, MetricValidationResult, MemoryMetrics, PerformanceMetrics, ErrorMetrics, ThresholdConfig } from './types';
export declare class HealthMetricEvaluator implements MetricEvaluator {
    private readonly thresholds;
    constructor(thresholds: ThresholdConfig);
    evaluateMemoryHealth(metrics: MemoryMetrics): MetricValidationResult;
    evaluatePerformanceHealth(metrics: PerformanceMetrics): MetricValidationResult;
    evaluateErrorHealth(metrics: ErrorMetrics): MetricValidationResult;
    getAggregateScore(results: MetricValidationResult[]): number;
    private evaluateThreshold;
    private calculateVariance;
    private evaluateLatencySpikes;
}
