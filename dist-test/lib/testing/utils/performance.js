"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPerformanceResult = exports.calculateMemoryGrowth = exports.formatMemorySize = exports.formatDuration = exports.assertPerformance = exports.measurePerformance = void 0;
require("../matchers/jest-matchers");
/**
 * Measure performance of an operation
 */
async function measurePerformance(operation, options = {}) {
    const { iterations = 1, description } = options;
    const memoryBefore = process.memoryUsage();
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        await operation();
    }
    const duration = performance.now() - start;
    const memoryAfter = process.memoryUsage();
    if (description) {
        console.log(`${description}: ${duration.toFixed(2)}ms`);
    }
    return {
        duration,
        memoryBefore,
        memoryAfter,
        operations: iterations
    };
}
exports.measurePerformance = measurePerformance;
/**
 * Assert performance requirements
 */
function assertPerformance(result, limits, description) {
    const { duration, operations, memoryBefore, memoryAfter } = result;
    const durationPerOp = duration / operations;
    // Check operation duration
    if (limits.maxDurationPerOp) {
        const message = description ?
            `${description} operation time` :
            'Operation time';
        expect(durationPerOp).toBeLessThanWithMessage(limits.maxDurationPerOp, message);
    }
    // Check memory usage
    if (limits.maxMemoryGrowthMB) {
        const heapGrowth = memoryAfter.heapUsed - memoryBefore.heapUsed;
        const message = description ?
            `${description} memory growth` :
            'Memory growth';
        expect(heapGrowth).toHaveAcceptableMemoryGrowth(limits.maxMemoryGrowthMB, message);
    }
}
exports.assertPerformance = assertPerformance;
/**
 * Format a duration in milliseconds
 */
function formatDuration(ms) {
    if (ms < 1) {
        return `${(ms * 1000).toFixed(2)}μs`;
    }
    if (ms < 1000) {
        return `${ms.toFixed(2)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
}
exports.formatDuration = formatDuration;
/**
 * Format memory size in bytes
 */
function formatMemorySize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)}${units[unitIndex]}`;
}
exports.formatMemorySize = formatMemorySize;
/**
 * Calculate memory growth between two heap snapshots
 */
function calculateMemoryGrowth(before, after) {
    return after.heapUsed - before.heapUsed;
}
exports.calculateMemoryGrowth = calculateMemoryGrowth;
/**
 * Format performance results for logging
 */
function formatPerformanceResult(result, description) {
    const { duration, operations, memoryBefore, memoryAfter } = result;
    const durationPerOp = duration / operations;
    const memoryGrowth = calculateMemoryGrowth(memoryBefore, memoryAfter);
    return [
        description ? `${description}:` : '',
        `Total time: ${formatDuration(duration)}`,
        `Per operation: ${formatDuration(durationPerOp)}`,
        `Memory growth: ${formatMemorySize(memoryGrowth)}`,
        `Operations: ${operations}`
    ].filter(Boolean).join('\n');
}
exports.formatPerformanceResult = formatPerformanceResult;
//# sourceMappingURL=performance.js.map