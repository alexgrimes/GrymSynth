import { ThemeAnalysis } from './types';
export declare class ThemeAnalyzer {
    private llmProvider;
    constructor(model?: string);
    /**
     * Analyze themes from a text input
     */
    analyzeThemes(text: string): Promise<Set<string>>;
    analyzeConversation(content: string): Promise<ThemeAnalysis>;
    private parseAnalysis;
    private validateAndNormalizeAnalysis;
    private normalizeConceptName;
    private normalizeDepth;
    batchAnalyze(conversations: Array<{
        id: string;
        content: string;
    }>): Promise<Map<string, ThemeAnalysis>>;
}
