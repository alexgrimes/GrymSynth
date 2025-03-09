"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryProfiler = void 0;
const events_1 = require("events");
class MemoryProfiler extends events_1.EventEmitter {
    constructor(memoryLimit = 16 * 1024 * 1024 * 1024) {
        super();
        this.snapshots = new Map();
        this.isTracking = false;
        this.memoryLimit = memoryLimit;
        this.startTime = Date.now();
    }
    // Alias methods to match test expectations
    start() {
        this.startTracking();
    }
    stop() {
        this.stopTracking();
    }
    async getActualMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            timestamp: Date.now() - this.startTime,
            heap: usage.heapUsed,
            external: usage.external,
            arrayBuffers: usage.arrayBuffers || 0,
            total: usage.heapTotal,
            rss: usage.rss
        };
    }
    startTracking(intervalMs = 1000) {
        if (this.isTracking)
            return;
        this.isTracking = true;
        this.startTime = Date.now();
        // Take initial snapshot
        this.takeSnapshot('tracking_start');
        this.intervalId = setInterval(async () => {
            const snapshot = await this.getActualMemoryUsage();
            const currentTotal = snapshot.heap + snapshot.external;
            if (currentTotal > this.memoryLimit) {
                this.emit('memoryLimitExceeded', {
                    current: currentTotal,
                    limit: this.memoryLimit
                });
            }
            this.snapshots.set(`auto_${snapshot.timestamp}`, snapshot);
        }, intervalMs);
    }
    stopTracking() {
        if (!this.isTracking)
            return;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        // Take final snapshot
        this.takeSnapshot('tracking_stop');
        this.isTracking = false;
    }
    async takeSnapshot(label) {
        const snapshot = await this.getActualMemoryUsage();
        snapshot.label = label;
        this.snapshots.set(label, snapshot);
        return snapshot;
    }
    checkMemoryUsage() {
        const usage = process.memoryUsage();
        const total = usage.heapUsed + usage.external;
        return total <= this.memoryLimit;
    }
    getMemoryDelta(startLabel, endLabel) {
        const startSnap = this.snapshots.get(startLabel);
        const endSnap = this.snapshots.get(endLabel);
        if (!startSnap || !endSnap) {
            return null;
        }
        return {
            heapDelta: endSnap.heap - startSnap.heap,
            totalDelta: (endSnap.heap + endSnap.external) - (startSnap.heap + startSnap.external)
        };
    }
    getPeakMemoryUsage() {
        return Math.max(...Array.from(this.snapshots.values())
            .map(s => s.heap + s.external));
    }
    getMemoryLimit() {
        return this.memoryLimit;
    }
    getAllSnapshots() {
        return Array.from(this.snapshots.values());
    }
    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}
exports.MemoryProfiler = MemoryProfiler;
//# sourceMappingURL=memory-profile.js.map