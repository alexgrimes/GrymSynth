import type { ModelLearningProfile, LearningInteraction, ProfileUpdateResult, ModelSpecialization, MasteryLevel, ProfileVisualization } from './types';
/**
 * Initialize a new learning profile for a model
 */
export declare function initializeProfile(modelId: string, specialization: ModelSpecialization): Promise<ModelLearningProfile>;
/**
 * Record a new learning interaction for a model
 */
export declare function recordInteraction(modelId: string, interaction: Omit<LearningInteraction, 'timestamp'>): Promise<ProfileUpdateResult>;
/**
 * Get a model's current understanding of a specific domain
 */
export declare function getModelAnalysis(modelId: string, domain: string): Promise<{
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
/**
 * Get a visualization of a model's learning profile
 */
export declare function visualizeProfile(modelId: string): Promise<ProfileVisualization | null>;
/**
 * List all available model profiles
 */
export declare function listProfiles(): Promise<string[]>;
/**
 * Delete a model's learning profile and all associated data
 */
export declare function deleteProfile(modelId: string): Promise<void>;
/**
 * Export all learning profile data (useful for backup/migration)
 */
export declare function exportLearningData(): Promise<{
    profiles: ModelLearningProfile[];
    interactions: LearningInteraction[];
}>;
/**
 * Import learning profile data
 */
export declare function importLearningData(data: Awaited<ReturnType<typeof exportLearningData>>): Promise<void>;
export type { ModelLearningProfile, LearningInteraction, ProfileUpdateResult, ModelSpecialization, MasteryLevel, ProfileVisualization };
