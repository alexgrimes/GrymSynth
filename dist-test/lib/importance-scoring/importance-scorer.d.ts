import { ImportanceScorerConfig, Message, MessageImportance } from './types';
export declare class ImportanceScorer {
    private readonly weights;
    private readonly llmService;
    private readonly themeDetector;
    constructor(config: ImportanceScorerConfig);
    calculateImportance(messages: Message[], currentContext: string): Promise<MessageImportance[]>;
    private calculateScores;
    private calculateRecencyScore;
    private calculateRelevanceScore;
    private calculateInteractionScore;
    private calculateComplexityScore;
    private calculateThemeScore;
    private calculateKeyTermsScore;
    private calculateFinalScore;
    private countTechnicalTerms;
    private calculateStructuralComplexity;
    private calculateConceptualDensity;
    private extractKeyTerms;
}
