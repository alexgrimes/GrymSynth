/**
 * MetricsCollector - Collects and aggregates performance metrics
 */
import { FeatureMemoryMetrics, OperationType } from './types';
export declare class MetricsCollector {
    private operationMetrics;
    private startTimes;
    private recentErrors;
    private readonly metricsWindow;
    private readonly errorWindow;
    private lastCleanup;
    private maxStorageSize;
    /**
     * Start timing an operation
     */
    startOperation(operation: string): void;
    /**
     * End timing an operation and record its duration
     */
    endOperation(operation: string): void;
    /**
     * Record a latency measurement for an operation
     */
    recordLatency(operation: string, duration: number): void;
    /**
     * Record an error for an operation
     */
    recordError(operation: string, type?: OperationType): void;
    /**
     * Get total number of operations across all types
     */
    getTotalOperations(): number;
    /**
     * Get error rate for specific operation or overall
     */
    getErrorRate(operation?: string): number;
    /**
     * Get number of recent errors within the specified time window
     */
    getRecentErrorCount(timeWindow?: number): number;
    /**
     * Get aggregated metrics
     */
    getMetrics(): FeatureMemoryMetrics;
    private calculateAggregatedMetrics;
    private calculateResourceMetrics;
    private calculateHealthStatus;
    private getRecentLatencyData;
    /**
     * Clean up old metrics that are outside the tracking window
     */
    private cleanupOldMetrics;
    /**
     * Clean up old error events
     */
    private cleanupOldErrors;
    /**
     * Calculate optimization effectiveness score
     */
    private calculateOptimizationScore;
    /**
     * Calculate CPU usage approximation
     */
    private calculateCpuUsage;
    /**
     * Calculate storage usage based on tracked metrics
     */
    private calculateStorageUsage;
    /**
     * Calculate 95th percentile latency
     */
    private calculateP95Latency;
    /**
     * Calculate latency variance
     */
    private calculateLatencyVariance;
    /**
     * Calculate spike factor
     */
    private calculateSpikeFactor;
    /**
     * Calculate recent throughput
     */
    private calculateRecentThroughput;
    /**
     * Determine system health status
     */
    private determineHealthStatus;
    /**
     * Generate health recommendations based on metrics
     */
    private generateRecommendations;
    /**
     * Ensure operation metrics exist
     */
    private ensureOperationMetrics;
}
