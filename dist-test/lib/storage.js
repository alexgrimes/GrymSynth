"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearChatHistory = exports.getChatHistory = exports.saveChatMessage = void 0;
const DB_NAME = 'audio-learning-hub';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
                const store = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
                store.createIndex('by-timestamp', 'timestamp');
            }
        };
    });
}
async function saveChatMessage(message) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
        const store = transaction.objectStore(MESSAGES_STORE);
        const request = store.put(message);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}
exports.saveChatMessage = saveChatMessage;
async function getChatHistory() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MESSAGES_STORE, 'readonly');
        const store = transaction.objectStore(MESSAGES_STORE);
        const index = store.index('by-timestamp');
        const request = index.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}
exports.getChatHistory = getChatHistory;
async function clearChatHistory() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
        const store = transaction.objectStore(MESSAGES_STORE);
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}
exports.clearChatHistory = clearChatHistory;
//# sourceMappingURL=storage.js.map