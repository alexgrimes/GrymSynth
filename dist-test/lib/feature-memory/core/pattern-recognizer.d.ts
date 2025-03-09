import { ValidationResult, HealthStatus, Pattern, RecognitionMetrics } from './types';
declare global {
    interface Global {
        gc?: () => void;
    }
}
interface RecognitionOptions {
    threshold: number;
    maxPatterns: number;
    timeout: number;
    cacheSize: number;
    cacheExpiration: number;
    healthCheckInterval: number;
    chunkSize: number;
}
interface BaseRecognitionResult {
    success: boolean;
    metrics: RecognitionMetrics;
    health: HealthStatus;
}
interface SuccessfulRecognitionResult extends BaseRecognitionResult {
    success: true;
    matches: Pattern[];
    confidence: number;
    error?: never;
}
interface FailedRecognitionResult extends BaseRecognitionResult {
    success: false;
    matches: never[];
    error: string;
    errorType: 'validation' | 'timeout' | 'processing';
}
type RecognitionResult = SuccessfulRecognitionResult | FailedRecognitionResult;
export declare class PatternRecognizer {
    private patterns;
    private cache;
    private metrics;
    private healthMonitor;
    private readonly options;
    private cleanupInterval;
    private healthCheckInterval;
    private featureIndex;
    private recentLatencies;
    private readonly maxLatencyHistory;
    private static readonly DEFAULT_OPTIONS;
    constructor(options?: Partial<RecognitionOptions>);
    private initializeIntervals;
    private clearIntervals;
    recognizePatterns(features: Map<string, any>): Promise<RecognitionResult>;
    private recordLatency;
    private cleanupLatencyHistory;
    addPattern(pattern: Omit<Pattern, 'id'>): Promise<ValidationResult>;
    private indexPattern;
    private getIndexValue;
    private findCandidatePatterns;
    private findMatchesInCandidates;
    private validatePattern;
    private updateHealthStatus;
    private cleanupResources;
    private calculateSimilarity;
    private calculateStringSimularity;
    private compareFeatureValues;
    private getFeatureWeight;
    private wrapError;
    private generatePatternId;
    private generateCacheKey;
    private evictLeastRecentlyUsed;
    destroy(): void;
}
export {};
