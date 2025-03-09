import { ThemeNode, Pattern, TimeRange } from './types';
export declare class ThemeGraph {
    private nodes;
    private readonly SIGNIFICANCE_THRESHOLD;
    private readonly EVOLUTION_THRESHOLD;
    constructor();
    addNode(concept: string): void;
    updateNode(concept: string, conversationId: string, related: string[]): void;
    private updateEvolutionMetrics;
    getEmergingThemes(): string[];
    private isSignificantTheme;
    findConnections(): Map<string, string[]>;
    findPatterns(timeRange?: TimeRange): Pattern[];
    private calculateEvolutionMetrics;
    private calculateConfidence;
    pruneInactiveThemes(threshold: number): void;
    getThemeDetails(concept: string): ThemeNode | undefined;
    getAllThemes(): string[];
}
