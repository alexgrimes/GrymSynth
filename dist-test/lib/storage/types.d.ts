export interface ModelContext {
    understanding: string;
    lastUpdated: number;
    messagesSeen: number[];
}
export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    models: {
        responder: string;
        listener: string;
        contexts: {
            [modelName: string]: ModelContext;
        };
    };
}
export interface Message {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    model?: string;
}
