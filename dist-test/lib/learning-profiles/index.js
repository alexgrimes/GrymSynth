"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importLearningData = exports.exportLearningData = exports.deleteProfile = exports.listProfiles = exports.visualizeProfile = exports.getModelAnalysis = exports.recordInteraction = exports.initializeProfile = void 0;
const learning_tracker_1 = require("./learning-tracker");
const storage_1 = require("./storage");
// Create a singleton instance of the storage
const storage = new storage_1.IndexedDBLearningProfileStorage();
// Create a singleton instance of the learning tracker
const learningTracker = new learning_tracker_1.ModelLearningTracker(storage);
/**
 * Initialize a new learning profile for a model
 */
async function initializeProfile(modelId, specialization) {
    const profile = {
        modelId,
        specialization,
        learningState: {
            domains: new Map(),
            crossDomainConnections: new Map()
        },
        contextPreferences: {
            retentionPriority: [],
            summarizationThreshold: 1000,
            specializedPrompts: new Map()
        }
    };
    await storage.saveProfile(profile);
    return profile;
}
exports.initializeProfile = initializeProfile;
/**
 * Record a new learning interaction for a model
 */
async function recordInteraction(modelId, interaction) {
    const fullInteraction = {
        ...interaction,
        timestamp: new Date()
    };
    return learningTracker.updateModelLearning(modelId, fullInteraction);
}
exports.recordInteraction = recordInteraction;
/**
 * Get a model's current understanding of a specific domain
 */
async function getModelAnalysis(modelId, domain) {
    return learningTracker.getModelAnalysis(modelId, domain);
}
exports.getModelAnalysis = getModelAnalysis;
/**
 * Get a visualization of a model's learning profile
 */
async function visualizeProfile(modelId) {
    return learningTracker.visualizeProfile(modelId);
}
exports.visualizeProfile = visualizeProfile;
/**
 * List all available model profiles
 */
async function listProfiles() {
    return storage.listProfiles();
}
exports.listProfiles = listProfiles;
/**
 * Delete a model's learning profile and all associated data
 */
async function deleteProfile(modelId) {
    return storage.deleteProfile(modelId);
}
exports.deleteProfile = deleteProfile;
/**
 * Export all learning profile data (useful for backup/migration)
 */
async function exportLearningData() {
    return storage.exportData();
}
exports.exportLearningData = exportLearningData;
/**
 * Import learning profile data
 */
async function importLearningData(data) {
    return storage.importData(data);
}
exports.importLearningData = importLearningData;
//# sourceMappingURL=index.js.map