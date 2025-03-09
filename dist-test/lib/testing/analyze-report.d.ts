interface AnalysisResult {
    peakMemory: number;
    averageMemory: number;
    memoryGrowth: number;
    leakProbability: string;
    recommendations: string[];
    modelStats: {
        [modelId: string]: {
            loadTime: number;
            unloadTime: number;
            peakMemory: number;
            memoryRetained: number;
        };
    };
}
export declare class MemoryAnalyzer {
    private static readonly LEAK_THRESHOLD;
    private static readonly REPORTS_DIR;
    static analyzeResults(): Promise<AnalysisResult>;
    private static analyzeMemoryPatterns;
    private static generateRecommendations;
    private static saveAnalysis;
    private static generateHtmlReport;
    private static formatBytes;
    private static formatTimestamp;
}
export {};
