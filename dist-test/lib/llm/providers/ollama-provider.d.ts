import { LLMProvider } from '../types';
export declare class OllamaProvider implements LLMProvider {
    name: string;
    endpoint: string;
    private model;
    private context;
    constructor(model: string);
    getResponse(prompt: string): Promise<string>;
    streamResponse(prompt: string): AsyncGenerator<StreamResponse, void, unknown>;
    clearContext(): void;
}
