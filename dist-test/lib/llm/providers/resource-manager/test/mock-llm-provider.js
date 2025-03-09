"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompositionSpecialist = exports.createAudioSpecialist = exports.MockLLMProvider = void 0;
const types_1 = require("../types");
const isValidChatOptions = (options) => {
    return options !== undefined && Array.isArray(options.messages) && options.messages.length > 0;
};
const isValidMessage = (msg) => {
    return typeof msg.content === 'string' && typeof msg.role === 'string';
};
const createDefaultBufferConfig = () => ({
    input: { initial: 0, max: 1000 },
    output: { initial: 0, max: 1000 },
    context: { initial: 0, max: 1000 },
    working: { initial: 0, max: 1000 },
    model: { initial: 0, max: 1000 }
});
class MockLLMProvider {
    constructor(name, endpoint = `mock://${name}`, contextLimit = 4096, specialization = 'audio-specialist', config = {}) {
        this.name = name;
        this.endpoint = endpoint;
        this.contextLimit = contextLimit;
        this.specialization = specialization;
        this.config = config;
        this.messages = [];
        this.errorRate = 0;
        this.failureCount = 0;
        this.resourceManager = null;
        this.errorRate = config.errorRate || 0;
        this.maxTokens = config.maxTokens || contextLimit;
        this.memoryThreshold = config.memoryThreshold || 0.8;
        this.failOnPurpose = config.failOnPurpose || false;
        this.maxMemoryUsage = config.resourceUsage?.memoryUsage || Infinity;
        this.resourceMetrics = {
            modelId: name,
            memoryUsage: 0,
            cpuUsage: 0,
            tokenCount: 0,
            messageCount: 0,
            timestamp: Date.now(),
            status: 'ready',
            loadTime: 0,
            lastUsed: Date.now(),
            contextSize: 0,
            activeRequests: 0,
            platform: 'test',
            contextState: null,
            buffers: createDefaultBufferConfig(),
            ...(config.resourceUsage || {})
        };
        this.contextState = {
            modelId: name,
            messages: [],
            tokenCount: 0,
            tokens: 0,
            constraints: {
                maxTokens: this.maxTokens,
                contextWindow: contextLimit,
                truncateMessages: true
            },
            metadata: {
                lastAccess: Date.now(),
                createdAt: Date.now(),
                priority: 1,
                lastUpdated: Date.now(),
                importance: 1
            }
        };
    }
    setResourceManager(manager) {
        this.resourceManager = manager;
    }
    async chat(options) {
        if (!isValidChatOptions(options)) {
            throw new types_1.ResourceError('INVALID_REQUEST', 'Valid messages array is required');
        }
        if (this.failOnPurpose) {
            throw new types_1.ResourceError('PROVIDER_ERROR', 'Intentional failure for testing');
        }
        // Simulate error based on error rate
        if (Math.random() < this.errorRate) {
            this.failureCount++;
            const error = new types_1.ResourceError('PROVIDER_ERROR', `Mock provider error (failure #${this.failureCount})`);
            this.resourceMetrics.status = 'error';
            throw error;
        }
        // Reset error status if successful
        this.resourceMetrics.status = 'ready';
        // Convert incoming messages to internal format with guaranteed string content
        const messages = options.messages.map(msg => {
            if (!isValidMessage(msg)) {
                throw new types_1.ResourceError('INVALID_MESSAGE', 'Invalid message format');
            }
            return {
                role: this.validateRole(msg.role),
                content: this.validateContent(msg.content),
                timestamp: Date.now()
            };
        });
        // Check token limits
        const newTokenCount = this.estimateTokenCount(messages);
        if (this.contextState.tokenCount + newTokenCount > this.maxTokens) {
            throw new types_1.ResourceError('TOKEN_LIMIT_EXCEEDED', 'Token limit exceeded');
        }
        // Update resource metrics
        const messageCount = messages.length;
        const tokenCount = newTokenCount;
        this.resourceMetrics.messageCount = messageCount;
        this.resourceMetrics.tokenCount = tokenCount;
        // Calculate new memory usage with safe defaults
        const newMemoryUsage = this.resourceMetrics.memoryUsage + tokenCount * 2;
        this.resourceMetrics.memoryUsage = Math.min(newMemoryUsage, this.maxMemoryUsage);
        this.resourceMetrics.timestamp = Date.now();
        // Update context state by appending messages
        this.contextState.messages = [...this.contextState.messages, ...messages];
        this.contextState.tokenCount += tokenCount;
        this.contextState.metadata.lastAccess = Date.now();
        this.contextState.metadata.lastUpdated = Date.now();
        // Generate mock response based on specialization
        const response = this.generateSpecializedResponse(messages);
        // Add response to context
        const responseMessage = {
            role: 'assistant',
            content: response,
            timestamp: Date.now()
        };
        this.contextState.messages.push(responseMessage);
        this.contextState.tokenCount += this.estimateTokenCount([responseMessage]);
        this.resourceMetrics.messageCount += 1;
        return {
            content: response,
            role: 'assistant'
        };
    }
    async simulateResponse(message) {
        const validMessage = {
            role: this.validateRole(message.role || 'assistant'),
            content: this.validateContent(message.content || ''),
            timestamp: Date.now()
        };
        this.contextState.messages.push(validMessage);
        this.contextState.tokenCount += this.estimateTokenCount([validMessage]);
        this.resourceMetrics.messageCount += 1;
        this.resourceMetrics.timestamp = Date.now();
    }
    async simulateMemoryPressure(pressure = 0.9) {
        this.resourceMetrics.memoryUsage = this.maxTokens * pressure;
        this.resourceMetrics.timestamp = Date.now();
        if (this.resourceManager && pressure >= this.memoryThreshold) {
            this.resourceManager.emit('resourcePressure', {
                type: 'resourcePressure',
                timestamp: Date.now(),
                data: {
                    providerId: this.name,
                    pressure,
                    threshold: this.memoryThreshold,
                    source: 'memory'
                }
            });
        }
    }
    async healthCheck() {
        const healthy = this.failureCount < 3; // Simulate health degradation after multiple failures
        this.resourceMetrics.status = healthy ? 'ready' : 'error';
        return healthy;
    }
    async getCapabilities() {
        return {
            contextWindow: this.contextLimit,
            streamingSupport: false,
            specialTokens: {
                'START_AUDIO': '<|audio|>',
                'END_AUDIO': '</|audio|>',
                'START_COMPOSITION': '<|composition|>',
                'END_COMPOSITION': '</|composition|>'
            },
            modelType: 'chat'
        };
    }
    getResourceMetrics() {
        return { ...this.resourceMetrics };
    }
    getContextState() {
        return {
            ...this.contextState,
            messages: [...this.contextState.messages] // Deep copy messages
        };
    }
    setContextState(newState) {
        this.contextState = {
            ...newState,
            messages: [...newState.messages],
            metadata: {
                ...newState.metadata,
                lastAccess: Date.now(),
                lastUpdated: Date.now()
            }
        };
        // Update resource metrics to match new state
        this.resourceMetrics = {
            ...this.resourceMetrics,
            tokenCount: newState.tokenCount,
            messageCount: newState.messages.length,
            timestamp: Date.now()
        };
    }
    setErrorRate(rate) {
        this.errorRate = Math.max(0, Math.min(1, rate));
    }
    resetFailureCount() {
        this.failureCount = 0;
        this.resourceMetrics.status = 'ready';
    }
    validateRole(role) {
        if (role === 'user' || role === 'assistant' || role === 'system') {
            return role;
        }
        return 'user'; // Default to user if invalid role
    }
    validateContent(content) {
        if (content === undefined || content === null) {
            return '';
        }
        return String(content);
    }
    generateSpecializedResponse(messages) {
        if (messages.length === 0) {
            return `${this.specialization === 'audio-specialist' ? '[Audio Analysis]' : '[Composition Analysis]'} No input message`;
        }
        const lastMessage = messages[messages.length - 1];
        const prefix = this.specialization === 'audio-specialist' ? '[Audio Analysis] ' : '[Composition Analysis] ';
        return `${prefix}Mock response to: ${lastMessage.content.substring(0, 50)}...`;
    }
    estimateTokenCount(messages) {
        // Simple estimation: ~4 characters per token
        return messages.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0);
    }
}
exports.MockLLMProvider = MockLLMProvider;
// Helper function to create specialized providers
const createAudioSpecialist = (name = 'audio-specialist', config = {}) => {
    return new MockLLMProvider(name, `mock://${name}`, 4096, 'audio-specialist', {
        maxTokens: 1000,
        ...config
    });
};
exports.createAudioSpecialist = createAudioSpecialist;
const createCompositionSpecialist = (name = 'composition-specialist', config = {}) => {
    return new MockLLMProvider(name, `mock://${name}`, 4096, 'composition-specialist', {
        maxTokens: 1000,
        ...config
    });
};
exports.createCompositionSpecialist = createCompositionSpecialist;
//# sourceMappingURL=mock-llm-provider.js.map