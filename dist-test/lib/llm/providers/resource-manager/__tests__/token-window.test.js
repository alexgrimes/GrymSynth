"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_manager_1 = require("../context-manager");
const test_helpers_1 = require("../test-helpers");
describe('Token Window', () => {
    let contextManager;
    beforeEach(() => {
        contextManager = new context_manager_1.ContextManager();
    });
    afterEach(async () => {
        await contextManager.cleanup();
        jest.restoreAllMocks();
    });
    it('should enforce window size', async () => {
        const message = (0, test_helpers_1.createMockMessage)('user', 'A'.repeat(1000)); // Large message
        await contextManager.initializeContext('test', {
            maxTokens: 100,
            contextWindow: 100,
            responseTokens: 50
        });
        await expect(async () => {
            await contextManager.addMessage('test', message);
        }).rejects.toThrow('Token limit exceeded');
    });
    it('should optimize near window limit', async () => {
        const message1 = (0, test_helpers_1.createMockMessage)('user', 'A'.repeat(100));
        const message2 = (0, test_helpers_1.createMockMessage)('assistant', 'B'.repeat(100));
        await contextManager.initializeContext('test', {
            maxTokens: 200,
            contextWindow: 100,
            responseTokens: 50
        });
        await contextManager.addMessage('test', message1);
        await contextManager.addMessage('test', message2);
        const context = await contextManager.getContext('test');
        expect(context?.messages.length).toBeLessThan(2);
    });
    it('should maintain window after optimization', async () => {
        const message = (0, test_helpers_1.createMockMessage)('user', 'A'.repeat(200));
        await contextManager.initializeContext('test', {
            maxTokens: 300,
            contextWindow: 100,
            responseTokens: 50
        });
        await expect(async () => {
            await contextManager.addMessage('test', message);
        }).rejects.toThrow('Token limit exceeded');
    });
    it('should validate context window', async () => {
        await expect(async () => {
            await contextManager.initializeContext('test', {
                maxTokens: 100,
                contextWindow: -1,
                responseTokens: 50
            });
        }).rejects.toThrow('Context window must be greater than 0');
    });
});
//# sourceMappingURL=token-window.test.js.map