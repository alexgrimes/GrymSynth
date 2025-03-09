/// <reference types="node" />
import { EventEmitter } from 'events';
import { ResourceManagerConfig, SystemResources, Message, ModelConstraints, ModelContextState } from './types';
export declare class ResourceManager extends EventEmitter {
    protected config: ResourceManagerConfig;
    protected contexts: Map<string, ModelContextState>;
    protected resources: SystemResources;
    protected cacheDir: string;
    protected cacheLock: Set<string>;
    protected useInMemoryStorage: boolean;
    protected inMemoryCache: Map<string, {
        context: ModelContextState;
        metadata: any;
    }>;
    constructor(config: ResourceManagerConfig);
    protected ensureCacheDir(): Promise<void>;
    protected getContextPath(contextId: string): string;
    protected getMetadataPath(contextId: string): string;
    protected acquireLock(contextId: string): Promise<void>;
    protected releaseLock(contextId: string): void;
    cleanup(): Promise<void>;
    getCurrentResources(): Promise<SystemResources>;
    initializeContext(contextId: string, constraints: ModelConstraints): Promise<void>;
    addMessage(contextId: string, message: Message): Promise<void>;
    optimizeResources(): Promise<void>;
    getContext(contextId: string): Promise<ModelContextState | undefined>;
    protected loadFromCache(contextId: string): Promise<ModelContextState | undefined>;
    protected saveToCache(contextId: string, context: ModelContextState): Promise<void>;
    private updateMemoryPressure;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    emit(event: string | symbol, ...args: any[]): boolean;
}
