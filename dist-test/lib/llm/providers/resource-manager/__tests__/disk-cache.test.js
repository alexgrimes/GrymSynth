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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const resource_manager_1 = require("../resource-manager");
const types_1 = require("../types");
const test_helpers_1 = require("../test/test-helpers");
const fs = __importStar(require("fs/promises"));
describe('Disk Cache', () => {
    let resourceManager;
    const TEST_CONTEXT_ID = 'test-context';
    const CACHE_DIR = './test-cache';
    beforeEach(async () => {
        // Create cache directory if it doesn't exist
        await fs.mkdir(CACHE_DIR, { recursive: true });
        resourceManager = new resource_manager_1.ResourceManager({
            maxMemoryUsage: 1000,
            maxCpuUsage: 80,
            cacheDir: CACHE_DIR,
            maxCacheSize: 1024 * 1024 * 100,
            cacheEvictionPolicy: 'lru',
            cleanupInterval: 1000
        });
        await resourceManager.initializeContext(TEST_CONTEXT_ID, test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
    });
    afterEach(async () => {
        await resourceManager.cleanup();
        // Clean up test cache directory
        await fs.rm(CACHE_DIR, { recursive: true, force: true });
        jest.restoreAllMocks();
    });
    describe('Cache Operations', () => {
        it('should write context to disk cache', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test message');
            await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            // Verify context exists in memory
            const context = await resourceManager.getContext(TEST_CONTEXT_ID);
            expect(context).toBeDefined();
            expect(context?.messages[0].content).toBe(message.content);
            // Verify files were created
            const cacheFiles = await fs.readdir(CACHE_DIR);
            expect(cacheFiles.length).toBeGreaterThan(0);
        });
        it('should read context from disk cache', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test message');
            await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            // Clear memory and verify reload
            await resourceManager.cleanup();
            await resourceManager.initializeContext(TEST_CONTEXT_ID, test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            const context = await resourceManager.getContext(TEST_CONTEXT_ID);
            expect(context).toBeDefined();
            expect(context?.messages[0].content).toBe(message.content);
        });
        it('should handle cache miss gracefully', async () => {
            const nonExistentId = 'non-existent-context';
            const context = await resourceManager.getContext(nonExistentId);
            expect(context).toBeNull();
        });
        it('should maintain context metadata', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test message');
            await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            const context = await resourceManager.getContext(TEST_CONTEXT_ID);
            expect(context?.metadata).toBeDefined();
            expect(context?.metadata.lastAccess).toBeDefined();
            expect(context?.metadata.createdAt).toBeDefined();
            expect(context?.metadata.lastUpdated).toBeDefined();
        });
    });
    describe('Cache Management', () => {
        it('should respect memory limits', async () => {
            const smallCacheManager = new resource_manager_1.ResourceManager({
                maxMemoryUsage: 100,
                cacheDir: CACHE_DIR,
                maxCacheSize: 1024,
                cacheEvictionPolicy: 'lru'
            });
            // Add messages until memory limit is exceeded
            const messages = Array(10).fill(null).map((_, i) => (0, test_helpers_1.createTestMessage)(`test message ${i} `.repeat(50)));
            await expect(async () => {
                for (const message of messages) {
                    await smallCacheManager.addMessage(TEST_CONTEXT_ID, message);
                }
            }).rejects.toThrow(types_1.ResourceError);
        });
        it('should optimize resources under memory pressure', async () => {
            const messages = Array(5).fill(null).map((_, i) => (0, test_helpers_1.createTestMessage)(`test message ${i} `.repeat(100)));
            for (const message of messages) {
                await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            }
            const optimizeSpy = jest.spyOn(resourceManager, 'optimizeResources');
            await resourceManager.addMessage(TEST_CONTEXT_ID, (0, test_helpers_1.createTestMessage)('trigger optimization'));
            expect(optimizeSpy).toHaveBeenCalled();
        });
        it('should emit events during optimization', async () => {
            const eventHandler = jest.fn();
            resourceManager.on('memory_optimized', eventHandler);
            const messages = Array(5).fill(null).map((_, i) => (0, test_helpers_1.createTestMessage)(`test message ${i} `.repeat(100)));
            for (const message of messages) {
                await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            }
            await resourceManager.optimizeResources();
            expect(eventHandler).toHaveBeenCalled();
        });
        it('should handle concurrent operations', async () => {
            const operations = Array(5).fill(null).map((_, i) => resourceManager.addMessage(TEST_CONTEXT_ID, (0, test_helpers_1.createTestMessage)(`concurrent message ${i}`)));
            await Promise.all(operations);
            const context = await resourceManager.getContext(TEST_CONTEXT_ID);
            expect(context?.messages.length).toBe(5);
        });
    });
    describe('Error Handling', () => {
        it('should handle initialization errors', async () => {
            const invalidManager = new resource_manager_1.ResourceManager({
                maxMemoryUsage: -1,
                cacheDir: CACHE_DIR
            });
            await expect(invalidManager.initializeContext('test', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS)).rejects.toThrow();
        });
        it('should handle resource exhaustion', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test message '.repeat(1000));
            const exhaustionHandler = jest.fn();
            resourceManager.on('resourceExhausted', exhaustionHandler);
            await expect(resourceManager.addMessage(TEST_CONTEXT_ID, message)).rejects.toThrow(types_1.ResourceError);
            expect(exhaustionHandler).toHaveBeenCalled();
        });
        it('should handle cleanup errors gracefully', async () => {
            const mockFs = jest.spyOn(fs, 'rm').mockRejectedValueOnce(new Error('Cleanup error'));
            await expect(resourceManager.cleanup()).resolves.not.toThrow();
            mockFs.mockRestore();
        });
        it('should maintain consistency during errors', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test message');
            await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            // Simulate error during operation
            const mockFs = jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('Write error'));
            await expect(resourceManager.addMessage(TEST_CONTEXT_ID, (0, test_helpers_1.createTestMessage)('error message'))).resolves.not.toThrow();
            // Verify original message still exists
            const context = await resourceManager.getContext(TEST_CONTEXT_ID);
            expect(context?.messages[0].content).toBe(message.content);
            mockFs.mockRestore();
        });
    });
    describe('Integration', () => {
        it('should work with memory optimization', async () => {
            // Fill memory to trigger optimization
            const largeMessages = Array(5).fill(null).map((_, i) => (0, test_helpers_1.createTestMessage)(`large message ${i} `.repeat(100)));
            for (const message of largeMessages) {
                await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            }
            // Force optimization
            await resourceManager.optimizeResources();
            // Verify context integrity
            const context = await resourceManager.getContext(TEST_CONTEXT_ID);
            expect(context?.messages).toHaveLength(largeMessages.length);
        });
        it('should handle resource pressure events', async () => {
            const pressureHandler = jest.fn();
            resourceManager.on('resourcePressure', pressureHandler);
            // Add messages until pressure threshold
            const messages = Array(10).fill(null).map((_, i) => (0, test_helpers_1.createTestMessage)(`pressure message ${i} `.repeat(50)));
            for (const message of messages) {
                await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            }
            expect(pressureHandler).toHaveBeenCalled();
        });
        it('should maintain context integrity', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test message');
            await resourceManager.addMessage(TEST_CONTEXT_ID, message);
            // Simulate multiple operations
            await resourceManager.optimizeResources();
            await resourceManager.cleanup();
            await resourceManager.initializeContext(TEST_CONTEXT_ID, test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            const context = await resourceManager.getContext(TEST_CONTEXT_ID);
            expect(context?.messages[0].content).toBe(message.content);
        });
    });
});
//# sourceMappingURL=disk-cache.test.js.map