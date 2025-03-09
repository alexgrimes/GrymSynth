import { LLMModel } from '../types';
export interface ModelProviderConfig {
    type: 'ollama' | 'lm-studio';
    id: string;
    name: string;
    modelName: string;
    endpoint: string;
    contextWindow: number;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
}
/**
 * Factory for creating model providers with appropriate configurations
 */
export declare class ModelProviderFactory {
    /**
     * Create a model provider instance
     */
    static createProvider(config: ModelProviderConfig): LLMModel;
    /**
     * Create multiple providers from configurations
     */
    static createProviders(configs: ModelProviderConfig[]): LLMModel[];
    /**
     * Get default configuration for a provider type
     */
    static getDefaultConfig(type: 'ollama' | 'lm-studio'): Partial<ModelProviderConfig>;
    /**
     * Create a provider with default configuration
     */
    static createDefaultProvider(type: 'ollama' | 'lm-studio', id: string, name: string, modelName: string): LLMModel;
    /**
     * Create common model combinations
     */
    static createModelChain(): {
        planner: LLMModel;
        executor: LLMModel;
        reviewer?: LLMModel;
        context?: LLMModel;
    };
    /**
     * Create a specialized model combination for a specific task type
     */
    static createSpecializedChain(taskType: 'code' | 'planning' | 'analysis'): {
        planner: LLMModel;
        executor: LLMModel;
        reviewer?: LLMModel;
        context?: LLMModel;
    };
}
