import { ModelMetrics } from '../types';
import { AllocationResult, RouteOptions } from './types';
/**
 * Resource Allocator Configuration
 */
interface ResourceAllocatorConfig {
    maxMemoryMB: number;
    maxCPU: number;
    maxTokensPerSecond: number;
    defaultTimeout: number;
    maxTimeout: number;
    minTimeout: number;
    highUtilizationThreshold: number;
    criticalUtilizationThreshold: number;
}
/**
 * Resource Allocator Implementation
 */
export declare class ResourceAllocator {
    private config;
    private pool;
    constructor(config?: ResourceAllocatorConfig);
    /**
     * Allocate resources for a route
     */
    allocateResources(route: RouteOptions): Promise<AllocationResult>;
    /**
     * Monitor resource usage
     */
    monitorUsage(allocation: AllocationResult): Promise<ModelMetrics>;
    /**
     * Adjust resource allocation based on metrics
     */
    adjustAllocation(metrics: ModelMetrics): Promise<AllocationResult>;
    /**
     * Release allocated resources
     */
    releaseResources(allocation: AllocationResult): Promise<void>;
    private calculateResourceNeeds;
    private hasRequiredResources;
    private attemptResourceOptimization;
    private recalculateAllocation;
    private findResourceBottlenecks;
    private optimizeResources;
    private reserveResources;
    private generateConstraints;
    private determinePriority;
    private calculateTimeout;
    private collectResourceMetrics;
    private updateResourcePool;
    private calculateAdjustments;
    private applyAdjustments;
    private returnResourcesToPool;
    private cleanupReservations;
}
export {};
