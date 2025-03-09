import { ModelLearningProfile, LearningInteraction, LearningProfileStorage } from './types';
export declare class IndexedDBLearningProfileStorage implements LearningProfileStorage {
    private db;
    private readonly DB_NAME;
    private readonly VERSION;
    constructor();
    private initDB;
    saveProfile(profile: ModelLearningProfile): Promise<void>;
    loadProfile(modelId: string): Promise<ModelLearningProfile | null>;
    listProfiles(): Promise<string[]>;
    deleteProfile(modelId: string): Promise<void>;
    saveInteraction(modelId: string, interaction: LearningInteraction): Promise<void>;
    getInteractions(modelId: string, limit?: number): Promise<LearningInteraction[]>;
    clearAll(): Promise<void>;
    exportData(): Promise<{
        profiles: ModelLearningProfile[];
        interactions: LearningInteraction[];
    }>;
    importData(data: {
        profiles: ModelLearningProfile[];
        interactions: LearningInteraction[];
    }): Promise<void>;
}
