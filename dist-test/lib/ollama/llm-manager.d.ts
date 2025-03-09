interface StreamChunk {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
}
export declare class LLMManager {
    private currentModel;
    private context;
    setActiveModel(model: string): void;
    getResponse(prompt: string): Promise<string>;
    generateStreamingResponse(prompt: string): AsyncGenerator<StreamChunk, void, unknown>;
    clearContext(): void;
}
export {};
