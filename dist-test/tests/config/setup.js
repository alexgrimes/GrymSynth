"use strict";
/// <reference types="./test-types.d.ts" />
// Mock global.gc if it doesn't exist
if (!global.gc) {
    global.gc = jest.fn();
}
// Mock performance.now if it doesn't exist
if (!global.performance) {
    global.performance = {
        now: jest.fn(() => Date.now())
    };
}
// Mock process.memoryUsage for consistent memory testing
const mockMemoryUsage = jest.fn().mockReturnValue({
    heapUsed: 100,
    heapTotal: 200,
    external: 50,
    rss: 300,
    arrayBuffers: 25
});
// Type assertion to ensure mock matches the expected function signature
process.memoryUsage = mockMemoryUsage;
// Set up common test utilities
beforeAll(() => {
    // Clear mocks before all tests
    jest.clearAllMocks();
});
afterAll(() => {
    // Clean up after all tests
    jest.restoreAllMocks();
});
// Add custom matchers
expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },
});
//# sourceMappingURL=setup.js.map