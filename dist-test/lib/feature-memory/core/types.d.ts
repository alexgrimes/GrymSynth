export interface Pattern {
    id: string;
    features: Map<string, any>;
    confidence: number;
    timestamp: Date;
    metadata: PatternMetadata;
}
export interface PatternMetadata {
    source: string;
    category: string;
    frequency: number;
    lastUpdated: Date;
}
export interface ValidationResult {
    isValid: boolean;
    errors: {
        code: string;
        message: string;
        severity: 'critical' | 'warning';
    }[];
    warnings: {
        code: string;
        message: string;
    }[];
    metadata: {
        timestamp: Date;
        validationDuration: number;
        validatedItemsCount: number;
    };
}
export interface SearchCriteria {
    metadata?: Partial<PatternMetadata>;
    features?: Map<string, any>;
}
export type HealthStatusType = 'healthy' | 'degraded' | 'unhealthy';
export interface HealthConfig {
    memoryThresholds: {
        heapUsageWarning: number;
        heapUsageCritical: number;
        heapUsageRecovery: number;
        cacheUtilizationWarning: number;
        cacheUtilizationCritical: number;
        cacheUtilizationRecovery: number;
    };
    performanceThresholds: {
        latencyWarning: number;
        latencyCritical: number;
        latencyRecovery: number;
        throughputWarning: number;
        throughputCritical: number;
        throughputRecovery: number;
    };
    errorThresholds: {
        errorRateWarning: number;
        errorRateCritical: number;
        errorRateRecovery: number;
    };
    timeWindows: {
        errorRateWindow: number;
        performanceWindow: number;
    };
    stabilization: StateTransitionConfig;
}
export interface HealthState {
    status: HealthStatusType;
    indicators: HealthIndicators;
    timestamp: number;
}
export interface StateTransition {
    from: HealthStatusType;
    to: HealthStatusType;
    timestamp: number;
    reason: string;
}
export interface HealthIndicators {
    memory: MemoryHealth;
    performance: PerformanceHealth;
    errors: ErrorHealth;
    metrics?: HealthMetrics;
}
export interface MemoryHealth {
    heapUsage: number;
    heapLimit: number;
    cacheUtilization: number;
    status: HealthStatusType;
}
export interface PerformanceHealth {
    averageLatency: number;
    p95Latency: number;
    throughput: number;
    latencyVariance: number;
    spikeFactor: number;
    recentThroughput: number;
    status: HealthStatusType;
}
export interface ErrorHealth {
    errorRate: number;
    recentErrors: number;
    status: HealthStatusType;
}
export interface HealthMetrics {
    errorRate: number;
    responseTime: number;
    throughput: number;
    totalOperations: number;
    latency?: number;
}
export interface HealthStatus {
    status: HealthStatusType;
    indicators: HealthIndicators;
    lastCheck: Date;
    recommendations: string[];
    metrics: HealthMetrics;
}
export interface StateHistory {
    samples: Array<HealthSample>;
}
export interface HealthSample {
    status: HealthStatusType;
    indicators: HealthIndicators;
    timestamp: Date;
}
export interface StorageOptions {
    cacheSizeLimit: number;
    persistenceBatchSize: number;
    maxPatterns: number;
    optimizationInterval: number;
    persistenceInterval: number;
    persistenceEnabled: boolean;
    healthCheckInterval: number;
    compressionEnabled: boolean;
}
export interface FeatureMemoryMetrics extends OperationalMetrics {
    kind: 'feature';
    patternRecognitionLatency: number;
    storageOperationLatency: number;
    optimizationEffectiveness: number;
    recentLatencies: number[];
    recentLatencyTimestamps: number[];
}
export interface StorageMetrics extends FeatureMemoryMetrics {
    operationType: Extract<OperationType, 'storage' | 'retrieval' | 'search'>;
}
export interface RecognitionMetrics extends FeatureMemoryMetrics {
    operationType: Extract<OperationType, 'recognition'>;
}
export interface BaseStorageResult {
    success: boolean;
    metrics: StorageMetrics;
    health: HealthStatus;
    affectedPatterns: number;
}
export interface SuccessfulStorageResult<T> extends BaseStorageResult {
    success: true;
    data: T;
    error?: never;
}
export interface FailedStorageResult extends BaseStorageResult {
    success: false;
    data: null;
    error: string;
    errorType: 'validation' | 'persistence' | 'processing';
}
export type StorageOperationResult<T> = SuccessfulStorageResult<T> | FailedStorageResult;
export type MetricKind = 'operation' | 'resource' | 'feature';
export type OperationType = 'storage' | 'retrieval' | 'search' | 'recognition';
export interface BaseMetrics {
    timestamp: Date;
    kind: MetricKind;
}
export interface ResourceMetrics {
    memoryUsage: number;
    cpuUsage: number;
    storageUsage: number;
    storageLimit: number;
}
export interface OperationalMetrics extends BaseMetrics {
    durationMs: number;
    resourceUsage: ResourceMetrics;
    healthStatus: HealthStatus;
}
export interface BasicHealthMetrics {
    errorRate: number;
    responseTime: number;
    throughput: number;
    totalOperations: number;
}
export interface StatusSample {
    status: HealthStatusType;
    timestamp: number;
    weight?: number;
}
export interface StateTransitionConfig {
    minStateDuration: number;
    confirmationSamples: number;
    cooldownPeriod: number;
    maxTransitionsPerMinute: number;
}
export declare const DEFAULT_RESOURCE_METRICS: ResourceMetrics;
export declare const DEFAULT_BASIC_METRICS: HealthMetrics;
export declare const DEFAULT_HEALTH_STATUS: HealthStatus;
export declare function createFeatureMemoryMetrics(baseMetrics?: Partial<FeatureMemoryMetrics>, resourceUsage?: Partial<ResourceMetrics>, healthStatus?: Partial<HealthStatus>): FeatureMemoryMetrics;
export declare function createStorageOperationResult<T>(data: T | null | undefined, operationType: StorageMetrics['operationType'], startTime: number, success?: boolean, error?: string, errorType?: FailedStorageResult['errorType'], affectedPatterns?: number): StorageOperationResult<T>;
export declare function isStorageMetrics(metrics: unknown): metrics is StorageMetrics;
export declare function isRecognitionMetrics(metrics: unknown): metrics is RecognitionMetrics;
export declare function isFeatureMemoryMetrics(metrics: unknown): metrics is FeatureMemoryMetrics;
export declare function isResourceMetrics(metrics: unknown): metrics is ResourceMetrics;
export declare function isHealthStatus(status: unknown): status is HealthStatus;
