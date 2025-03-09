import type { ChatMessage } from '../types';
export interface StoredChat {
    id: string;
    messages: ChatMessage[];
    model: string;
    createdAt: number;
    updatedAt: number;
}
export declare class ChatStorage {
    private static instance;
    private readonly storageKey;
    private constructor();
    static getInstance(): ChatStorage;
    getAllChats(): StoredChat[];
    getChat(id: string): StoredChat | null;
    createChat(model: string): StoredChat;
    updateChat(id: string, messages: ChatMessage[], model: string): void;
    deleteChat(id: string): void;
    exportChat(id: string): string;
    private saveChats;
}
