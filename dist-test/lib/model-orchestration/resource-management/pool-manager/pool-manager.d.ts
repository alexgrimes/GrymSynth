/// <reference types="node" />
import { ResourcePool, ResourceRequest, Resource, ResourceStatus, PoolMetrics } from '../types';
import { ResourceDetector } from '../resource-detection';
import { PoolConfig } from './types';
import { EventEmitter } from 'events';
export declare class ResourcePoolManager extends EventEmitter implements ResourcePool {
    private tiers;
    private cache;
    private circuitBreaker;
    private config;
    private detector;
    private intervals;
    private metrics;
    private currentState;
    private lastAvailability;
    private stateChangeDebounceTimeout;
    private isDisposed;
    constructor(detector: ResourceDetector, config?: PoolConfig);
    private generateResourceId;
    private setupResourceMonitoring;
    protected checkAvailability(): Promise<void>;
    forceUpdate(): Promise<void>;
    private onResourceUpdate;
    private calculateHealthState;
    private calculateState;
    allocate(request: ResourceRequest): Promise<Resource>;
    release(resource: Resource): Promise<void>;
    optimize(metrics: PoolMetrics): Promise<void>;
    private calculateUtilization;
    private determineHealthState;
    private updateHealth;
    monitor(): ResourceStatus;
    private allocateFromTiers;
    private createResource;
    private runCleanup;
    private initializeTiers;
    private growPool;
    private shrinkPool;
    private updateMetrics;
    private isResourceValid;
    private meetsConstraints;
    private hasEnoughResources;
    dispose(): void;
}
