"use strict";
/**
 * Test helpers and mock data for Feature Memory System tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithTimeout = exports.waitFor = exports.ErrorTracker = exports.MemoryMonitor = exports.PerformanceMonitor = exports.createMockPatterns = exports.createMockPattern = void 0;
/**
 * Create a mock pattern with default values
 */
function createMockPattern(overrides = {}) {
    const now = new Date();
    return {
        id: `pattern_${Date.now()}`,
        features: new Map([['key', 'value']]),
        confidence: 0.95,
        timestamp: now,
        metadata: {
            source: 'test',
            category: 'test',
            frequency: 1,
            lastUpdated: now,
        },
        ...overrides,
    };
}
exports.createMockPattern = createMockPattern;
/**
 * Create multiple mock patterns
 */
function createMockPatterns(count) {
    return Array.from({ length: count }, (_, index) => createMockPattern({
        id: `pattern_${index}`,
        features: new Map([['key', `value_${index}`]]),
    }));
}
exports.createMockPatterns = createMockPatterns;
/**
 * Mock performance measurement utilities
 */
class PerformanceMonitor {
    constructor() {
        this.measurements = new Map();
        this.startTime = performance.now();
    }
    start() {
        this.startTime = performance.now();
    }
    measure(operation) {
        const duration = performance.now() - this.startTime;
        const measurements = this.measurements.get(operation) || [];
        measurements.push(duration);
        this.measurements.set(operation, measurements);
        return duration;
    }
    getAverageTime(operation) {
        const measurements = this.measurements.get(operation) || [];
        if (measurements.length === 0)
            return 0;
        return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
    }
    getMaxTime(operation) {
        const measurements = this.measurements.get(operation) || [];
        return Math.max(...measurements, 0);
    }
    reset() {
        this.measurements.clear();
        this.startTime = performance.now();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * Mock memory usage utilities
 */
class MemoryMonitor {
    constructor() {
        this.measurements = [];
        this.initialMemory = process.memoryUsage().heapUsed;
    }
    measure() {
        const currentMemory = process.memoryUsage().heapUsed;
        const usage = (currentMemory - this.initialMemory) / (1024 * 1024); // Convert to MB
        this.measurements.push(usage);
        return usage;
    }
    getPeakMemory() {
        return Math.max(...this.measurements, 0);
    }
    getAverageMemory() {
        if (this.measurements.length === 0)
            return 0;
        return this.measurements.reduce((sum, mem) => sum + mem, 0) / this.measurements.length;
    }
    reset() {
        this.measurements = [];
        this.initialMemory = process.memoryUsage().heapUsed;
    }
}
exports.MemoryMonitor = MemoryMonitor;
/**
 * Mock error tracking utilities
 */
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.operationCount = 0;
    }
    trackOperation(success = true, error) {
        this.operationCount++;
        if (!success && error) {
            this.errors.push(error);
        }
    }
    getErrorRate() {
        if (this.operationCount === 0)
            return 0;
        return (this.errors.length / this.operationCount) * 100;
    }
    getErrorCount() {
        return this.errors.length;
    }
    getOperationCount() {
        return this.operationCount;
    }
    reset() {
        this.errors = [];
        this.operationCount = 0;
    }
}
exports.ErrorTracker = ErrorTracker;
/**
 * Test utilities for async operations
 */
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.waitFor = waitFor;
const runWithTimeout = async (promise, timeoutMs) => {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
};
exports.runWithTimeout = runWithTimeout;
//# sourceMappingURL=test-helpers.js.map