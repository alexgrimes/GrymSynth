"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatStorage = void 0;
class ChatStorage {
    constructor() {
        this.storageKey = 'audio-learning-hub-chats';
        // Private constructor to enforce singleton
    }
    static getInstance() {
        if (!ChatStorage.instance) {
            ChatStorage.instance = new ChatStorage();
        }
        return ChatStorage.instance;
    }
    getAllChats() {
        try {
            const chatsJson = localStorage.getItem(this.storageKey);
            if (!chatsJson)
                return [];
            const chats = JSON.parse(chatsJson);
            return Array.isArray(chats) ? chats : [];
        }
        catch (error) {
            console.error('Error loading chats:', error);
            return [];
        }
    }
    getChat(id) {
        const chats = this.getAllChats();
        return chats.find(chat => chat.id === id) ?? null;
    }
    createChat(model) {
        const now = Date.now();
        const newChat = {
            id: now.toString(),
            messages: [],
            model,
            createdAt: now,
            updatedAt: now,
        };
        const chats = this.getAllChats();
        chats.unshift(newChat);
        this.saveChats(chats);
        return newChat;
    }
    updateChat(id, messages, model) {
        const chats = this.getAllChats();
        const index = chats.findIndex(chat => chat.id === id);
        if (index !== -1) {
            chats[index] = {
                ...chats[index],
                messages,
                model,
                updatedAt: Date.now(),
            };
            this.saveChats(chats);
        }
    }
    deleteChat(id) {
        const chats = this.getAllChats();
        const filteredChats = chats.filter(chat => chat.id !== id);
        this.saveChats(filteredChats);
    }
    exportChat(id) {
        const chat = this.getChat(id);
        if (!chat)
            throw new Error(`Chat not found: ${id}`);
        return JSON.stringify(chat, null, 2);
    }
    saveChats(chats) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(chats));
        }
        catch (error) {
            console.error('Error saving chats:', error);
        }
    }
}
exports.ChatStorage = ChatStorage;
//# sourceMappingURL=chat-storage.js.map