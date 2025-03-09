import { LLMModel, Task } from '../types';
import { RouteOptions, PerformanceMetrics, NodeHealth } from './types';
/**
 * Routing Engine Configuration
 */
interface RoutingConfig {
    minConfidenceScore: number;
    routeCacheSize: number;
    performanceThresholds: {
        maxLatency: number;
        minSuccessRate: number;
        maxErrorRate: number;
    };
}
/**
 * Core Routing Engine Implementation
 */
export declare class RoutingEngine {
    private config;
    private routeCache;
    private weights;
    constructor(config?: RoutingConfig);
    /**
     * Calculate optimal routes for a given task
     */
    calculateRoutes(task: Task, models: LLMModel[]): Promise<RouteOptions>;
    private convertToModelMetrics;
    /**
     * Optimize allocated route based on current conditions
     */
    optimizeAllocation(route: RouteOptions, currentLoad: Map<string, number>): Promise<RouteOptions>;
    /**
     * Validate route against health and performance criteria
     */
    validateRoute(route: RouteOptions, health: NodeHealth[]): Promise<boolean>;
    /**
     * Update route scoring based on actual performance
     */
    updateRoutingWeights(performance: PerformanceMetrics): void;
    private calculateRouteScore;
    private calculateCapabilityMatch;
    private calculatePerformanceScore;
    private calculateResourceEfficiency;
    private calculateHistoricalSuccess;
    private meetsMinimumRequirements;
    private selectOptimalRoute;
    private generateCacheKey;
    private getFromCache;
    private cacheRoute;
    private evictLeastUsed;
    private calculateLoadImpact;
    private identifyBottlenecks;
    private applyOptimizations;
    private validateHealthStatus;
    private validatePerformance;
    private calculatePriority;
    private adjustLatencyWeight;
    private adjustReliabilityWeight;
    private adjustErrorWeight;
    private normalizeWeights;
}
export {};
