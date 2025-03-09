import { ResourceDetector } from '../../resource-detection';
import { ResourceAvailability, ResourceUpdateCallback, ResourceAlertCallback, SystemResources } from '../../resource-detection/types';
interface MockResourceAvailability {
    status: 'healthy' | 'warning' | 'critical';
    memory: {
        isAvailable: boolean;
        availableAmount: number;
        utilizationPercent: number;
    };
    cpu: {
        isAvailable: boolean;
        availableCores: number;
        utilizationPercent: number;
    };
    disk: {
        isAvailable: boolean;
        availableSpace: number;
        utilizationPercent: number;
    };
}
export declare class TestResourceDetector extends ResourceDetector {
    private memory;
    private cpu;
    private disk;
    private currentMock;
    constructor(onUpdate?: ResourceUpdateCallback, onAlert?: ResourceAlertCallback);
    setAvailableMemory(amount: number): void;
    setAvailableCores(cores: number): void;
    getAvailability(): ResourceAvailability;
    mockAvailability(availability: MockResourceAvailability): void;
    protected detectResources(): SystemResources;
    protected detectMemoryResources(): {
        total: number;
        available: number;
        used: number;
    };
    protected detectCpuResources(): {
        cores: number;
        utilization: number;
        loadAverage: number[];
    };
    protected detectDiskResources(): {
        total: number;
        available: number;
        used: number;
    };
}
export {};
