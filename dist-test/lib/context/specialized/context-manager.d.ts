/// <reference types="node" />
import { EventEmitter } from 'events';
import { ContextManager } from '../context-manager';
import { ContextRoutingConfig, RoutingResult } from './types';
/**
 * Manages specialized context for different models with varying capabilities
 */
export declare class SpecializedContextManager extends EventEmitter {
    private modelContexts;
    private storage;
    private themeAnalyzer;
    private baseContextManager;
    private config;
    private llmProvider;
    constructor(baseContextManager: ContextManager, config: ContextRoutingConfig);
    /**
     * Initialize the context manager and load persisted contexts
     */
    init(): Promise<void>;
    /**
     * Route a query to the most suitable model based on content and themes
     */
    routeQueryToModel(query: string, context: string[]): Promise<RoutingResult>;
    /**
     * Convert string content to Message objects
     */
    private convertToMessages;
    /**
     * Generate summary using LLM
     */
    private generateSummary;
    /**
     * Find the best model match for a query based on themes and model strengths
     */
    private findBestModelMatch;
    /**
     * Prepare context specialized for a specific model
     */
    private prepareSpecializedContext;
    /**
     * Summarize context based on strategy and constraints
     */
    private summarizeContext;
    /**
     * Filter context based on relevance to domains and themes
     */
    private filterRelevantContext;
    /**
     * Calculate model's score for handling a query with given themes
     */
    private calculateModelScore;
    /**
     * Calculate relevance score for model and themes
     */
    private calculateRelevanceScore;
    /**
     * Generate followup suggestions based on model strengths
     */
    private generateFollowups;
    /**
     * Check if context exceeds model's token limit
     */
    private exceedsContextLimit;
    /**
     * Estimate token count for context
     */
    private estimateTokenCount;
    /**
     * Get default model for fallback
     */
    private getDefaultModel;
    /**
     * Truncate context to fit within token limit
     */
    private truncateToFit;
    /**
     * Group context messages by themes
     */
    private groupByThemes;
    /**
     * Load persisted contexts from storage
     */
    private loadPersistedContexts;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
