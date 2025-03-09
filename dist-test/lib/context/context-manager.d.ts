import { Message } from '../storage/types';
interface Summary {
    theme: string;
    content: string;
    messageIds: string[];
    timestamp: number;
}
interface ContextState {
    messages: Message[];
    summaries: Summary[];
    metadata: {
        modelId: string;
        lastUpdated: number;
        contextSize: number;
        category?: string;
    };
}
/**
 * Manages conversation context with automatic summarization and token-aware management
 * across different models with varying context window sizes.
 */
export declare class ContextManager {
    private db;
    private modelConfigs;
    private contextStates;
    constructor();
    private initializeDB;
    /**
     * Preserves and adapts context when switching between models
     */
    preserveContext(fromModel: string, toModel: string, currentContext: Message[]): Promise<ContextState>;
    /**
     * Updates context with new messages and manages summarization
     */
    updateContext(message: Message, response: string): Promise<ContextState>;
    /**
     * Groups messages by theme for better context organization
     */
    private groupMessagesByTheme;
    /**
     * Creates a summary for a group of messages
     */
    private createGroupSummary;
    /**
     * Extracts the main theme from a group of messages
     */
    private extractTheme;
    /**
     * Determines if summarization is needed based on model constraints
     */
    private needsSummarization;
    /**
     * Calculates the approximate token size of the context
     */
    private calculateContextSize;
    /**
     * Adapts context format for specific model requirements
     */
    private adaptContextForModel;
    /**
     * Summarizes context when it exceeds model's capacity
     */
    private summarizeContext;
    /**
     * Persists context state to IndexedDB
     */
    private persistContextState;
    /**
     * Loads context state from IndexedDB
     */
    private loadContextState;
    /**
     * Creates initial context state for a model
     */
    private createInitialState;
    /**
     * Gets the current context state for a model
     */
    getContext(modelId: string): Promise<ContextState | null>;
    /**
     * Clears context for a specific model
     */
    clearContext(modelId: string): Promise<void>;
}
export {};
