import { Task } from '../types';
import { LoadDistribution, NodeHealth, AllocationPriority } from './types';
/**
 * Load Balancer Configuration
 */
interface LoadBalancerConfig {
    targetLoadVariance: number;
    maxNodeUtilization: number;
    spikeThreshold: number;
    healthyResponseTime: number;
    healthySuccessRate: number;
    maxErrorRate: number;
    rebalanceInterval: number;
    minRebalanceImprovement: number;
}
/**
 * Load Balancer Implementation
 */
export declare class LoadBalancer {
    private config;
    private currentDistribution;
    private lastRebalance;
    constructor(config?: LoadBalancerConfig);
    /**
     * Distribute tasks across available nodes
     */
    distributeLoad(tasks: Task[], nodes: NodeHealth[]): Promise<LoadDistribution>;
    /**
     * Rebalance load based on system metrics
     */
    rebalance(metrics: SystemMetrics): Promise<LoadAdjustment>;
    /**
     * Handle traffic spikes
     */
    handleSpikes(incoming: number): Promise<LoadStrategy>;
    /**
     * Optimize current distribution
     */
    optimizeDistribution(): Promise<void>;
    private calculateNodeLoads;
    private calculateNodeLoad;
    private selectOptimalNode;
    private meetsNodeConstraints;
    private assignTaskToNode;
    private estimateTaskDuration;
    private improveBalance;
    private canMoveAllocation;
    private moveAllocation;
    private updateBalanceMetrics;
    private calculateTotalLoad;
    private calculateLoadVariance;
    private calculateTaskImpacts;
    private estimateTaskLoad;
    private createInitialDistribution;
    private calculateLoadAdjustment;
    private applyLoadAdjustment;
    private collectSystemMetrics;
    private needsOptimization;
    private performOptimization;
    private createSpikeStrategy;
    private createInitialBalanceMetrics;
    private needsRebalancing;
    private mapPriorityToAllocation;
}
interface SystemMetrics {
    loadVariance: number;
    maxUtilization: number;
    averageResponseTime: number;
    errorRate: number;
}
interface LoadAdjustment {
    requiresChange: boolean;
    changes?: Array<{
        nodeId: string;
        adjustment: number;
    }>;
}
interface LoadStrategy {
    requiresAction: boolean;
    recommendations?: Array<{
        action: 'scale' | 'redistribute' | 'throttle';
        factor?: number;
        priority?: AllocationPriority;
    }>;
}
export {};
