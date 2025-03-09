"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_manager_1 = require("../context-manager");
const test_helpers_1 = require("../test/test-helpers");
const types_1 = require("../types");
describe('Circuit Breaker', () => {
    let contextManager;
    beforeEach(async () => {
        contextManager = new context_manager_1.ContextManager();
        await contextManager.initializeContext('test', test_helpers_1.testModelConstraints);
    });
    afterEach(() => {
        contextManager.cleanup();
        jest.restoreAllMocks();
    });
    it('should limit repeated failures', async () => {
        let attempts = 0;
        // Mock calculateTokenCount to fail consistently
        jest.spyOn(contextManager, 'calculateTokenCount')
            .mockImplementation(() => {
            attempts++;
            throw new Error('Test failure');
        });
        // Try operation multiple times
        for (let i = 0; i < 4; i++) {
            try {
                await contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'));
            }
            catch (error) {
                // Expected to fail
            }
        }
        // Should stop before max attempts (threshold is 4)
        expect(attempts).toBeLessThan(5);
        // Additional attempt should be blocked by circuit breaker
        await expect(contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'))).rejects.toThrow(new types_1.ResourceError('CIRCUIT_BREAKER', 'Circuit breaker is open'));
    });
    it('should reset after cooling period', async () => {
        let attempts = 0;
        const now = Date.now();
        const dateSpy = jest.spyOn(Date, 'now');
        dateSpy.mockReturnValue(now);
        // Mock calculateTokenCount to fail consistently
        jest.spyOn(contextManager, 'calculateTokenCount')
            .mockImplementation(() => {
            attempts++;
            throw new Error('Test failure');
        });
        // Trigger failures until circuit breaker opens
        for (let i = 0; i < 4; i++) {
            try {
                await contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'));
            }
            catch (error) {
                // Expected to fail
            }
        }
        // Verify circuit breaker is open
        await expect(contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'))).rejects.toThrow(new types_1.ResourceError('CIRCUIT_BREAKER', 'Circuit breaker is open'));
        // Move time forward past cooling period
        dateSpy.mockReturnValue(now + 61000); // 61 seconds later
        attempts = 0; // Reset counter
        // Should be able to try again
        try {
            await contextManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test'));
        }
        catch (error) {
            // Should fail with original error, not circuit breaker
            expect(error).not.toBeInstanceOf(types_1.ResourceError);
            expect(error.message).toBe('Test failure');
        }
        // Should have attempted once after reset
        expect(attempts).toBe(1);
        dateSpy.mockRestore();
    });
});
//# sourceMappingURL=circuit-breaker.test.js.map