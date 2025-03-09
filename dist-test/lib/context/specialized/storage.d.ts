import { ModelContextStorage } from './types';
/**
 * Handles persistent storage of model contexts using IndexedDB
 */
export declare class ContextStorageAdapter {
    private db;
    private readonly DB_NAME;
    private readonly DB_VERSION;
    /**
     * Initialize the IndexedDB database
     */
    init(): Promise<void>;
    /**
     * Store context for a specific model
     */
    saveModelContext(context: ModelContextStorage): Promise<void>;
    /**
     * Retrieve context for a specific model
     */
    getModelContext(modelId: string): Promise<ModelContextStorage | null>;
    /**
     * Get all contexts for a specific platform
     */
    getContextsByPlatform(platform: string): Promise<ModelContextStorage[]>;
    /**
     * Delete context for a specific model
     */
    deleteModelContext(modelId: string): Promise<void>;
    /**
     * Clean up old contexts based on last used timestamp
     */
    cleanupOldContexts(maxAge: number): Promise<void>;
    /**
     * Close the database connection
     */
    close(): Promise<void>;
}
