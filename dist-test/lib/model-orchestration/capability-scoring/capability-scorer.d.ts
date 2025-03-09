import { CapabilityScore, ScoringConfig } from './types';
export declare class CapabilityScorer {
    private modelData;
    private readonly config;
    constructor(config?: Partial<ScoringConfig>);
    recordSuccess(modelId: string, capability: string, metrics: {
        latency: number;
        resourceUsage?: number;
    }): Promise<void>;
    recordFailure(modelId: string, capability: string, metrics: {
        latency: number;
        resourceUsage?: number;
    }): Promise<void>;
    getCapabilityScore(modelId: string, capability: string): Promise<number>;
    getModelScores(modelId: string): Promise<CapabilityScore>;
    private recordPerformance;
    private updateScore;
    private calculatePerformanceMetrics;
    private calculateAggregateScore;
    private calculateAverageLatency;
    private calculateAverageResourceUsage;
    private pruneOldRecords;
    private getModelCapabilityData;
    private getOrCreateModelCapabilityData;
}
