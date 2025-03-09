"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureExecutionTime = exports.withTimeout = exports.createTimeoutPromise = exports.simulateAsyncOperation = exports.wait = exports.TEST_THRESHOLDS = exports.TEST_MEMORY_SIZES = exports.TEST_TIMEOUTS = void 0;
__exportStar(require("./test-config"), exports);
__exportStar(require("../test-helpers"), exports);
// Test constants
exports.TEST_TIMEOUTS = {
    SHORT: 100,
    MEDIUM: 1000,
    LONG: 5000
};
exports.TEST_MEMORY_SIZES = {
    SMALL: 1000,
    MEDIUM: 5000,
    LARGE: 10000 // 10GB
};
exports.TEST_THRESHOLDS = {
    LOW: 0.1,
    MEDIUM: 0.5,
    HIGH: 0.8,
    CRITICAL: 0.9
};
// Helper function to wait for a specific duration
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.wait = wait;
// Helper function to simulate async operations
const simulateAsyncOperation = async (result, delay = exports.TEST_TIMEOUTS.SHORT) => {
    await (0, exports.wait)(delay);
    return result;
};
exports.simulateAsyncOperation = simulateAsyncOperation;
// Helper function to create a promise that rejects after a timeout
const createTimeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms));
exports.createTimeoutPromise = createTimeoutPromise;
// Helper function to run an operation with timeout
const withTimeout = async (operation, timeout = exports.TEST_TIMEOUTS.MEDIUM) => {
    return Promise.race([
        operation,
        (0, exports.createTimeoutPromise)(timeout)
    ]);
};
exports.withTimeout = withTimeout;
// Helper function to measure execution time
const measureExecutionTime = async (operation) => {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    return { result, duration };
};
exports.measureExecutionTime = measureExecutionTime;
//# sourceMappingURL=index.js.map