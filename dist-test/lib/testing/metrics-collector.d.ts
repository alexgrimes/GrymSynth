import { PerformanceMetrics, SystemMetrics } from './types';
export declare class MetricsCollector {
    private collectionInterval;
    private snapshots;
    private modelMemoryUsage;
    private timings;
    startCollection(): void;
    stopCollection(): void;
    collectMetrics(sampleDuration: number): Promise<PerformanceMetrics>;
    recordModelMemory(modelId: string, memoryUsage: number): void;
    recordTiming(type: string, duration: number): void;
    getModelMemoryMetrics(): Record<string, {
        avg: number;
        peak: number;
    }>;
    getAverages(): Record<string, number>;
    private collectSnapshot;
    private getCurrentMetrics;
    private getAverageTime;
    private calculateCompressionRatio;
    getSystemMetrics(): SystemMetrics;
}
