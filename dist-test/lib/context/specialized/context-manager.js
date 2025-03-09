"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecializedContextManager = void 0;
const events_1 = require("events");
const storage_1 = require("./storage");
const theme_analyzer_1 = require("../theme-discovery/theme-analyzer");
const ollama_provider_1 = require("../../llm/providers/ollama-provider");
const types_1 = require("./types");
/**
 * Manages specialized context for different models with varying capabilities
 */
class SpecializedContextManager extends events_1.EventEmitter {
    constructor(baseContextManager, config) {
        super();
        this.modelContexts = new Map();
        this.baseContextManager = baseContextManager;
        this.storage = new storage_1.ContextStorageAdapter();
        this.themeAnalyzer = new theme_analyzer_1.ThemeAnalyzer();
        this.config = config;
        this.llmProvider = new ollama_provider_1.OllamaProvider('deepseek-r1:14b');
    }
    /**
     * Initialize the context manager and load persisted contexts
     */
    async init() {
        await this.storage.init();
        await this.loadPersistedContexts();
    }
    /**
     * Route a query to the most suitable model based on content and themes
     */
    async routeQueryToModel(query, context) {
        try {
            // Analyze query themes
            const queryThemes = await this.themeAnalyzer.analyzeThemes(query);
            // Find best model match
            const bestModel = await this.findBestModelMatch(query, queryThemes);
            // Prepare specialized context
            const preparedContext = await this.prepareSpecializedContext({
                model: bestModel,
                baseContext: context,
                query,
                themes: queryThemes
            });
            // Generate followup suggestions based on model strengths
            const followups = this.generateFollowups(bestModel, queryThemes);
            return {
                model: bestModel,
                context: preparedContext.context,
                suggestedFollowups: followups,
                relevanceScore: this.calculateRelevanceScore(bestModel, queryThemes)
            };
        }
        catch (error) {
            console.error('Failed to route query:', error);
            throw new Error(types_1.ContextError.ROUTING_FAILED);
        }
    }
    /**
     * Convert string content to Message objects
     */
    convertToMessages(content) {
        return content.map((text, index) => ({
            id: `msg-${Date.now()}-${index}`,
            conversationId: 'specialized-context',
            role: 'system',
            content: text,
            timestamp: Date.now()
        }));
    }
    /**
     * Generate summary using LLM
     */
    async generateSummary(content) {
        const prompt = `
      Summarize the following content while preserving key information:
      ${content.join('\n')}
    `;
        const response = await this.llmProvider.getResponse(prompt);
        return response;
    }
    /**
     * Find the best model match for a query based on themes and model strengths
     */
    async findBestModelMatch(query, themes) {
        let bestScore = -1;
        let bestModel = null;
        // Convert Map entries to array for iteration
        const modelEntries = Array.from(this.modelContexts.entries());
        for (const [_, state] of modelEntries) {
            const score = this.calculateModelScore(state.specialization, themes);
            if (score > bestScore) {
                bestScore = score;
                bestModel = state.specialization;
            }
        }
        if (!bestModel || bestScore < this.config.minRelevanceScore) {
            return this.getDefaultModel();
        }
        return bestModel;
    }
    /**
     * Prepare context specialized for a specific model
     */
    async prepareSpecializedContext(params) {
        const { model, baseContext, query, themes } = params;
        // Filter context based on model's domains and themes
        const relevantContext = this.filterRelevantContext(baseContext, model.strengths.domains, themes);
        // Check if we need to summarize based on model's context size
        if (this.exceedsContextLimit(relevantContext, model.strengths.contextSize)) {
            return await this.summarizeContext({
                strategy: model.contextManager.summarizationStrategy,
                maxTokens: model.strengths.contextSize,
                preserveThemes: themes || new Set(),
                priorityTopics: model.contextManager.priorityTopics
            }, relevantContext);
        }
        return {
            context: relevantContext,
            themes: themes || new Set(),
            tokens: this.estimateTokenCount(relevantContext)
        };
    }
    /**
     * Summarize context based on strategy and constraints
     */
    async summarizeContext(options, context) {
        const { strategy, maxTokens, preserveThemes, priorityTopics } = options;
        // Convert themes to array for iteration
        const themesToPreserve = Array.from(preserveThemes);
        // Filter messages that contain priority themes or topics
        const priorityContext = context.filter(msg => themesToPreserve.some(theme => msg.toLowerCase().includes(theme.toLowerCase())) ||
            priorityTopics.some(topic => msg.toLowerCase().includes(topic.toLowerCase())));
        // Calculate remaining token budget
        const priorityTokens = this.estimateTokenCount(priorityContext);
        const remainingTokens = maxTokens - priorityTokens;
        if (remainingTokens <= 0) {
            // If we're over budget even with priority messages, summarize aggressively
            const summary = await this.generateSummary(priorityContext);
            return {
                context: [summary],
                themes: preserveThemes,
                tokens: this.estimateTokenCount([summary]),
                summary
            };
        }
        // Handle remaining context based on strategy
        const remainingContext = context.filter(msg => !priorityContext.includes(msg));
        let summarizedContext = [];
        switch (strategy) {
            case 'aggressive':
                // Summarize all remaining context into one summary
                const aggSummary = await this.generateSummary(remainingContext);
                summarizedContext = [aggSummary];
                break;
            case 'minimal':
                // Keep as much original context as possible
                summarizedContext = this.truncateToFit(remainingContext, remainingTokens);
                break;
            case 'selective':
                // Group by theme and summarize each group
                const themeGroups = await this.groupByThemes(remainingContext);
                for (const group of themeGroups) {
                    if (this.estimateTokenCount(summarizedContext) < remainingTokens) {
                        const groupSummary = await this.generateSummary(group);
                        summarizedContext.push(groupSummary);
                    }
                }
                break;
        }
        const finalContext = [...priorityContext, ...summarizedContext];
        return {
            context: finalContext,
            themes: preserveThemes,
            tokens: this.estimateTokenCount(finalContext)
        };
    }
    /**
     * Filter context based on relevance to domains and themes
     */
    filterRelevantContext(context, domains, themes) {
        return context.filter(item => {
            const matchesDomain = domains.some(domain => item.toLowerCase().includes(domain.toLowerCase()));
            const matchesTheme = !themes || Array.from(themes).some(theme => item.toLowerCase().includes(theme.toLowerCase()));
            return matchesDomain || matchesTheme;
        });
    }
    /**
     * Calculate model's score for handling a query with given themes
     */
    calculateModelScore(model, themes) {
        let score = 0;
        // Convert Set to array for iteration
        const themeArray = Array.from(themes);
        // Score based on theme matches
        for (const theme of themeArray) {
            if (model.contextManager.priorityTopics.includes(theme)) {
                score += this.config.themeWeights[theme] || 1;
            }
        }
        // Bonus for specialized features
        score += model.strengths.specialFeatures.length * 0.5;
        return score;
    }
    /**
     * Calculate relevance score for model and themes
     */
    calculateRelevanceScore(model, themes) {
        const score = this.calculateModelScore(model, themes);
        return Math.min(score / 10, 1); // Normalize to 0-1
    }
    /**
     * Generate followup suggestions based on model strengths
     */
    generateFollowups(model, themes) {
        const followups = [];
        // Add domain-specific followups
        for (const domain of model.strengths.domains) {
            followups.push(`Tell me more about ${domain}`);
        }
        // Convert Set to array for iteration
        const themeArray = Array.from(themes);
        // Add theme-based followups
        for (const theme of themeArray) {
            if (model.contextManager.priorityTopics.includes(theme)) {
                followups.push(`Explore ${theme} in more detail`);
            }
        }
        return followups.slice(0, 3); // Limit to top 3 suggestions
    }
    /**
     * Check if context exceeds model's token limit
     */
    exceedsContextLimit(context, limit) {
        return this.estimateTokenCount(context) > limit;
    }
    /**
     * Estimate token count for context
     */
    estimateTokenCount(context) {
        return context.reduce((sum, item) => sum + item.length / 4, 0);
    }
    /**
     * Get default model for fallback
     */
    getDefaultModel() {
        const defaultModel = this.modelContexts.get(this.config.defaultModel);
        if (!defaultModel) {
            throw new Error(types_1.ContextError.INVALID_MODEL);
        }
        return defaultModel.specialization;
    }
    /**
     * Truncate context to fit within token limit
     */
    truncateToFit(context, maxTokens) {
        const result = [];
        let totalTokens = 0;
        for (const item of context) {
            const tokens = this.estimateTokenCount([item]);
            if (totalTokens + tokens <= maxTokens) {
                result.push(item);
                totalTokens += tokens;
            }
            else {
                break;
            }
        }
        return result;
    }
    /**
     * Group context messages by themes
     */
    async groupByThemes(context) {
        const groups = new Map();
        for (const msg of context) {
            const themes = await this.themeAnalyzer.analyzeThemes(msg);
            const key = Array.from(themes).sort().join(',');
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(msg);
        }
        return Array.from(groups.values());
    }
    /**
     * Load persisted contexts from storage
     */
    async loadPersistedContexts() {
        const contexts = await this.storage.getContextsByPlatform('ollama');
        contexts.forEach(context => {
            this.modelContexts.set(context.modelId, {
                activeThemes: new Set(context.activeThemes),
                relevantContext: context.relevantContext,
                specialization: context.specialization,
                lastUsed: context.lastUsed
            });
        });
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        await this.storage.close();
        this.removeAllListeners();
    }
}
exports.SpecializedContextManager = SpecializedContextManager;
//# sourceMappingURL=context-manager.js.map