/**
 * Resource Management System
 * Provides centralized resource management for the model orchestration framework
 */
import type { SystemResources, ResourceAlert } from './resource-detection';
export * from './types';
export * from './resource-detection';
export { DEFAULT_RESOURCE_DETECTION_CONFIG as DefaultResourceConfig } from './resource-detection';
/**
 * Initialize the resource management system
 * This will be expanded as we implement additional components
 */
export declare function initializeResourceManagement(config?: {
    updateIntervalMs: number;
    thresholds: {
        memory: {
            warning: number;
            critical: number;
        };
        cpu: {
            warning: number;
            critical: number;
        };
        disk: {
            warning: number;
            critical: number;
        };
    };
    constraints: {
        memory: {
            maxAllocation: number;
            warningThreshold: number;
            criticalThreshold: number;
        };
        cpu: {
            maxUtilization: number;
            warningThreshold: number;
            criticalThreshold: number;
        };
        disk: {
            minAvailable: number;
            warningThreshold: number;
            criticalThreshold: number;
        };
    };
}, onResourceUpdate?: (resources: SystemResources) => void, onResourceAlert?: (alert: ResourceAlert) => void): Promise<{
    detector: any;
    /**
     * Stop all resource management systems
     */
    shutdown: () => Promise<void>;
}>;
/**
 * Create a preconfigured resource management system with recommended settings
 * for model orchestration workloads
 */
export declare function createModelResourceManager(maxMemoryGB?: number, maxCpuUtilization?: number, minDiskSpaceGB?: number): Promise<{
    detector: any;
    /**
     * Stop all resource management systems
     */
    shutdown: () => Promise<void>;
}>;
export declare const VERSION = "0.1.0";
