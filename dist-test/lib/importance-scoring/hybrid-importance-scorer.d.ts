import { ImportanceScorer } from './importance-scorer';
import { HybridImportanceScorerConfig, Message, MessageImportance } from './types';
export declare class HybridImportanceScorer extends ImportanceScorer {
    private readonly mlModel;
    private readonly learningProfile;
    private readonly initialMLWeight;
    private readonly adaptationRate;
    private readonly minConfidence;
    private currentMLWeight;
    constructor(config: HybridImportanceScorerConfig);
    calculateImportance(messages: Message[], currentContext: string): Promise<MessageImportance[]>;
    private calculateMLScore;
    private extractFeatures;
    private collectMetrics;
    private calculateAdaptiveWeight;
    private combineScores;
    provideFeedback(feedback: {
        messageId: string;
        userScore: number;
        actualImportance: number;
    }): Promise<void>;
    private getMessage;
}
