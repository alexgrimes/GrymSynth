"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.StorageManager = void 0;
const idb_1 = require("idb");
const nanoid_1 = require("nanoid");
class StorageManager {
    async initDB() {
        return (0, idb_1.openDB)('chat-db', 1, {
            upgrade(db) {
                // Create stores if they don't exist
                if (!db.objectStoreNames.contains('conversations')) {
                    db.createObjectStore('conversations', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messageStore.createIndex('byConversation', 'conversationId');
                }
            }
        });
    }
    async saveMessage(message) {
        const db = await this.initDB();
        await db.put('messages', message);
        // Update conversation timestamp
        const tx = db.transaction('conversations', 'readwrite');
        const store = tx.objectStore('conversations');
        const conversation = await store.get(message.conversationId);
        if (conversation) {
            conversation.updatedAt = Date.now();
            await store.put(conversation);
        }
    }
    async getMessages(conversationId) {
        const db = await this.initDB();
        return db.getAllFromIndex('messages', 'byConversation', conversationId);
    }
    // Alias for getMessages to maintain compatibility
    async getConversationMessages(conversationId) {
        return this.getMessages(conversationId);
    }
    async createConversation(title, models) {
        const db = await this.initDB();
        const conversation = {
            id: (0, nanoid_1.nanoid)(),
            title,
            models: {
                responder: models.responder,
                listener: models.listener,
                contexts: {} // Initialize empty contexts object
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await db.put('conversations', conversation);
        return conversation.id;
    }
    async updateModelContext(conversationId, modelName, context) {
        const db = await this.initDB();
        const tx = db.transaction('conversations', 'readwrite');
        const store = tx.objectStore('conversations');
        const conversation = await store.get(conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        // Ensure the contexts object exists
        if (!conversation.models.contexts) {
            conversation.models.contexts = {};
        }
        // Get existing context or create new one
        const existingContext = conversation.models.contexts[modelName] || {
            understanding: '',
            lastUpdated: 0,
            messagesSeen: []
        };
        // Merge the new context with existing context and ensure lastUpdated is set
        const updatedContext = {
            ...existingContext,
            ...context,
            lastUpdated: context.lastUpdated || Date.now() // Use provided lastUpdated or current timestamp
        };
        // Update the context for this model
        conversation.models.contexts[modelName] = updatedContext;
        conversation.updatedAt = Date.now();
        await store.put(conversation);
    }
}
exports.StorageManager = StorageManager;
exports.storage = new StorageManager();
//# sourceMappingURL=db.js.map