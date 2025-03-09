export declare const AVAILABLE_MODELS: {
    readonly architect: "deepseek-r1:14b";
    readonly developer: "deepseek-r1:14b";
};
export type ChatRole = keyof typeof AVAILABLE_MODELS;
interface ChatOptions {
    stream?: boolean;
    temperature?: number;
}
export declare class DualModelChat {
    private makeRequest;
    getStreamingResponse(message: string, role: ChatRole, onChunk: (chunk: string) => void, options?: ChatOptions): Promise<void>;
    getResponse(message: string, role: ChatRole, options?: ChatOptions): Promise<string>;
}
export {};
