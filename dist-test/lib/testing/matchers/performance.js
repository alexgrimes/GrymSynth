"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMatchers = void 0;
/**
 * Custom matchers for performance testing
 */
const performanceMatchers = {
    toBeLessThanTime(received, expected, description) {
        const pass = received < expected;
        const message = () => `${description || 'Operation'} took ${received.toFixed(2)}ms, ` +
            `${pass ? 'less' : 'more'} than expected ${expected}ms`;
        return { pass, message };
    },
    toHaveStableMemoryUsage(initialHeap, finalHeap, maxGrowthMB = 50) {
        const heapGrowth = finalHeap - initialHeap;
        const maxGrowthBytes = maxGrowthMB * 1024 * 1024;
        const pass = heapGrowth < maxGrowthBytes;
        const message = () => `Memory growth was ${(heapGrowth / 1024 / 1024).toFixed(2)}MB, ` +
            `${pass ? 'less' : 'more'} than limit of ${maxGrowthMB}MB`;
        return { pass, message };
    }
};
exports.performanceMatchers = performanceMatchers;
expect.extend(performanceMatchers);
//# sourceMappingURL=performance.js.map