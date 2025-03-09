"use strict";
/// <reference types="jest" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.customMatchers = void 0;
/**
 * Custom matcher extensions for Jest
 */
const customMatchers = {
    toBeLessThanWithMessage(received, expected, message) {
        const pass = received < expected;
        const defaultMessage = `Expected ${received} to be less than ${expected}`;
        return {
            pass,
            message: () => message || defaultMessage
        };
    },
    toHaveAcceptableMemoryGrowth(heapGrowth, maxGrowthMB, message) {
        const maxGrowthBytes = maxGrowthMB * 1024 * 1024;
        const pass = heapGrowth < maxGrowthBytes;
        const defaultMessage = `Memory growth of ${(heapGrowth / 1024 / 1024).toFixed(2)}MB ` +
            `exceeds limit of ${maxGrowthMB}MB`;
        return {
            pass,
            message: () => message || defaultMessage
        };
    }
};
exports.customMatchers = customMatchers;
// Add custom matchers to Jest
expect.extend(customMatchers);
//# sourceMappingURL=jest-matchers.js.map