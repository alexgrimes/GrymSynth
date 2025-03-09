import { Pattern, ValidationResult, StorageOperationResult, SearchCriteria, HealthStatus } from './types';
export interface FeatureMemoryOptions {
    maxPatterns?: number;
    cacheSize?: number;
    recognitionThreshold?: number;
    persistenceEnabled?: boolean;
    healthCheckInterval?: number;
}
export declare class FeatureMemorySystem {
    private metrics;
    private recognizer;
    private storage;
    private healthMonitor;
    constructor(options?: FeatureMemoryOptions);
    recognizePattern(features: Map<string, any>): Promise<{
        systemMetrics: import("./types").FeatureMemoryMetrics;
        health: HealthStatus;
        success: true;
        matches: Pattern[];
        confidence: number;
        error?: undefined;
        metrics: import("./types").RecognitionMetrics;
    } | {
        systemMetrics: import("./types").FeatureMemoryMetrics;
        health: HealthStatus;
        success: false;
        matches: never[];
        error: string;
        errorType: "timeout" | "validation" | "processing";
        metrics: import("./types").RecognitionMetrics;
    }>;
    storePattern(pattern: Pattern): Promise<StorageOperationResult<ValidationResult>>;
    searchPatterns(criteria: SearchCriteria): Promise<StorageOperationResult<Pattern[]>>;
    getHealth(): Promise<HealthStatus>;
    private createHealthCheckPattern;
    destroy(): Promise<void>;
}
