import { ResourceAvailability } from '../resource-detection/types';
import { ResourceType } from '../types';
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxAttempts: number;
}
export interface CircuitBreakerState {
    status: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailure?: number;
    lastSuccess?: number;
    halfOpenAttempts?: number;
}
export interface PoolConfig {
    maxPoolSize: number;
    minPoolSize: number;
    cleanupIntervalMs: number;
    resourceTimeoutMs: number;
    cacheMaxSize: number;
    enableCircuitBreaker: boolean;
    warningThreshold: number;
    criticalThreshold: number;
}
export interface ResourcePoolTier {
    priority: number;
    resources: PooledResource[];
    maxSize: number;
    utilization: number;
}
export interface PooledResource {
    id: string;
    type: ResourceType;
    status: {
        health: 'healthy' | 'warning' | 'critical';
        utilization: number;
        lastUpdated: Date;
    };
    metrics: {
        memory: {
            total: number;
            used: number;
            available: number;
            patterns: number;
            contexts: number;
            models: number;
        };
        cpu: {
            utilization: number;
            loadAverage: number;
            taskQueue: number;
            activeThreads: number;
        };
        cache: {
            hitRate: number;
            size: number;
            evictions: number;
        };
    };
    isAvailable: boolean;
    poolId: number;
    lastUsed: Date;
    allocatedAt?: Date;
    timeoutMs?: number;
}
export type PoolState = 'healthy' | 'warning' | 'critical';
export interface PoolAllocationResult {
    resource: PooledResource;
    fromCache: boolean;
    allocationTime: number;
}
export interface StateChangeEvent {
    from: PoolState;
    to: PoolState;
    metrics: ResourceAvailability;
}
export declare class ResourcePoolError extends Error {
    code: 'INVALID_POOL' | 'INVALID_PRIORITY' | 'RESOURCE_EXHAUSTED' | 'RESOURCE_STALE';
    resource?: PooledResource | undefined;
    constructor(message: string, code: 'INVALID_POOL' | 'INVALID_PRIORITY' | 'RESOURCE_EXHAUSTED' | 'RESOURCE_STALE', resource?: PooledResource | undefined);
}
