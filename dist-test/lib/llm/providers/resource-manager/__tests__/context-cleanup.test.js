"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_manager_1 = require("../context-manager");
const types_1 = require("../types");
const test_helpers_1 = require("../test/test-helpers");
describe('Context Cleanup', () => {
    let contextManager;
    beforeEach(() => {
        contextManager = new context_manager_1.ContextManager();
    });
    afterEach(async () => {
        await contextManager.cleanup().catch(() => {
            // Ignore cleanup errors in afterEach
        });
        jest.restoreAllMocks();
    });
    describe('Basic Cleanup', () => {
        it('should remove context when cleanup is called', async () => {
            // Initialize context
            await contextManager.initializeContext('test', test_helpers_1.testModelConstraints);
            await contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'));
            // Cleanup
            await contextManager.cleanup('test');
            // Verify cleanup
            const context = await contextManager.getContext('test');
            expect(context).toBeUndefined();
        });
        it('should cleanup all contexts when no id is provided', async () => {
            // Initialize multiple contexts
            await contextManager.initializeContext('test1', test_helpers_1.testModelConstraints);
            await contextManager.initializeContext('test2', test_helpers_1.testModelConstraints);
            // Cleanup all
            await contextManager.cleanup();
            // Verify all cleaned
            expect(await contextManager.getContext('test1')).toBeUndefined();
            expect(await contextManager.getContext('test2')).toBeUndefined();
        });
        it('should throw error when cleaning up non-existent context', async () => {
            await expect(contextManager.cleanup('nonexistent'))
                .rejects
                .toThrow(new types_1.ResourceError('CLEANUP_FAILED', 'Failed to clean up resources'));
        });
    });
    describe('Error Handling', () => {
        it('should cleanup context after error', async () => {
            // Initialize context
            await contextManager.initializeContext('test', test_helpers_1.testModelConstraints);
            // Mock calculateTokenCount to throw error
            jest.spyOn(contextManager, 'calculateTokenCount')
                .mockImplementation(() => {
                throw new types_1.ResourceError('RESOURCE_EXHAUSTED', 'Token limit exceeded');
            });
            // Attempt to add message which should trigger error
            await expect(contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'))).rejects.toThrow(new types_1.ResourceError('RESOURCE_EXHAUSTED', 'Token limit exceeded'));
            // Verify context was cleaned up
            const context = await contextManager.getContext('test');
            expect(context).toBeUndefined();
        });
        it('should handle cleanup errors gracefully', async () => {
            // Initialize context
            await contextManager.initializeContext('test', test_helpers_1.testModelConstraints);
            // Setup error handler
            const errorHandler = jest.fn();
            contextManager.on('error', errorHandler);
            // Mock emit to throw error during cleanup
            jest.spyOn(contextManager, 'emit')
                .mockImplementationOnce(() => { throw new Error('Cleanup error'); });
            // Attempt cleanup
            await expect(contextManager.cleanup('test'))
                .rejects
                .toThrow(new types_1.ResourceError('CLEANUP_FAILED', 'Failed to clean up resources'));
            expect(errorHandler).toHaveBeenCalledWith({
                type: 'error',
                error: expect.any(types_1.ResourceError),
                details: expect.any(Object)
            });
        });
    });
    describe('Resource Management', () => {
        it('should release memory after cleanup', async () => {
            const memoryBefore = process.memoryUsage().heapUsed;
            // Create large context
            await contextManager.initializeContext('test', {
                ...test_helpers_1.testModelConstraints,
                contextWindow: 4000,
                maxTokens: 1000
            });
            // Mock calculateTokenCount to return small value to avoid token limit
            jest.spyOn(contextManager, 'calculateTokenCount')
                .mockReturnValue(10);
            for (let i = 0; i < 100; i++) {
                await contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'.repeat(100)));
            }
            // Cleanup
            await contextManager.cleanup('test');
            // Force garbage collection if possible
            if (global.gc) {
                global.gc();
            }
            const memoryAfter = process.memoryUsage().heapUsed;
            expect(memoryAfter).toBeLessThan(memoryBefore * 1.1); // Allow 10% overhead
        });
        it('should emit cleanup events', async () => {
            const eventSpy = jest.spyOn(contextManager, 'emit');
            await contextManager.initializeContext('test', test_helpers_1.testModelConstraints);
            await contextManager.cleanup('test');
            expect(eventSpy).toHaveBeenCalledWith('contextCleanup', {
                type: 'contextCleanup',
                modelId: 'test',
                reason: 'explicit_cleanup',
                timestamp: expect.any(Number),
                contextDetails: expect.any(Object)
            });
        });
    });
    describe('Concurrent Operations', () => {
        it('should handle concurrent cleanup requests', async () => {
            await contextManager.initializeContext('test', test_helpers_1.testModelConstraints);
            // Trigger multiple concurrent cleanups
            await Promise.all([
                contextManager.cleanup('test'),
                contextManager.cleanup('test'),
                contextManager.cleanup('test')
            ].map(p => p.catch(() => {
                // Ignore errors from concurrent cleanups
            })));
            const context = await contextManager.getContext('test');
            expect(context).toBeUndefined();
        });
        it('should prevent operations on cleaned context', async () => {
            await expect(contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'))).rejects.toThrow(new types_1.ResourceError('CONTEXT_NOT_FOUND', 'Context not found for model: test'));
        });
    });
});
//# sourceMappingURL=context-cleanup.test.js.map