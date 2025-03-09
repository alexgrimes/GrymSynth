import { Message, SystemResources, ModelConstraints, ModelContextState } from '../types';
import { MockLLMProvider } from './mock-llm-provider';
export interface TestProviderConfig {
    specialization: 'audio-specialist' | 'composition-specialist';
    errorRate?: number;
    maxTokens?: number;
    resourceUsage?: {
        memoryUsage: number;
        cpuUsage: number;
        tokenCount: number;
        messageCount: number;
    };
}
export declare const createTestMessage: (content: string) => Message;
export declare const DEFAULT_MODEL_CONSTRAINTS: ModelConstraints;
export declare const createTestModelConstraints: (overrides?: Partial<ModelConstraints>) => ModelConstraints;
export declare const createTestSystemResources: (overrides?: Partial<SystemResources>) => SystemResources;
export declare const createTestContext: (modelId: string, constraints?: ModelConstraints, overrides?: Partial<ModelContextState>) => ModelContextState;
export declare const createTestProvider: (name: string | undefined, config: TestProviderConfig) => MockLLMProvider;
export declare const sleep: (ms: number) => Promise<unknown>;
export declare const createMockEvent: (type: string, data?: any) => {
    type: string;
    timestamp: number;
    data: any;
};
export declare const mockPressureEvent: {
    type: string;
    timestamp: number;
    data: {
        pressure: number;
        threshold: number;
        source: string;
    };
};
export declare const mockExhaustionEvent: {
    type: string;
    timestamp: number;
    data: {
        reason: string;
        limit: number;
        current: number;
    };
};
export declare const mockCleanupEvent: {
    type: string;
    timestamp: number;
    data: {
        bytesFreed: number;
        messageCount: number;
        duration: number;
    };
};
export declare const waitForEvent: (emitter: {
    on: (event: string, handler: (data: any) => void) => void;
}, eventName: string, timeout?: number) => Promise<any>;
export declare const simulateResourcePressure: (provider: MockLLMProvider, pressure?: number) => Promise<void>;
