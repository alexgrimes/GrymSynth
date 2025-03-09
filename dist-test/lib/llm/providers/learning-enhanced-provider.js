"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLearningEnhancedLMStudioProvider = exports.createLearningEnhancedOllamaProvider = exports.createLearningEnhancedProvider = void 0;
const learning_profiles_1 = require("../../learning-profiles");
/**
 * Wraps an LLM provider with learning profile capabilities
 */
function createLearningEnhancedProvider(provider, modelId, specialization) {
    let isInitialized = false;
    const ensureProfile = async () => {
        if (!isInitialized) {
            try {
                await (0, learning_profiles_1.initializeProfile)(modelId, specialization);
            }
            catch (error) {
                // Profile might already exist, which is fine
            }
            isInitialized = true;
        }
    };
    const analyzeDomainFromPrompt = (prompt) => {
        // Simple domain extraction - in practice, you might want more sophisticated analysis
        const domains = [
            'code', 'audio', 'visual', 'math', 'science', 'history',
            'literature', 'philosophy', 'technology'
        ];
        const domainMatches = domains.filter(domain => prompt.toLowerCase().includes(domain.toLowerCase()));
        return domainMatches[0] || 'general';
    };
    const analyzeSuccess = (response) => {
        // Simple success analysis - could be more sophisticated
        const errorIndicators = [
            "i'm not sure",
            "i don't know",
            "cannot help",
            "unable to",
            "error",
            "invalid",
            "failed"
        ];
        return !errorIndicators.some(indicator => response.content.toLowerCase().includes(indicator));
    };
    return {
        name: provider.name,
        endpoint: provider.endpoint,
        contextLimit: provider.contextLimit,
        async chat(options) {
            await ensureProfile();
            const startTime = Date.now();
            const response = await provider.chat(options);
            const executionTime = Date.now() - startTime;
            const lastMessage = options.messages[options.messages.length - 1];
            const domain = analyzeDomainFromPrompt(lastMessage.content);
            const success = analyzeSuccess(response);
            await (0, learning_profiles_1.recordInteraction)(modelId, {
                topic: domain,
                context: lastMessage.content,
                response: response.content,
                success,
                metadata: {
                    executionTime,
                    complexity: options.messages.reduce((acc, msg) => acc + msg.content.length, 0) / 1000,
                    tokenUsage: options.maxTokens ? {
                        prompt: options.messages.reduce((acc, msg) => acc + msg.content.length, 0) / 4,
                        completion: response.content.length / 4
                    } : undefined
                }
            });
            return response;
        },
        async healthCheck() {
            return provider.healthCheck();
        },
        async getCapabilities() {
            return provider.getCapabilities();
        }
    };
}
exports.createLearningEnhancedProvider = createLearningEnhancedProvider;
/**
 * Helper to create a learning-enhanced Ollama provider
 */
function createLearningEnhancedOllamaProvider(modelName, specialization = 'general') {
    const { createOllamaProvider } = require('./ollama-provider');
    const baseProvider = createOllamaProvider(modelName);
    return createLearningEnhancedProvider(baseProvider, `ollama-${modelName}`, specialization);
}
exports.createLearningEnhancedOllamaProvider = createLearningEnhancedOllamaProvider;
/**
 * Helper to create a learning-enhanced LM Studio provider
 */
function createLearningEnhancedLMStudioProvider(modelName, specialization = 'general') {
    const { createLMStudioProvider } = require('./lm-studio-provider');
    const baseProvider = createLMStudioProvider(modelName);
    return createLearningEnhancedProvider(baseProvider, `lmstudio-${modelName}`, specialization);
}
exports.createLearningEnhancedLMStudioProvider = createLearningEnhancedLMStudioProvider;
//# sourceMappingURL=learning-enhanced-provider.js.map