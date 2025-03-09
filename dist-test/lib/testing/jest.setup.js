"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMORY_LIMIT = exports.testEnv = void 0;
require("./test-setup/setup-env");
const memory_profile_1 = require("./memory-profile");
const memory_viz_1 = require("./memory-viz");
// Initialize test environment
const MEMORY_LIMIT = 16 * 1024 * 1024 * 1024; // 16GB
exports.MEMORY_LIMIT = MEMORY_LIMIT;
exports.testEnv = {
    memoryProfiler: new memory_profile_1.MemoryProfiler(MEMORY_LIMIT),
    memoryVisualizer: new memory_viz_1.MemoryVisualizer(),
    MEMORY_LIMIT,
    forceGC: async () => {
        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
};
// Custom matchers
expect.extend({
    toBeWithinMemoryLimit(received, limit) {
        const pass = received <= limit;
        return {
            message: () => `expected ${this.utils.printReceived(received)} to ${pass ? 'not ' : ''}be within memory limit ${this.utils.printExpected(limit)}`,
            pass,
        };
    },
    toHaveAcceptableMemoryGrowth(received, initialMemory, threshold = 0.1) {
        const growth = received - initialMemory;
        const percentGrowth = growth / initialMemory;
        const pass = percentGrowth <= threshold;
        return {
            message: () => `expected memory growth ${this.utils.printReceived(percentGrowth * 100)}% to ${pass ? 'not ' : ''}be within threshold ${this.utils.printExpected(threshold * 100)}%`,
            pass,
        };
    },
});
// Global test configuration
jest.setTimeout(30000); // 30 seconds
// Before each test suite
beforeAll(async () => {
    await exports.testEnv.forceGC();
    exports.testEnv.memoryProfiler.start();
});
// After each test suite
afterAll(async () => {
    exports.testEnv.memoryProfiler.stop();
    const snapshot = await exports.testEnv.memoryProfiler.getActualMemoryUsage();
    exports.testEnv.memoryVisualizer.track(snapshot);
    await exports.testEnv.forceGC();
    const reportPath = 'reports/memory/memory-visualization.html';
    await exports.testEnv.memoryVisualizer.generateReport(reportPath, MEMORY_LIMIT);
    console.log(`Memory visualization report generated at: ${reportPath}`);
});
// Before each test
beforeEach(async () => {
    await exports.testEnv.forceGC();
});
// After each test
afterEach(async () => {
    await exports.testEnv.forceGC();
});
//# sourceMappingURL=jest.setup.js.map