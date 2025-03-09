import { ResourceManager } from './resource-manager';
import { LLMProvider } from '../../types';
import { Message } from './types';
export declare class ProviderResourceManager extends ResourceManager {
    private providers;
    private maxTokensPerModel;
    constructor(config: any);
    registerProvider(id: string, provider: LLMProvider): Promise<void>;
    processMessage(providerId: string, message: Message): Promise<string>;
    switchProvider(fromId: string, toId: string): Promise<void>;
    cleanup(): Promise<void>;
    private estimateTokenCount;
}
