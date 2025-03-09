import { HealthMonitor } from './health-monitor';
import { MetricsCollector } from './metrics-collector';
import { HealthStatus, HealthConfig } from './types';
import { PerformancePrediction } from './types/prediction';
export declare class AdvancedHealthMonitor extends HealthMonitor {
    private readonly patternHistory;
    private readonly predictionWindow;
    private readonly forecastHorizon;
    constructor(metrics: MetricsCollector, config?: Partial<HealthConfig>);
    /**
     * Enhanced health check with predictive analytics
     */
    checkHealth(): HealthStatus;
    /**
     * Predict future performance degradation risks
     */
    predictPerformance(): Promise<PerformancePrediction>;
    /**
     * Detect patterns in metric history
     */
    private detectPatterns;
    /**
     * Enhance health status with predictions
     */
    private enhanceWithPredictions;
    /**
     * Predict future resource needs
     */
    private predictResourceNeeds;
    /**
     * Helper methods for pattern detection and analysis
     */
    private detectCyclicPattern;
    private detectTrendPattern;
    private detectSpikePattern;
    private calculateExpectedLoad;
    private calculateDegradationProbability;
    private estimateTimeToThreshold;
    private updatePatternHistory;
    private forecastMemoryUsage;
    private forecastCpuUtilization;
    private calculateTimeToExhaustion;
    private generatePredictiveRecommendations;
    private getMetricsHistory;
}
