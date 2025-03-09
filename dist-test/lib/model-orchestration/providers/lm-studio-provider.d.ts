import { LLMModel, ModelCapabilities, ModelCapability } from '../types';
interface LMStudioConfig {
    modelName: string;
    endpoint: string;
    contextWindow: number;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    capabilities?: Partial<Record<ModelCapability, number>>;
}
/**
 * LM Studio model provider implementation
 */
export declare class LMStudioProvider implements LLMModel {
    readonly id: string;
    readonly name: string;
    readonly contextWindow: number;
    private config;
    readonly capabilities: ModelCapabilities;
    constructor(id: string, name: string, contextWindow: number, config: LMStudioConfig);
    /**
     * Process a request through the LM Studio model
     */
    process(input: any): Promise<any>;
    /**
     * Test a specific capability of the model
     */
    testCapability(capability: ModelCapability): Promise<{
        score: number;
        confidence: number;
        lastUpdated: Date;
        sampleSize: number;
    }>;
    /**
     * Get resource metrics for the model
     */
    getResourceMetrics(): Promise<{
        memoryUsage: number;
        cpuUsage: number;
        averageLatency: number;
        peakMemoryUsage?: number;
        totalProcessingTime?: number;
    }>;
    getTokenStats(): Promise<{
        total: number;
        prompt: number;
        completion: number;
        rate?: number;
        cached?: number;
    }>;
    /**
     * Initialize model capabilities
     */
    private initializeCapabilities;
    /**
     * Format input for the LM Studio model
     */
    private formatInput;
    /**
     * Format planning input
     */
    private formatPlanningInput;
    /**
     * Format code input
     */
    private formatCodeInput;
    /**
     * Format analysis input
     */
    private formatAnalysisInput;
    /**
     * Format output from the LM Studio model
     */
    private formatOutput;
}
export {};
