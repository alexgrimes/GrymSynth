export type HealthStatusType = 'healthy' | 'degraded' | 'error' | 'unavailable';
export interface HealthMetrics {
    responseTime: number;
    throughput: number;
    errorRate: number;
    totalOperations: number;
    latency?: number;
}
export interface ErrorMetrics {
    errorCount: number;
    lastError?: Error;
    errorTypes: Map<string, number>;
}
export interface HealthState {
    status: HealthStatusType;
    health: {
        cpu: number;
        memory: number;
        errorRate: number;
    };
    errorCount: number;
    metrics: HealthMetrics;
    errors?: ErrorMetrics;
    timestamp: Date;
    recommendations?: string[];
}
export interface HealthConfig {
    checkInterval: number;
    errorThreshold: number;
    warningThreshold: number;
    metricsWindow: number;
}
export interface HealthResponse {
    state: HealthState;
    config: HealthConfig;
    history: HealthState[];
}
export declare function createDefaultHealthState(): HealthState;
export declare function createErrorHealthState(error: Error): HealthState;
export declare function isHealthy(state: HealthState): boolean;
export declare function hasErrors(state: HealthState): boolean;
export declare function shouldRetry(state: HealthState): boolean;
