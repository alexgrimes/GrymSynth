import { MetricsCollector } from './metrics-collector';
import { FeatureMemoryMetrics, HealthStatus, StatusSample, HealthConfig } from './types';
export declare class HealthMonitor {
    private readonly metrics;
    private readonly config;
    private readonly stateMachine;
    private lastStatus;
    private statusHistory;
    private readonly historyLimit;
    private pendingSamples;
    private readonly pendingSamplesLimit;
    protected getMetricsCollector(): MetricsCollector;
    protected getConfiguration(): HealthConfig;
    protected getRawMetrics(): FeatureMemoryMetrics;
    constructor(metrics: MetricsCollector, config?: Partial<HealthConfig>);
    checkHealth(): HealthStatus;
    getLastStatus(): HealthStatus;
    getStatusHistory(): StatusSample[];
    private determineOverallStatus;
    private calculateHealthScore;
    private recordStatusTransition;
    private generateRecommendations;
}
