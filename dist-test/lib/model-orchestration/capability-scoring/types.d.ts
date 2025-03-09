export interface PerformanceMetrics {
    successRate: number;
    latency: number;
    resourceUsage: number;
}
export interface CapabilityScore {
    modelId: string;
    capabilities: Map<string, number>;
    performanceMetrics: PerformanceMetrics;
}
export interface PerformanceRecord {
    timestamp: number;
    latency: number;
    resourceUsage: number;
    success: boolean;
}
export interface ModelCapabilityData {
    records: PerformanceRecord[];
    aggregateScore: number;
    lastUpdated: number;
}
export interface ScoringConfig {
    decayFactor: number;
    timeWindow: number;
    minSamples: number;
    weightFactors: {
        successRate: number;
        latency: number;
        resourceUsage: number;
    };
}
