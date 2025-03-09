/**
 * Core resource management type definitions
 */
export declare enum ResourceType {
    Memory = "memory",
    CPU = "cpu",
    Storage = "storage"
}
export declare enum Priority {
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}
export interface ResourceRequest {
    id: string;
    type: ResourceType;
    priority: Priority;
    requirements: {
        memory?: number;
        cpu?: number;
        timeoutMs?: number;
    };
    constraints?: {
        maxMemory: number;
        maxCpu: number;
        maxLatency: number;
    };
}
export interface Resource {
    id: string;
    type: ResourceType;
    status: ResourceStatus;
    metrics: ResourceMetrics;
    isAvailable: boolean;
}
export interface ResourceStatus {
    health: 'healthy' | 'warning' | 'critical';
    utilization: number;
    lastUpdated: Date;
    nonStaleResourceCount?: number;
}
export interface ResourcePool {
    allocate(request: ResourceRequest): Promise<Resource>;
    release(resource: Resource): Promise<void>;
    optimize(metrics: PoolMetrics): Promise<void>;
    monitor(): ResourceStatus;
}
export interface PoolMetrics {
    utilizationRate: number;
    allocationRate: number;
    releaseRate: number;
    failureRate: number;
    averageLatency: number;
}
export interface ResourceMetrics {
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
}
export interface HealthIndicator {
    status: 'healthy' | 'warning' | 'critical';
    message?: string;
    timestamp: Date;
    metrics: ResourceMetrics;
}
export interface ResourceManager {
    getAvailableResources(): Promise<Resource[]>;
    requestResource(request: ResourceRequest): Promise<Resource>;
    releaseResource(resourceId: string): Promise<void>;
    getResourceMetrics(): ResourceMetrics;
    getHealth(): HealthIndicator;
}
export declare class ResourceError extends Error {
    readonly code: string;
    readonly resource?: Resource | undefined;
    constructor(message: string, code: string, resource?: Resource | undefined);
}
export declare class ResourceExhaustionError extends ResourceError {
    constructor(resource?: Resource);
}
export declare class ResourceConstraintError extends ResourceError {
    constructor(constraint: string, resource?: Resource);
}
