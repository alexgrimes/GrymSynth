import { LLMProvider } from '../types';
export declare class LMStudioProvider implements LLMProvider {
    name: string;
    endpoint: string;
    private model;
    constructor(model: string);
    getResponse(prompt: string): Promise<string>;
    streamResponse(prompt: string): AsyncGenerator<{
        model: string;
        created_at: string;
        response: any;
        done: boolean;
    }, void, unknown>;
}
