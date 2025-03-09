"use strict";
/**
 * Resource Detection Implementation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceDetector = void 0;
const node_os_1 = __importDefault(require("node:os"));
class ResourceDetector {
    constructor(config, onUpdate, onAlert) {
        this.config = config;
        this.onUpdate = onUpdate;
        this.onAlert = onAlert;
        this.updateInterval = null;
        this.lastUpdate = new Date();
        this.currentResources = null;
    }
    /**
     * Start resource monitoring
     */
    start() {
        this.updateInterval = setInterval(() => this.detectResources(), this.config.updateIntervalMs);
        // Initial detection
        this.detectResources();
    }
    /**
     * Stop resource monitoring
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    /**
     * Get current resource availability
     */
    getAvailability() {
        const resources = this.currentResources || this.detectResources();
        const status = this.calculateHealthStatus(resources);
        return {
            memory: {
                isAvailable: status.memory !== 'critical',
                availableAmount: resources.memory.available,
                utilizationPercent: (resources.memory.used / resources.memory.total) * 100
            },
            cpu: {
                isAvailable: status.cpu !== 'critical',
                availableCores: node_os_1.default.cpus().length,
                utilizationPercent: resources.cpu.utilization
            },
            disk: {
                isAvailable: status.disk !== 'critical',
                availableSpace: resources.disk.available,
                utilizationPercent: (resources.disk.used / resources.disk.total) * 100
            },
            status: this.getOverallStatus(status),
            timestamp: new Date()
        };
    }
    /**
     * Get current system resources
     */
    getCurrentResources() {
        return this.currentResources || this.detectResources();
    }
    /**
     * Detect current system resources
     */
    detectResources() {
        const resources = {
            memory: this.detectMemoryResources(),
            cpu: this.detectCpuResources(),
            disk: this.detectDiskResources()
        };
        this.currentResources = resources;
        this.lastUpdate = new Date();
        this.checkThresholds(resources);
        if (this.onUpdate) {
            this.onUpdate(resources);
        }
        return resources;
    }
    /**
     * Detect memory resources
     */
    detectMemoryResources() {
        const totalMemory = node_os_1.default.totalmem();
        const freeMemory = node_os_1.default.freemem();
        const usedMemory = totalMemory - freeMemory;
        return {
            total: totalMemory,
            available: freeMemory,
            used: usedMemory
        };
    }
    /**
     * Detect CPU resources
     */
    detectCpuResources() {
        const cpus = node_os_1.default.cpus();
        const loadAvg = node_os_1.default.loadavg();
        // Calculate CPU utilization
        const utilization = cpus.reduce((acc, cpu) => {
            const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
            const idle = cpu.times.idle;
            return acc + ((total - idle) / total) * 100;
        }, 0) / cpus.length;
        return {
            cores: cpus.length,
            utilization,
            loadAverage: loadAvg
        };
    }
    /**
     * Detect disk resources
     */
    detectDiskResources() {
        // Default implementation
        return {
            total: 1000000000000,
            available: 500000000000,
            used: 500000000000 // 500GB
        };
    }
    /**
     * Check resource thresholds and emit alerts
     */
    checkThresholds(resources) {
        const { thresholds } = this.config;
        // Check memory
        const memoryUtilization = (resources.memory.used / resources.memory.total) * 100;
        this.checkThreshold('memory', memoryUtilization, thresholds.memory);
        // Check CPU
        this.checkThreshold('cpu', resources.cpu.utilization, thresholds.cpu);
        // Check disk
        const diskUtilization = (resources.disk.used / resources.disk.total) * 100;
        this.checkThreshold('disk', diskUtilization, thresholds.disk);
    }
    /**
     * Check a specific threshold and emit alert if needed
     */
    checkThreshold(type, current, threshold) {
        if (!this.onAlert)
            return;
        if (current >= threshold.critical) {
            this.emitAlert({
                type,
                severity: 'critical',
                message: `${type} usage exceeded critical threshold`,
                current,
                threshold: threshold.critical,
                timestamp: new Date()
            });
        }
        else if (current >= threshold.warning) {
            this.emitAlert({
                type,
                severity: 'warning',
                message: `${type} usage exceeded warning threshold`,
                current,
                threshold: threshold.warning,
                timestamp: new Date()
            });
        }
    }
    /**
     * Emit resource alert
     */
    emitAlert(alert) {
        if (this.onAlert) {
            this.onAlert(alert);
        }
    }
    /**
     * Calculate health status for each resource type
     */
    calculateHealthStatus(resources) {
        const { thresholds } = this.config;
        return {
            memory: this.getStatusForUtilization((resources.memory.used / resources.memory.total) * 100, thresholds.memory),
            cpu: this.getStatusForUtilization(resources.cpu.utilization, thresholds.cpu),
            disk: this.getStatusForUtilization((resources.disk.used / resources.disk.total) * 100, thresholds.disk)
        };
    }
    /**
     * Get status based on utilization and thresholds
     */
    getStatusForUtilization(utilization, threshold) {
        if (utilization >= threshold.critical)
            return 'critical';
        if (utilization >= threshold.warning)
            return 'warning';
        return 'healthy';
    }
    /**
     * Get overall system status based on individual resource statuses
     */
    getOverallStatus(status) {
        if (status.memory === 'critical' || status.cpu === 'critical' || status.disk === 'critical') {
            return 'critical';
        }
        if (status.memory === 'warning' || status.cpu === 'warning' || status.disk === 'warning') {
            return 'warning';
        }
        return 'healthy';
    }
}
exports.ResourceDetector = ResourceDetector;
//# sourceMappingURL=resource-detector.js.map