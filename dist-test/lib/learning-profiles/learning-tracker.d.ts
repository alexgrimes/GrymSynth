import { LearningInteraction, ProfileUpdateResult, MasteryLevel, LearningProfileStorage } from './types';
export declare class ModelLearningTracker {
    private storage;
    constructor(storage: LearningProfileStorage);
    private calculateConfidence;
    private calculateMastery;
    private findNewConnections;
    private calculateConnectionStrength;
    updateModelLearning(modelId: string, interaction: LearningInteraction): Promise<ProfileUpdateResult>;
    getModelAnalysis(modelId: string, domain: string): Promise<{
        confidence: number;
        mastery: MasteryLevel;
        exposures: number;
        lastAccessed: Date;
        relatedConcepts: string[];
        connections: {
            domain: string;
            strength: number;
        }[];
    } | null>;
    visualizeProfile(modelId: string): Promise<{
        domains: {
            name: string;
            confidence: number;
            mastery: MasteryLevel;
            connections: {
                to: string;
                strength: number;
            }[];
        }[];
        timeline: {
            timestamp: Date;
            domain: string;
            event: "interaction";
            details: {
                success: boolean;
                complexity: number | undefined;
            };
        }[];
    } | null>;
}
