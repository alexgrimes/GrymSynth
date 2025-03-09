"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_context_1 = require("../test-context");
const error_test_utils_1 = require("../error-test-utils");
describe('Error Handling', () => {
    let context;
    beforeEach(async () => {
        context = await test_context_1.TestContext.create();
    });
    afterEach(async () => {
        await context.cleanup();
    });
    it('handles resource exhaustion', async () => {
        expect.assertions(2);
        const error = error_test_utils_1.ErrorTestUtils.createResourceError('exhausted');
        try {
            await context.mockError(error);
        }
        catch (e) {
            expect(context.healthMonitor.getStatus()).toBe('warning');
            expect(context.resourcePool.getMetrics().lastError).toBe(error);
        }
    });
    it('updates health state on repeated errors', async () => {
        expect.assertions(2);
        try {
            await context.mockError(error_test_utils_1.ErrorTestUtils.createResourceError('exhausted'));
        }
        catch (e) {
            expect(context.healthMonitor.getStatus()).toBe('warning');
        }
        try {
            await context.mockError(error_test_utils_1.ErrorTestUtils.createResourceError('stale'));
        }
        catch (e) {
            expect(context.healthMonitor.getStatus()).toBe('error');
        }
    });
    it('propagates errors through orchestration', async () => {
        expect.assertions(3);
        const testError = error_test_utils_1.ErrorTestUtils.createErrorWithContext('Resource allocation failed', {
            code: 'ALLOCATION_FAILED',
            details: {
                resourceId: 'test-1',
                timestamp: new Date().toISOString()
            }
        });
        try {
            await context.mockError(testError);
        }
        catch (error) {
            const state = context.healthMonitor.getFullState();
            expect(error).toBe(testError);
            expect(state.health).toBe('warning');
            expect(state.metrics.lastError).toBe(testError);
        }
    });
    it('resets health state after cleanup', async () => {
        expect.assertions(4);
        try {
            await context.mockError(error_test_utils_1.ErrorTestUtils.createResourceError('exhausted'));
        }
        catch (e) {
            expect(context.healthMonitor.getStatus()).toBe('warning');
        }
        await context.reset();
        expect(context.healthMonitor.getStatus()).toBe('healthy');
        const fullState = context.healthMonitor.getFullState();
        expect(fullState.errorCount).toBe(0);
        expect(context.resourcePool.getMetrics().lastError).toBeNull();
    });
});
//# sourceMappingURL=error-handling.test.js.map