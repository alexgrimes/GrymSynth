"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = void 0;
const idb_1 = require("idb");
const initDB = () => (0, idb_1.openDB)('audio-learning-hub', 1, {
    upgrade(db) {
        // Resources store
        const resourceStore = db.createObjectStore('resources', {
            keyPath: 'id'
        });
        resourceStore.createIndex('by-category', 'category');
        resourceStore.createIndex('by-difficulty', 'metadata.difficulty');
        // Notes store
        const noteStore = db.createObjectStore('notes', {
            keyPath: 'resourceId'
        });
        noteStore.createIndex('by-resource', 'resourceId');
        // Progress store
        const progressStore = db.createObjectStore('progress', {
            keyPath: 'resourceId'
        });
        progressStore.createIndex('by-resource', 'resourceId');
    }
});
exports.initDB = initDB;
//# sourceMappingURL=db.js.map