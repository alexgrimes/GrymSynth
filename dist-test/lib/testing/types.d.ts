/**
 * Performance testing types and interfaces
 */
export type TestPhaseName = 'baseline' | 'cross-model' | 'load';
export interface PhaseConfig {
    name: TestPhaseName;
    duration: number;
    metrics: string[];
    thresholds: Record<string, number>;
}
export interface MemoryUsage {
    baseline: number;
    peak: number;
    afterRelease: number;
}
export interface ContextStats {
    loadTime: number;
    transitionTime: number;
    compressionRatio: number;
}
export interface ModelMetrics {
    inferenceTime: number;
    responseLatency: number;
    contextSwitchTime: number;
    switchingLatency?: SwitchingLatency;
    contextPreservation?: ContextPreservation;
    memoryProfile?: MemoryProfile;
}
export interface BaseModelMetrics {
    inferenceTime: number;
    responseLatency: number;
    contextSwitchTime: number;
}
export interface PerformanceMetrics {
    memoryUsage: MemoryUsage;
    contextStats: ContextStats;
    modelMetrics: BaseModelMetrics;
}
export interface TestResults {
    timestamp: string;
    phaseName: TestPhaseName;
    metrics: PerformanceMetrics;
    success: boolean;
    error?: string;
    duration: number;
}
export interface TestConfig {
    baselineIterations: number;
    crossModelPairs: number;
    loadTestDuration: number;
    metricsInterval: number;
    maxConcurrentRequests: number;
    memoryThreshold: number;
    responseTimeThreshold: number;
    outputDir: string;
    maxMemory: number;
}
export declare const DEFAULT_CONFIG: TestConfig;
export declare const DEFAULT_THRESHOLDS: {
    maxMemoryUsage: number;
    avgResponseTime: number;
    contextPreservation: number;
    modelSwitchTime: number;
    contextAccuracy: number;
    memoryGrowth: number;
    errorRate: number;
    concurrentRequests: number;
};
export interface MetricsSnapshot {
    timestamp: number;
    metrics: PerformanceMetrics;
}
export interface TimelineEvent {
    timestamp: number;
    usage: number;
    event: string;
}
export interface MemoryProfile {
    samples: number[];
    peak: number;
    timestamp?: number[];
    average: number;
    timeline: TimelineEvent[];
}
export interface SwitchingLatency {
    averageSwitchTime: number;
    maxSwitchTime: number;
    minSwitchTime: number;
    samples?: number[];
}
export interface ContextPreservation {
    preservationRate: number;
    contextSize: number[];
    accuracy: number[];
}
export interface CrossModelResults {
    inferenceTime: number;
    responseLatency: number;
    contextSwitchTime: number;
    switchingLatency: SwitchingLatency;
    contextPreservation: ContextPreservation;
    memoryProfile: MemoryProfile;
}
export interface LoadTestMetrics {
    concurrentRequests: number;
    responseTime: number[];
    errorCount: number;
    memoryUsage: number[];
    cpuUsage: number[];
}
export interface SystemMetrics {
    timestamp: number;
    memory: {
        total: number;
        used: number;
        free: number;
    };
    cpu: {
        user: number;
        system: number;
        idle: number;
    };
}
export interface MetricResult {
    name: string;
    value: number;
    threshold: number;
    status: MetricStatus;
}
export interface TestPhaseResult {
    name: TestPhaseName;
    status: string;
    metrics: MetricResult[];
    errors?: string[];
}
export interface TestReport {
    title: string;
    timestamp: string;
    summary: {
        status: string;
        duration: number;
        totalPhases: number;
        passedPhases: number;
    };
    phases: TestPhaseResult[];
    systemMetrics?: SystemMetrics[];
    recommendations: string[];
}
export type MetricStatus = 'pass' | 'fail';
export type CrossModelMetrics = CrossModelResults;
export type SampleArray = number | number[];
