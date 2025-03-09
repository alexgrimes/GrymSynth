interface ChatHistory {
    provider: string;
    message: string;
    response: string;
    timestamp: string;
}
export declare class SequentialChat {
    private ollamaProvider;
    private lmStudioProvider;
    private currentProvider;
    private history;
    constructor();
    switchProvider(providerName: 'ollama' | 'lmstudio'): Promise<void>;
    private checkAvailability;
    chat(message: string): Promise<string>;
    private ollamaChat;
    private lmStudioChat;
    clearContext(): void;
    getHistory(): {
        messages: ChatHistory[];
        summary: {
            totalMessages: number;
            byProvider: Record<string, number>;
        };
    };
}
export declare function runTest(): Promise<void>;
export {};
