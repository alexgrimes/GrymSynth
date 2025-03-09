/**
 * Resource Detection Implementation
 */
import { SystemResources, ResourceAvailability, ResourceDetectionConfig, ResourceUpdateCallback, ResourceAlertCallback } from './types';
export declare class ResourceDetector {
    protected readonly config: ResourceDetectionConfig;
    private onUpdate?;
    private onAlert?;
    private updateInterval;
    private lastUpdate;
    private currentResources;
    constructor(config: ResourceDetectionConfig, onUpdate?: ResourceUpdateCallback | undefined, onAlert?: ResourceAlertCallback | undefined);
    /**
     * Start resource monitoring
     */
    start(): void;
    /**
     * Stop resource monitoring
     */
    stop(): void;
    /**
     * Get current resource availability
     */
    getAvailability(): ResourceAvailability;
    /**
     * Get current system resources
     */
    getCurrentResources(): SystemResources;
    /**
     * Detect current system resources
     */
    protected detectResources(): SystemResources;
    /**
     * Detect memory resources
     */
    protected detectMemoryResources(): {
        total: number;
        available: number;
        used: number;
    };
    /**
     * Detect CPU resources
     */
    protected detectCpuResources(): {
        cores: number;
        utilization: number;
        loadAverage: number[];
    };
    /**
     * Detect disk resources
     */
    protected detectDiskResources(): {
        total: number;
        available: number;
        used: number;
    };
    /**
     * Check resource thresholds and emit alerts
     */
    private checkThresholds;
    /**
     * Check a specific threshold and emit alert if needed
     */
    private checkThreshold;
    /**
     * Emit resource alert
     */
    private emitAlert;
    /**
     * Calculate health status for each resource type
     */
    private calculateHealthStatus;
    /**
     * Get status based on utilization and thresholds
     */
    private getStatusForUtilization;
    /**
     * Get overall system status based on individual resource statuses
     */
    private getOverallStatus;
}
