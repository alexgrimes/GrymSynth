import { FeatureMemorySystem } from './feature-memory-system';
import { Pattern, StorageOperationResult, ValidationResult, PatternMetadata } from './types';
export interface AudioPattern extends Pattern {
    features: Map<string, string | number[]>;
    metadata: PatternMetadata & {
        timestamp: string;
        frequency: number;
        duration: number;
    };
}
export interface KnowledgeBase {
    patterns: Map<string, AudioPattern>;
    relationshipGraph: Map<string, Set<string>>;
    confidenceScores: Map<string, number>;
}
export interface LearningMetrics {
    totalPatternsLearned: number;
    averageConfidence: number;
    recognitionRate: number;
    lastUpdated: string;
}
export interface LearningContext {
    patterns: AudioPattern[];
    knowledgeBase: KnowledgeBase;
    learningProgress: LearningMetrics;
}
export declare class AudioLearningManager {
    private featureMemory;
    private context;
    constructor(featureMemory: FeatureMemorySystem);
    private initializeContext;
    preserveContext(modelId: string): Promise<StorageOperationResult<ValidationResult>>;
    retrieveContext(modelId: string): Promise<LearningContext>;
    accumulatePattern(fftData: Float32Array, metadata: Omit<AudioPattern['metadata'], 'lastUpdated' | 'category'>): Promise<void>;
    recognizePattern(fftData: Float32Array): Promise<AudioPattern | null>;
    private updateLearningMetrics;
    getContext(): LearningContext;
    getLearningProgress(): LearningMetrics;
}
