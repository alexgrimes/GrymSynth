import { ResearchAssistantResult, KnowledgeMap, ResearchInsight, UserFeedback } from './types';
import { LLMProvider } from '../llm/types';
export declare class ResearchAssistant {
    private themeGraph;
    private insightGenerator;
    constructor(llmProvider: LLMProvider);
    analyzeConversation(conversation: string, conversationId: string): Promise<ResearchAssistantResult>;
    private extractThemes;
    incorporateFeedback(feedback: UserFeedback): void;
    getEmergingThemes(): string[];
    getInsights(): Promise<ResearchInsight[]>;
    getVisualization(): KnowledgeMap;
}
