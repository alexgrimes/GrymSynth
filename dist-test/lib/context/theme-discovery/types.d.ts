export interface ThemeNode {
    occurrences: number;
    relatedConcepts: Map<string, number>;
    firstSeen: Date;
    lastSeen: Date;
    conversations: Set<string>;
    evolution: {
        branches: Map<string, string[]>;
        depth: number;
        breadth: number;
    };
}
export interface ThemeAnalysis {
    concepts: Array<{
        name: string;
        related: string[];
        depth: number;
    }>;
    patterns: {
        recurring: string[];
        emerging: string[];
    };
}
export interface EvolutionMetrics {
    depth: number;
    breadth: number;
    velocity: number;
    stability: number;
}
export interface Pattern {
    theme: string;
    confidence: number;
    relatedThemes: string[];
    metrics: EvolutionMetrics;
}
export interface TrendPrediction {
    theme: string;
    predictedGrowth: number;
    relatedTrends: string[];
    confidence: number;
}
export type TimeRange = {
    start: Date;
    end: Date;
};
