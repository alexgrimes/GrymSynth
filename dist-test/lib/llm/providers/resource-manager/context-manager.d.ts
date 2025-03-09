/// <reference types="node" />
import { EventEmitter } from 'events';
import { Message, ModelContextState, ModelConstraints } from './types';
export declare class ContextManager extends EventEmitter {
    private contexts;
    constructor();
    private handleError;
    private readonly circuitBreaker;
    private isCircuitOpen;
    handleFailure(): Promise<void>;
    validateConstraints(constraints: ModelConstraints): void;
    private handleResourceExhaustion;
    initializeContext(modelId: string, constraints: ModelConstraints): Promise<ModelContextState>;
    getContext(modelId: string): Promise<ModelContextState | undefined>;
    removeContext(modelId: string): Promise<void>;
    private validateMessage;
    addMessage(modelId: string, message: Message): Promise<void>;
    private optimizeContext;
    private calculateTokenCount;
    cleanup(modelId?: string): Promise<void>;
}
