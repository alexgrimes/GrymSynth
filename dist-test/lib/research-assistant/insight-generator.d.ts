import { ThemeGraph } from './theme-graph';
import { ResearchInsight } from './types';
import { LLMProvider } from '../llm/types';
export declare class ResearchInsightGenerator {
    private llmProvider;
    private themeGraph;
    constructor(llmProvider: LLMProvider, themeGraph: ThemeGraph);
    generateInsights(): Promise<ResearchInsight[]>;
    private prepareGraphData;
    private createAnalysisPrompt;
    private parseInsights;
    private validateInsights;
    private generateFallbackInsights;
    generateSuggestions(): Promise<string[]>;
}
