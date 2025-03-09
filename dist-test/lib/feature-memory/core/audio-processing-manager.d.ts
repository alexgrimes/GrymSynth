import { ProjectManager } from './project-manager';
import { ModelHealthMonitor } from './model-health-monitor';
import { FeatureMemorySystem } from './feature-memory-system';
export interface AudioFile {
    id: string;
    path: string;
    size: number;
    format: string;
}
interface AudioPattern {
    id: string;
    features: Float32Array;
    frequency: number;
    confidence: number;
    timestamp: Date;
}
interface ProcessingResult {
    success: boolean;
    patterns: AudioPattern[];
    confidence: number;
    verificationScore: number;
    learningMetrics?: {
        patternRecognitionRate: number;
        knownPatternsCount: number;
        averageConfidence: number;
    };
}
/**
 * Manages the coordinated processing of audio files through multiple models
 * while maintaining system health and resource constraints.
 */
export declare class AudioProcessingManager {
    private projectManager;
    private healthMonitor;
    private featureMemory?;
    private knownPatterns;
    private patternRecognitionCount;
    private totalProcessingCount;
    constructor(projectManager: ProjectManager, healthMonitor: ModelHealthMonitor, featureMemory?: FeatureMemorySystem | undefined);
    /**
     * Process an audio file through the model chain and accumulate learning
     */
    processAudio(audioFile: AudioFile): Promise<ProcessingResult>;
    /**
     * Process multiple audio files in batch while learning from each
     */
    processBatch(audioFiles: AudioFile[]): Promise<ProcessingResult[]>;
    private analyzeAndLearnPatterns;
    private extractPatternsFromFeatures;
    private findSimilarPattern;
    private calculatePatternSimilarity;
    private calculateConfidence;
    private getLearningMetrics;
    /**
     * Verify system health is suitable for next processing step
     */
    private verifyHealthForNextStep;
    /**
     * Handle resource pressure during processing
     */
    private handleResourcePressure;
    /**
     * Handle processing errors
     */
    private handleProcessingError;
}
export {};
