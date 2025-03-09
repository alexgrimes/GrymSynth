"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelProviderFactory = void 0;
const ollama_provider_1 = require("./ollama-provider");
const lm_studio_provider_1 = require("./lm-studio-provider");
/**
 * Factory for creating model providers with appropriate configurations
 */
class ModelProviderFactory {
    /**
     * Create a model provider instance
     */
    static createProvider(config) {
        switch (config.type) {
            case 'ollama':
                return new ollama_provider_1.OllamaProvider(config.id, config.name, config.contextWindow, {
                    modelName: config.modelName,
                    endpoint: config.endpoint,
                    contextWindow: config.contextWindow,
                    temperature: config.temperature,
                    topP: config.topP,
                    maxTokens: config.maxTokens
                });
            case 'lm-studio':
                return new lm_studio_provider_1.LMStudioProvider(config.id, config.name, config.contextWindow, {
                    modelName: config.modelName,
                    endpoint: config.endpoint,
                    contextWindow: config.contextWindow,
                    temperature: config.temperature,
                    topP: config.topP,
                    maxTokens: config.maxTokens
                });
            default:
                throw new Error(`Unknown provider type: ${config.type}`);
        }
    }
    /**
     * Create multiple providers from configurations
     */
    static createProviders(configs) {
        return configs.map(config => this.createProvider(config));
    }
    /**
     * Get default configuration for a provider type
     */
    static getDefaultConfig(type) {
        switch (type) {
            case 'ollama':
                return {
                    type: 'ollama',
                    endpoint: 'http://localhost:11434',
                    contextWindow: 32768,
                    temperature: 0.7,
                    topP: 0.9
                };
            case 'lm-studio':
                return {
                    type: 'lm-studio',
                    endpoint: 'http://localhost:1234',
                    contextWindow: 32768,
                    temperature: 0.7,
                    topP: 0.9
                };
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }
    /**
     * Create a provider with default configuration
     */
    static createDefaultProvider(type, id, name, modelName) {
        const defaultConfig = this.getDefaultConfig(type);
        return this.createProvider({
            ...defaultConfig,
            id,
            name,
            modelName
        });
    }
    /**
     * Create common model combinations
     */
    static createModelChain() {
        return {
            // DeepSeek for planning due to strong reasoning
            planner: this.createDefaultProvider('ollama', 'deepseek-r1', 'DeepSeek R-1', 'deepseek-1b'),
            // DeepSeek Coder for code generation
            executor: this.createDefaultProvider('ollama', 'deepseek-coder', 'DeepSeek Coder', 'deepseek-coder'),
            // Mistral for code review
            reviewer: this.createDefaultProvider('lm-studio', 'mistral', 'Mistral', 'mistral'),
            // Qwen for context management
            context: this.createDefaultProvider('ollama', 'qwen-context', 'Qwen Context', 'qwen-1b')
        };
    }
    /**
     * Create a specialized model combination for a specific task type
     */
    static createSpecializedChain(taskType) {
        switch (taskType) {
            case 'code':
                return {
                    planner: this.createDefaultProvider('ollama', 'deepseek-r1', 'DeepSeek R-1', 'deepseek-1b'),
                    executor: this.createDefaultProvider('ollama', 'codellama', 'CodeLlama', 'codellama'),
                    reviewer: this.createDefaultProvider('lm-studio', 'wizardcoder', 'WizardCoder', 'wizardcoder')
                };
            case 'planning':
                return {
                    planner: this.createDefaultProvider('lm-studio', 'neural-chat', 'Neural Chat', 'neural-chat'),
                    executor: this.createDefaultProvider('ollama', 'deepseek-r1', 'DeepSeek R-1', 'deepseek-1b'),
                    context: this.createDefaultProvider('ollama', 'qwen-context', 'Qwen Context', 'qwen-1b')
                };
            case 'analysis':
                return {
                    planner: this.createDefaultProvider('ollama', 'deepseek-r1', 'DeepSeek R-1', 'deepseek-1b'),
                    executor: this.createDefaultProvider('lm-studio', 'mistral', 'Mistral', 'mistral'),
                    reviewer: this.createDefaultProvider('ollama', 'qwen-analysis', 'Qwen Analysis', 'qwen-1b')
                };
            default:
                return this.createModelChain();
        }
    }
}
exports.ModelProviderFactory = ModelProviderFactory;
//# sourceMappingURL=model-provider-factory.js.map