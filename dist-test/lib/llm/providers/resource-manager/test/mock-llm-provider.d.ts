import { LLMProvider, ChatOptions, ModelCapabilities, Message as BaseMessage } from '../../../types';
import { ModelContextState, ModelResourceMetrics } from '../types';
export declare class MockLLMProvider implements LLMProvider {
    name: string;
    endpoint: string;
    contextLimit: number;
    specialization: 'audio-specialist' | 'composition-specialist';
    private config;
    private messages;
    private resourceMetrics;
    private contextState;
    private errorRate;
    private failureCount;
    private maxTokens;
    private memoryThreshold;
    private failOnPurpose;
    private resourceManager;
    private maxMemoryUsage;
    constructor(name: string, endpoint?: string, contextLimit?: number, specialization?: 'audio-specialist' | 'composition-specialist', config?: {
        errorRate?: number;
        resourceUsage?: Partial<ModelResourceMetrics>;
        maxTokens?: number;
        memoryThreshold?: number;
        failOnPurpose?: boolean;
    });
    setResourceManager(manager: any): void;
    chat(options: ChatOptions): Promise<{
        content: string;
        role: 'assistant';
    }>;
    simulateResponse(message: Partial<BaseMessage>): Promise<void>;
    simulateMemoryPressure(pressure?: number): Promise<void>;
    healthCheck(): Promise<boolean>;
    getCapabilities(): Promise<ModelCapabilities>;
    getResourceMetrics(): ModelResourceMetrics;
    getContextState(): ModelContextState;
    setContextState(newState: ModelContextState): void;
    setErrorRate(rate: number): void;
    resetFailureCount(): void;
    private validateRole;
    private validateContent;
    private generateSpecializedResponse;
    private estimateTokenCount;
}
export declare const createAudioSpecialist: (name?: string, config?: {}) => MockLLMProvider;
export declare const createCompositionSpecialist: (name?: string, config?: {}) => MockLLMProvider;
