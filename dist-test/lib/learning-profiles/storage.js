"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDBLearningProfileStorage = void 0;
const idb_1 = require("idb");
class IndexedDBLearningProfileStorage {
    constructor() {
        this.DB_NAME = 'learning-profiles-db';
        this.VERSION = 1;
        this.db = this.initDB();
    }
    async initDB() {
        return (0, idb_1.openDB)(this.DB_NAME, this.VERSION, {
            upgrade(db) {
                // Create profiles store
                if (!db.objectStoreNames.contains('profiles')) {
                    db.createObjectStore('profiles', { keyPath: 'modelId' });
                }
                // Create interactions store with indexes
                if (!db.objectStoreNames.contains('interactions')) {
                    const interactionsStore = db.createObjectStore('interactions', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    interactionsStore.createIndex('by-model', 'modelId');
                    interactionsStore.createIndex('by-timestamp', 'timestamp');
                }
            }
        });
    }
    async saveProfile(profile) {
        const db = await this.db;
        await db.put('profiles', profile);
    }
    async loadProfile(modelId) {
        const db = await this.db;
        const profile = await db.get('profiles', modelId);
        return profile || null; // Convert undefined to null
    }
    async listProfiles() {
        const db = await this.db;
        const keys = await db.getAllKeys('profiles');
        return keys;
    }
    async deleteProfile(modelId) {
        const db = await this.db;
        await db.delete('profiles', modelId);
        // Also delete associated interactions
        const interactionKeys = await db.getAllKeysFromIndex('interactions', 'by-model', modelId);
        await Promise.all(interactionKeys.map(key => db.delete('interactions', key)));
    }
    async saveInteraction(modelId, interaction) {
        const db = await this.db;
        const interactionWithId = {
            ...interaction,
            modelId,
            id: `${modelId}-${Date.now()}`
        };
        await db.add('interactions', interactionWithId);
    }
    async getInteractions(modelId, limit) {
        const db = await this.db;
        const interactions = await db.getAllFromIndex('interactions', 'by-model', modelId);
        // Sort by timestamp descending and apply limit
        interactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return limit ? interactions.slice(0, limit) : interactions;
    }
    // Helper method to clear all data (useful for testing)
    async clearAll() {
        const db = await this.db;
        await Promise.all([
            db.clear('profiles'),
            db.clear('interactions')
        ]);
    }
    // Helper method to export all data (useful for backup/debugging)
    async exportData() {
        const db = await this.db;
        const profiles = await db.getAll('profiles');
        const interactions = await db.getAll('interactions');
        return {
            profiles,
            interactions
        };
    }
    // Helper method to import data (useful for restoration/migration)
    async importData(data) {
        await this.clearAll();
        const db = await this.db;
        await Promise.all([
            ...data.profiles.map(profile => db.put('profiles', profile)),
            ...data.interactions.map(interaction => db.add('interactions', interaction))
        ]);
    }
}
exports.IndexedDBLearningProfileStorage = IndexedDBLearningProfileStorage;
//# sourceMappingURL=storage.js.map