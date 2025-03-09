import React, { createContext, useContext, useCallback, useState } from 'react';
import { ResearchAssistant } from '@/lib/research-assistant/research-assistant';
import { 
  ResearchAssistantResult, 
  KnowledgeMap, 
  ResearchInsight,
  UserFeedback 
} from '@/lib/research-assistant/types';
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

const ResearchContext = createContext<ResearchContextType | null>(null);

interface ResearchProviderProps {
  children: React.ReactNode;
  llmProvider: LLMProvider;
}

export const ResearchProvider: React.FC<ResearchProviderProps> = ({ 
  children,
  llmProvider
}) => {
  const [researchAssistant] = useState(() => new ResearchAssistant(llmProvider));
  const [lastAnalysis, setLastAnalysis] = useState<ResearchAssistantResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeConversation = useCallback(async (
    conversation: string,
    conversationId: string
  ) => {
    setIsAnalyzing(true);
    try {
      const result = await researchAssistant.analyzeConversation(conversation, conversationId);
      setLastAnalysis(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [researchAssistant]);

  const getVisualization = useCallback(() => {
    return researchAssistant.getVisualization();
  }, [researchAssistant]);

  const getInsights = useCallback(async () => {
    return researchAssistant.getInsights();
  }, [researchAssistant]);

  const getEmergingThemes = useCallback(() => {
    return researchAssistant.getEmergingThemes();
  }, [researchAssistant]);

  const incorporateFeedback = useCallback((feedback: UserFeedback) => {
    researchAssistant.incorporateFeedback(feedback);
  }, [researchAssistant]);

  const value = {
    analyzeConversation,
    getVisualization,
    getInsights,
    getEmergingThemes,
    incorporateFeedback,
    lastAnalysis,
    isAnalyzing
  };

  return (
    <ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>
  );
};

export const useResearch = () => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
};