import React from 'react';
import { ResearchAssistantResult, KnowledgeMap, ResearchInsight, UserFeedback } from '@/lib/research-assistant/types';
import { LLMProvider } from '@/lib/llm/types';
interface ResearchContextType {
    analyzeConversation: (conversation: string, conversationId: string) => Promise<ResearchAssistantResult>;
    getVisualization: () => KnowledgeMap;
    getInsights: () => Promise<ResearchInsight[]>;
    getEmergingThemes: () => string[];
    incorporateFeedback: (feedback: UserFeedback) => void;
    lastAnalysis: ResearchAssistantResult | null;
    isAnalyzing: boolean;
}
interface ResearchProviderProps {
    children: React.ReactNode;
    llmProvider: LLMProvider;
}
export declare const ResearchProvider: React.FC<ResearchProviderProps>;
export declare const useResearch: () => ResearchContextType;
export {};
