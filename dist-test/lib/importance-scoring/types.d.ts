export interface MessageImportance {
    scores: {
        recency: number;
        relevance: number;
        interaction: number;
        complexity: number;
        theme: number;
        keyTerms: number;
    };
    finalScore: number;
    mlScore?: number;
    confidence?: number;
}
export interface ImportanceScorerConfig {
    weights: {
        recency: number;
        relevance: number;
        interaction: number;
        complexity: number;
        theme: number;
        keyTerms: number;
    };
    llmService?: any;
    themeDetector?: any;
}
export interface Message {
    id: string;
    content: string;
    timestamp: Date;
    references?: string[];
    hasResponse?: boolean;
    participantCount?: number;
}
export interface MLModel {
    predict(features: number[]): Promise<number>;
    update(params: {
        features: number[];
        label: number;
        learningRate: number;
    }): Promise<void>;
    getConfidence(): Promise<number>;
}
export interface LearningMetrics {
    userActions: {
        messageViews: number;
        timeSpent: number;
        references: number;
        reactions: number;
    };
    contextualMetrics: {
        followupRate: number;
        influenceScore: number;
        themeAlignment: number;
    };
}
export interface HybridImportanceScorerConfig extends ImportanceScorerConfig {
    mlModel: MLModel;
    learningProfile: LearningProfile;
    initialMLWeight?: number;
    adaptationRate?: number;
    minConfidence?: number;
}
export interface LearningProfile {
    updateFromFeedback(feedback: {
        prediction: number;
        actual: number;
        features: number[];
    }): Promise<void>;
    getPerformanceMetrics(): Promise<{
        accuracy: number;
        confidence: number;
        learningRate: number;
    }>;
}
export interface HybridScoreVisualizerProps {
    message: Message;
    userScore: number;
    mlScore: number;
    confidence: number;
    weight: number;
}
export interface WeightConfiguratorProps {
    weights: ImportanceScorerConfig['weights'];
    onWeightChange: (key: keyof ImportanceScorerConfig['weights'], value: number) => void;
    mlWeight: number;
    onMLWeightChange: (value: number) => void;
}
export interface MLInsightsPanelProps {
    performanceMetrics: {
        accuracy: number;
        confidence: number;
        learningRate: number;
    };
    recentPredictions: Array<{
        predicted: number;
        actual: number;
        timestamp: Date;
    }>;
}
