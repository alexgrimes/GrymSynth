"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_manager_1 = require("../context-manager");
const test_helpers_1 = require("../test-helpers");
describe('Token Counting', () => {
    let contextManager;
    beforeEach(() => {
        contextManager = new context_manager_1.ContextManager();
    });
    afterEach(async () => {
        await contextManager.cleanup();
        jest.restoreAllMocks();
    });
    it('should count tokens in simple message', async () => {
        const message = (0, test_helpers_1.createMockMessage)('user', 'This is a test');
        await contextManager.initializeContext('test', {
            maxTokens: 100,
            contextWindow: 2000,
            responseTokens: 500
        });
        await contextManager.addMessage('test', message);
        const context = await contextManager.getContext('test');
        // "This is a test" (14 chars / 3 ≈ 5) + 3 whitespace + 0 special chars + 5 role = 13 * 0.5 ≈ 7
        expect(context?.tokens).toBe(7);
    });
    it('should reject empty message', async () => {
        const message = (0, test_helpers_1.createMockMessage)('user', '');
        await contextManager.initializeContext('test', {
            maxTokens: 100,
            contextWindow: 2000,
            responseTokens: 500
        });
        await expect(async () => {
            await contextManager.addMessage('test', message);
        }).rejects.toThrow('Message content cannot be empty');
    });
    it('should count tokens with punctuation', async () => {
        const message = (0, test_helpers_1.createMockMessage)('user', 'Hello, world!');
        await contextManager.initializeContext('test', {
            maxTokens: 100,
            contextWindow: 2000,
            responseTokens: 500
        });
        await contextManager.addMessage('test', message);
        const context = await contextManager.getContext('test');
        // "Hello, world!" (12 chars / 3 = 4) + 1 whitespace + 2 special chars + 5 role = 12 * 0.5 = 6
        expect(context?.tokens).toBe(6);
    });
});
//# sourceMappingURL=token-counting.test.js.map