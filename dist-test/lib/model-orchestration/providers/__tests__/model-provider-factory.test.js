"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_provider_factory_1 = require("../model-provider-factory");
const ollama_provider_1 = require("../ollama-provider");
const lm_studio_provider_1 = require("../lm-studio-provider");
describe('ModelProviderFactory', () => {
    describe('createProvider', () => {
        it('should create an Ollama provider with correct configuration', () => {
            const config = {
                type: 'ollama',
                id: 'test-ollama',
                name: 'Test Ollama',
                modelName: 'deepseek-coder',
                endpoint: 'http://localhost:11434',
                contextWindow: 32768,
                temperature: 0.7,
                topP: 0.9
            };
            const provider = model_provider_factory_1.ModelProviderFactory.createProvider(config);
            expect(provider).toBeInstanceOf(ollama_provider_1.OllamaProvider);
            expect(provider.id).toBe(config.id);
            expect(provider.name).toBe(config.name);
            expect(provider.contextWindow).toBe(config.contextWindow);
        });
        it('should create an LM Studio provider with correct configuration', () => {
            const config = {
                type: 'lm-studio',
                id: 'test-lmstudio',
                name: 'Test LM Studio',
                modelName: 'wizardcoder',
                endpoint: 'http://localhost:1234',
                contextWindow: 32768,
                temperature: 0.7,
                topP: 0.9
            };
            const provider = model_provider_factory_1.ModelProviderFactory.createProvider(config);
            expect(provider).toBeInstanceOf(lm_studio_provider_1.LMStudioProvider);
            expect(provider.id).toBe(config.id);
            expect(provider.name).toBe(config.name);
            expect(provider.contextWindow).toBe(config.contextWindow);
        });
        it('should throw error for unknown provider type', () => {
            const invalidConfig = {
                type: 'unknown',
                id: 'test',
                name: 'Test',
                modelName: 'test-model',
                endpoint: 'http://localhost:1234',
                contextWindow: 32768
            };
            expect(() => model_provider_factory_1.ModelProviderFactory.createProvider(invalidConfig)).toThrow();
        });
    });
    describe('createProviders', () => {
        it('should create multiple providers from configurations', () => {
            const configs = [
                {
                    type: 'ollama',
                    id: 'ollama-1',
                    name: 'Ollama 1',
                    modelName: 'deepseek-coder',
                    endpoint: 'http://localhost:11434',
                    contextWindow: 32768
                },
                {
                    type: 'lm-studio',
                    id: 'lmstudio-1',
                    name: 'LM Studio 1',
                    modelName: 'wizardcoder',
                    endpoint: 'http://localhost:1234',
                    contextWindow: 32768
                }
            ];
            const providers = model_provider_factory_1.ModelProviderFactory.createProviders(configs);
            expect(providers).toHaveLength(2);
            expect(providers[0]).toBeInstanceOf(ollama_provider_1.OllamaProvider);
            expect(providers[1]).toBeInstanceOf(lm_studio_provider_1.LMStudioProvider);
        });
    });
    describe('getDefaultConfig', () => {
        it('should return default Ollama configuration', () => {
            const config = model_provider_factory_1.ModelProviderFactory.getDefaultConfig('ollama');
            expect(config.type).toBe('ollama');
            expect(config.endpoint).toBe('http://localhost:11434');
            expect(config.contextWindow).toBe(32768);
            expect(config.temperature).toBe(0.7);
            expect(config.topP).toBe(0.9);
        });
        it('should return default LM Studio configuration', () => {
            const config = model_provider_factory_1.ModelProviderFactory.getDefaultConfig('lm-studio');
            expect(config.type).toBe('lm-studio');
            expect(config.endpoint).toBe('http://localhost:1234');
            expect(config.contextWindow).toBe(32768);
            expect(config.temperature).toBe(0.7);
            expect(config.topP).toBe(0.9);
        });
        it('should throw error for unknown provider type', () => {
            expect(() => model_provider_factory_1.ModelProviderFactory.getDefaultConfig('unknown')).toThrow();
        });
    });
    describe('createDefaultProvider', () => {
        it('should create provider with default configuration', () => {
            const provider = model_provider_factory_1.ModelProviderFactory.createDefaultProvider('ollama', 'test-id', 'Test Name', 'deepseek-coder');
            expect(provider).toBeInstanceOf(ollama_provider_1.OllamaProvider);
            expect(provider.id).toBe('test-id');
            expect(provider.name).toBe('Test Name');
            expect(provider.contextWindow).toBe(32768);
        });
    });
    describe('createModelChain', () => {
        it('should create a complete model chain', () => {
            const chain = model_provider_factory_1.ModelProviderFactory.createModelChain();
            expect(chain.planner).toBeDefined();
            expect(chain.executor).toBeDefined();
            expect(chain.reviewer).toBeDefined();
            expect(chain.context).toBeDefined();
            expect(chain.planner.name).toContain('DeepSeek');
            expect(chain.executor.name).toContain('DeepSeek Coder');
            expect(chain.reviewer?.name).toContain('Mistral');
            expect(chain.context?.name).toContain('Qwen');
        });
    });
    describe('createSpecializedChain', () => {
        it('should create specialized chain for code tasks', () => {
            const chain = model_provider_factory_1.ModelProviderFactory.createSpecializedChain('code');
            expect(chain.planner).toBeDefined();
            expect(chain.executor).toBeDefined();
            expect(chain.reviewer).toBeDefined();
            expect(chain.executor.name).toContain('CodeLlama');
            expect(chain.reviewer?.name).toContain('WizardCoder');
        });
        it('should create specialized chain for planning tasks', () => {
            const chain = model_provider_factory_1.ModelProviderFactory.createSpecializedChain('planning');
            expect(chain.planner).toBeDefined();
            expect(chain.executor).toBeDefined();
            expect(chain.context).toBeDefined();
            expect(chain.planner.name).toContain('Neural Chat');
            expect(chain.context?.name).toContain('Qwen');
        });
        it('should create specialized chain for analysis tasks', () => {
            const chain = model_provider_factory_1.ModelProviderFactory.createSpecializedChain('analysis');
            expect(chain.planner).toBeDefined();
            expect(chain.executor).toBeDefined();
            expect(chain.reviewer).toBeDefined();
            expect(chain.executor.name).toContain('Mistral');
            expect(chain.reviewer?.name).toContain('Qwen');
        });
        it('should fall back to default chain for unknown task type', () => {
            const chain = model_provider_factory_1.ModelProviderFactory.createSpecializedChain('unknown');
            expect(chain.planner).toBeDefined();
            expect(chain.executor).toBeDefined();
            expect(chain.reviewer).toBeDefined();
            expect(chain.context).toBeDefined();
            // Should match default chain configuration
            expect(chain.planner.name).toContain('DeepSeek');
            expect(chain.executor.name).toContain('DeepSeek Coder');
        });
    });
});
//# sourceMappingURL=model-provider-factory.test.js.map