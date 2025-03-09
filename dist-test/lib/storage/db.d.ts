import { Message, ModelContext } from './types';
export declare class StorageManager {
    private initDB;
    saveMessage(message: Message): Promise<void>;
    getMessages(conversationId: string): Promise<Message[]>;
    getConversationMessages(conversationId: string): Promise<Message[]>;
    createConversation(title: string, models: {
        responder: string;
        listener: string;
    }): Promise<string>;
    updateModelContext(conversationId: string, modelName: string, context: Partial<ModelContext>): Promise<void>;
}
export declare const storage: StorageManager;
