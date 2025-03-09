import type { ChatMessage } from './types';
export declare class OllamaClient {
    chat({ messages, model }: {
        messages: ChatMessage[];
        model?: string;
    }): Promise<{
        content: any;
    }>;
    testConnection(model?: string): Promise<boolean>;
}
export declare const ollamaClient: OllamaClient;
