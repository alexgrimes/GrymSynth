import { Conversation, Message } from '../storage/types';
import { StorageManager } from '../storage/db';
export declare class MessageHandler {
    private storage;
    private sequentialChat;
    constructor(storage: StorageManager);
    processNewMessage(conversation: Conversation, content: string, role: 'user' | 'assistant'): Promise<void>;
    private saveMessage;
    private updateListenerContext;
    private getResponderReply;
    addSystemMessage(conversationId: string, content: string): Promise<Message>;
}
