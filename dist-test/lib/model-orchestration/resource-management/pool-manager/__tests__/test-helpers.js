"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestResourceDetector = void 0;
const resource_detection_1 = require("../../resource-detection");
class TestResourceDetector extends resource_detection_1.ResourceDetector {
    constructor(onUpdate, onAlert) {
        super({
            updateIntervalMs: 1000,
            thresholds: {
                memory: { warning: 80, critical: 90 },
                cpu: { warning: 70, critical: 85 },
                disk: { warning: 80, critical: 90 }
            },
            constraints: {
                memory: { maxAllocation: 1024 * 1024, warningThreshold: 80, criticalThreshold: 90 },
                cpu: { maxUtilization: 90, warningThreshold: 70, criticalThreshold: 85 },
                disk: { minAvailable: 1024, warningThreshold: 80, criticalThreshold: 90 }
            }
        }, onUpdate, onAlert);
        this.memory = { total: 10000, available: 8000, used: 2000 };
        this.cpu = { cores: 8, available: 6, utilization: 25, loadAverage: [1.0, 1.0, 1.0] };
        this.disk = { total: 100000, available: 80000, used: 20000 };
        this.currentMock = null;
    }
    setAvailableMemory(amount) {
        this.memory.available = amount;
        this.memory.used = this.memory.total - amount;
    }
    setAvailableCores(cores) {
        this.cpu.available = cores;
        this.cpu.cores = cores;
    }
    getAvailability() {
        if (this.currentMock) {
            return this.currentMock;
        }
        return super.getAvailability();
    }
    mockAvailability(availability) {
        this.currentMock = {
            ...availability,
            timestamp: new Date()
        };
        // Update underlying system resources to match the mock
        this.memory.available = availability.memory.availableAmount;
        this.memory.used = this.memory.total - availability.memory.availableAmount;
        this.cpu.cores = availability.cpu.availableCores;
        this.cpu.utilization = availability.cpu.utilizationPercent;
        this.disk.available = availability.disk.availableSpace;
        this.disk.used = this.disk.total - availability.disk.availableSpace;
    }
    detectResources() {
        return {
            memory: {
                total: this.memory.total,
                used: this.memory.used,
                available: this.memory.available
            },
            cpu: {
                cores: this.cpu.cores,
                utilization: this.cpu.utilization,
                loadAverage: this.cpu.loadAverage
            },
            disk: {
                total: this.disk.total,
                used: this.disk.used,
                available: this.disk.available
            }
        };
    }
    detectMemoryResources() {
        const resources = this.detectResources();
        return resources.memory;
    }
    detectCpuResources() {
        const resources = this.detectResources();
        return resources.cpu;
    }
    detectDiskResources() {
        const resources = this.detectResources();
        return resources.disk;
    }
}
exports.TestResourceDetector = TestResourceDetector;
//# sourceMappingURL=test-helpers.js.map