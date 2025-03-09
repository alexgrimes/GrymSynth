"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextStorageAdapter = void 0;
const idb_1 = require("idb");
const types_1 = require("./types");
/**
 * Handles persistent storage of model contexts using IndexedDB
 */
class ContextStorageAdapter {
    constructor() {
        this.db = null;
        this.DB_NAME = 'specialized-context-db';
        this.DB_VERSION = 1;
    }
    /**
     * Initialize the IndexedDB database
     */
    async init() {
        try {
            this.db = await (0, idb_1.openDB)(this.DB_NAME, this.DB_VERSION, {
                upgrade(db) {
                    const store = db.createObjectStore('modelContexts', {
                        keyPath: 'modelId'
                    });
                    store.createIndex('by-platform', 'platform');
                    store.createIndex('by-lastUsed', 'lastUsed');
                }
            });
        }
        catch (error) {
            console.error('Failed to initialize context storage:', error);
            throw new Error(types_1.ContextError.STORAGE_ERROR);
        }
    }
    /**
     * Store context for a specific model
     */
    async saveModelContext(context) {
        if (!this.db) {
            await this.init();
        }
        try {
            await this.db.put('modelContexts', {
                ...context,
                version: context.version || 1
            });
        }
        catch (error) {
            console.error('Failed to save model context:', error);
            throw new Error(types_1.ContextError.STORAGE_ERROR);
        }
    }
    /**
     * Retrieve context for a specific model
     */
    async getModelContext(modelId) {
        if (!this.db) {
            await this.init();
        }
        try {
            const result = await this.db.get('modelContexts', modelId);
            return result || null; // Convert undefined to null
        }
        catch (error) {
            console.error('Failed to retrieve model context:', error);
            throw new Error(types_1.ContextError.STORAGE_ERROR);
        }
    }
    /**
     * Get all contexts for a specific platform
     */
    async getContextsByPlatform(platform) {
        if (!this.db) {
            await this.init();
        }
        try {
            return await this.db.getAllFromIndex('modelContexts', 'by-platform', platform);
        }
        catch (error) {
            console.error('Failed to retrieve contexts by platform:', error);
            throw new Error(types_1.ContextError.STORAGE_ERROR);
        }
    }
    /**
     * Delete context for a specific model
     */
    async deleteModelContext(modelId) {
        if (!this.db) {
            await this.init();
        }
        try {
            await this.db.delete('modelContexts', modelId);
        }
        catch (error) {
            console.error('Failed to delete model context:', error);
            throw new Error(types_1.ContextError.STORAGE_ERROR);
        }
    }
    /**
     * Clean up old contexts based on last used timestamp
     */
    async cleanupOldContexts(maxAge) {
        if (!this.db) {
            await this.init();
        }
        const cutoff = Date.now() - maxAge;
        const tx = this.db.transaction('modelContexts', 'readwrite');
        const index = tx.store.index('by-lastUsed');
        let cursor = await index.openCursor();
        while (cursor) {
            if (cursor.value.lastUsed < cutoff) {
                await cursor.delete();
            }
            cursor = await cursor.continue();
        }
    }
    /**
     * Close the database connection
     */
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
exports.ContextStorageAdapter = ContextStorageAdapter;
//# sourceMappingURL=storage.js.map