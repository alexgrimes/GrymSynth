import { LLMProvider, LLMConfig } from './types';
export declare class SequentialChat {
    private providers;
    private activeProvider;
    private conversationHistory;
    constructor(providers: {
        [key: string]: LLMProvider;
    });
    setActiveProvider(providerKey: string): void;
    getResponse(message: string, config?: LLMConfig): Promise<string>;
    streamResponse(message: string, config?: LLMConfig): AsyncGenerator<any, void, unknown>;
    getConversationHistory(): ChatMessage[];
    clearHistory(): void;
}
