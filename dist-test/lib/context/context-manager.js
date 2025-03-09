"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
const idb_1 = require("idb");
/**
 * Manages conversation context with automatic summarization and token-aware management
 * across different models with varying context window sizes.
 */
class ContextManager {
    constructor() {
        this.db = null;
        this.modelConfigs = new Map([
            // Ollama models
            ['deepseek-r1:14b', {
                    maxTokens: 8192,
                    minRecentMessages: 5,
                    summarizationThreshold: 0.8,
                    name: 'deepseek-r1:14b',
                    provider: 'ollama',
                    endpoint: 'http://localhost:11434/api/generate'
                }],
            // LM Studio models
            ['qwen2.5-vl-7b-instruct', {
                    maxTokens: 128000,
                    minRecentMessages: 10,
                    summarizationThreshold: 0.9,
                    name: 'qwen2.5-vl-7b-instruct',
                    provider: 'lmstudio',
                    endpoint: 'http://127.0.0.1:1234/v1/chat/completions'
                }],
            ['qwen2.5-coder', {
                    maxTokens: 128000,
                    minRecentMessages: 10,
                    summarizationThreshold: 0.9,
                    name: 'qwen2.5-coder',
                    provider: 'lmstudio',
                    endpoint: 'http://127.0.0.1:1234/v1/chat/completions'
                }]
        ]);
        this.contextStates = new Map();
        this.initializeDB();
    }
    async initializeDB() {
        this.db = await (0, idb_1.openDB)('context-manager', 1, {
            upgrade(db) {
                // Store for context states
                db.createObjectStore('context-states', { keyPath: 'modelId' });
                // Store for message history
                db.createObjectStore('messages', { keyPath: 'id' });
                // Store for summaries
                db.createObjectStore('summaries', { keyPath: ['modelId', 'timestamp'] });
            }
        });
    }
    /**
     * Preserves and adapts context when switching between models
     */
    async preserveContext(fromModel, toModel, currentContext) {
        try {
            const targetConfig = this.modelConfigs.get(toModel);
            if (!targetConfig) {
                throw new Error(`No configuration found for model: ${toModel}`);
            }
            // Calculate current context size
            const contextSize = await this.calculateContextSize(currentContext);
            // Check if we need to summarize for the target model
            const shouldSummarize = await this.needsSummarization(toModel, contextSize);
            if (shouldSummarize) {
                const summarized = await this.summarizeContext(currentContext, toModel);
                await this.persistContextState(toModel, summarized);
                return summarized;
            }
            // Preserve full context if possible
            const preserved = await this.adaptContextForModel(currentContext, toModel);
            await this.persistContextState(toModel, preserved);
            return preserved;
        }
        catch (error) {
            console.error('Context preservation failed:', error);
            throw error;
        }
    }
    /**
     * Updates context with new messages and manages summarization
     */
    async updateContext(message, response) {
        const modelId = message.model || 'deepseek-r1:14b';
        const config = this.modelConfigs.get(modelId);
        if (!config) {
            throw new Error(`No configuration found for model: ${modelId}`);
        }
        let state = this.contextStates.get(modelId) || await this.loadContextState(modelId);
        if (!state) {
            state = this.createInitialState(modelId);
        }
        // Add new messages
        const responseMessage = {
            id: `resp-${Date.now()}`,
            conversationId: message.conversationId,
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
            model: modelId
        };
        state.messages.push(message, responseMessage);
        state.metadata.lastUpdated = Date.now();
        state.metadata.contextSize = await this.calculateContextSize(state.messages);
        // Check if summarization is needed
        const shouldSummarize = await this.needsSummarization(modelId, state.metadata.contextSize);
        if (shouldSummarize) {
            state = await this.summarizeContext(state.messages, modelId);
        }
        // Update state
        this.contextStates.set(modelId, state);
        await this.persistContextState(modelId, state);
        return state;
    }
    /**
     * Groups messages by theme for better context organization
     */
    async groupMessagesByTheme(messages) {
        // Use the first available model for theme analysis
        const config = Array.from(this.modelConfigs.values())[0];
        const prompt = `
      Group these messages by theme:
      ${JSON.stringify(messages)}
      
      Consider:
      1. Topic continuity
      2. Temporal proximity
      3. Reference relationships
      4. Semantic similarity
    `;
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.provider === 'ollama'
                ? {
                    model: config.name,
                    prompt,
                    stream: false
                }
                : {
                    model: config.name,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
        });
        const result = await response.json();
        const content = config.provider === 'ollama'
            ? result.response
            : result.choices[0].message.content;
        return JSON.parse(content);
    }
    /**
     * Creates a summary for a group of messages
     */
    async createGroupSummary(messages) {
        const config = Array.from(this.modelConfigs.values())[0];
        const content = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const prompt = `
      Summarize this conversation while preserving key information:
      ${content}
      
      Focus on:
      1. Main topics and conclusions
      2. Important decisions or outcomes
      3. Key context needed for future reference
    `;
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.provider === 'ollama'
                ? {
                    model: config.name,
                    prompt,
                    stream: false
                }
                : {
                    model: config.name,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
        });
        const result = await response.json();
        const summary = config.provider === 'ollama'
            ? result.response
            : result.choices[0].message.content;
        return {
            theme: await this.extractTheme(messages),
            content: summary,
            messageIds: messages.map(m => m.id),
            timestamp: Date.now()
        };
    }
    /**
     * Extracts the main theme from a group of messages
     */
    async extractTheme(messages) {
        const config = Array.from(this.modelConfigs.values())[0];
        const content = messages.map(m => m.content).join(' ');
        const prompt = `Extract a short theme (3-5 words) from this conversation:\n${content}`;
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config.provider === 'ollama'
                ? {
                    model: config.name,
                    prompt,
                    stream: false
                }
                : {
                    model: config.name,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false
                })
        });
        const result = await response.json();
        const theme = config.provider === 'ollama'
            ? result.response
            : result.choices[0].message.content;
        return theme.trim();
    }
    /**
     * Determines if summarization is needed based on model constraints
     */
    async needsSummarization(modelId, contextSize) {
        const config = this.modelConfigs.get(modelId);
        if (!config)
            return true;
        return contextSize > config.maxTokens * config.summarizationThreshold;
    }
    /**
     * Calculates the approximate token size of the context
     */
    async calculateContextSize(messages) {
        // Approximate token count (4 chars ≈ 1 token)
        return messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
    }
    /**
     * Adapts context format for specific model requirements
     */
    async adaptContextForModel(messages, targetModel) {
        const config = this.modelConfigs.get(targetModel);
        if (!config) {
            throw new Error(`No configuration found for model: ${targetModel}`);
        }
        return {
            messages,
            summaries: [],
            metadata: {
                modelId: targetModel,
                lastUpdated: Date.now(),
                contextSize: await this.calculateContextSize(messages)
            }
        };
    }
    /**
     * Summarizes context when it exceeds model's capacity
     */
    async summarizeContext(messages, modelId) {
        const config = this.modelConfigs.get(modelId);
        if (!config) {
            throw new Error(`No configuration found for model: ${modelId}`);
        }
        // Group messages by theme
        const messageGroups = await this.groupMessagesByTheme(messages);
        // Create summaries for each group
        const summaries = await Promise.all(messageGroups.map(group => this.createGroupSummary(group.messages)));
        // Keep recent messages
        const recentMessages = messages.slice(-config.minRecentMessages);
        // Create system messages from summaries
        const summaryMessages = summaries.map(s => ({
            id: `summary-${s.timestamp}`,
            conversationId: recentMessages[0]?.conversationId || '',
            role: 'system',
            content: s.content,
            timestamp: s.timestamp
        }));
        return {
            messages: recentMessages,
            summaries,
            metadata: {
                modelId,
                lastUpdated: Date.now(),
                contextSize: await this.calculateContextSize([
                    ...recentMessages,
                    ...summaryMessages
                ])
            }
        };
    }
    /**
     * Persists context state to IndexedDB
     */
    async persistContextState(modelId, state) {
        if (!this.db)
            return;
        const tx = this.db.transaction(['context-states', 'messages', 'summaries'], 'readwrite');
        // Save context state
        await tx.objectStore('context-states').put(state);
        // Save messages
        for (const message of state.messages) {
            await tx.objectStore('messages').put(message);
        }
        // Save summaries
        for (const summary of state.summaries) {
            await tx.objectStore('summaries').put({
                ...summary,
                modelId
            });
        }
        await tx.done;
    }
    /**
     * Loads context state from IndexedDB
     */
    async loadContextState(modelId) {
        if (!this.db)
            return null;
        return await this.db.get('context-states', modelId);
    }
    /**
     * Creates initial context state for a model
     */
    createInitialState(modelId) {
        return {
            messages: [],
            summaries: [],
            metadata: {
                modelId,
                lastUpdated: Date.now(),
                contextSize: 0
            }
        };
    }
    /**
     * Gets the current context state for a model
     */
    async getContext(modelId) {
        return this.contextStates.get(modelId) || await this.loadContextState(modelId);
    }
    /**
     * Clears context for a specific model
     */
    async clearContext(modelId) {
        this.contextStates.delete(modelId);
        if (this.db) {
            const tx = this.db.transaction(['context-states', 'messages', 'summaries'], 'readwrite');
            await tx.objectStore('context-states').delete(modelId);
            await tx.done;
        }
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=context-manager.js.map