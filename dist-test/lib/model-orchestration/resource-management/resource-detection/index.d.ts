/**
 * Resource Detection Module
 * Provides system resource monitoring and management capabilities
 */
export * from './types';
export * from './resource-detector';
export declare const DEFAULT_RESOURCE_DETECTION_CONFIG: {
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
};
export declare function createResourceDetector(config?: {
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
}, onUpdate?: (resources: import('./types').SystemResources) => void, onAlert?: (alert: import('./types').ResourceAlert) => void): any;
