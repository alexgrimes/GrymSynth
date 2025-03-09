import { Pattern, TimeRange } from './types';
export interface ThemeDiscoveryResult {
    newThemes: string[];
    evolvedThemes: Map<string, string[]>;
    connections: Map<string, string[]>;
}
export declare class DynamicThemeDiscovery {
    private themeGraph;
    private analyzer;
    private readonly PRUNE_THRESHOLD;
    constructor(llmModel?: string);
    analyzeConversation(content: string, conversationId: string): Promise<ThemeDiscoveryResult>;
    private updateThemeGraph;
    private findEmergingPatterns;
    batchAnalyzeConversations(conversations: Array<{
        id: string;
        content: string;
    }>): Promise<ThemeDiscoveryResult>;
    findPatterns(timeRange?: TimeRange): Pattern[];
    getThemeDetails(theme: string): import("./types").ThemeNode | undefined;
    getAllThemes(): string[];
    pruneInactiveThemes(): void;
    getDiscoveryStatus(): {
        totalThemes: number;
        activeThemes: string[];
        topConnections: Array<[string, string[]]>;
    };
}
