"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_manager_1 = require("../context-manager");
const test_helpers_1 = require("../test-helpers");
describe('Message Truncation', () => {
    let contextManager;
    beforeEach(() => {
        contextManager = new context_manager_1.ContextManager();
    });
    afterEach(async () => {
        await contextManager.cleanup();
        jest.restoreAllMocks();
    });
    it('should truncate messages near window limit', async () => {
        const message1 = (0, test_helpers_1.createMockMessage)('user', 'A'.repeat(50));
        const message2 = (0, test_helpers_1.createMockMessage)('assistant', 'B'.repeat(50));
        await contextManager.initializeContext('test', {
            maxTokens: 100,
            contextWindow: 50,
            responseTokens: 25
        });
        await contextManager.addMessage('test', message1);
        await contextManager.addMessage('test', message2);
        const context = await contextManager.getContext('test');
        expect(context?.messages.length).toBe(1);
        expect(context?.messages[0].content).toBe('B'.repeat(50));
    });
    it('should preserve most recent message', async () => {
        const message1 = (0, test_helpers_1.createMockMessage)('user', 'A'.repeat(30));
        const message2 = (0, test_helpers_1.createMockMessage)('assistant', 'B'.repeat(30));
        const message3 = (0, test_helpers_1.createMockMessage)('user', 'C'.repeat(30));
        await contextManager.initializeContext('test', {
            maxTokens: 100,
            contextWindow: 50,
            responseTokens: 25
        });
        await contextManager.addMessage('test', message1);
        await contextManager.addMessage('test', message2);
        await contextManager.addMessage('test', message3);
        const context = await contextManager.getContext('test');
        expect(context?.messages[context.messages.length - 1].content).toBe('C'.repeat(30));
    });
    it('should preserve message order', async () => {
        const messages = [
            (0, test_helpers_1.createMockMessage)('user', 'First'),
            (0, test_helpers_1.createMockMessage)('assistant', 'Second'),
            (0, test_helpers_1.createMockMessage)('user', 'Third')
        ];
        await contextManager.initializeContext('test', {
            maxTokens: 100,
            contextWindow: 50,
            responseTokens: 25
        });
        for (const message of messages) {
            await contextManager.addMessage('test', message);
        }
        const context = await contextManager.getContext('test');
        const contents = context?.messages.map(m => m.content);
        expect(contents).toEqual(expect.arrayContaining(['Second', 'Third']));
        expect(contents?.[contents.length - 1]).toBe('Third');
    });
    it('should trigger optimization at threshold', async () => {
        const message = (0, test_helpers_1.createMockMessage)('user', 'A'.repeat(90));
        await contextManager.initializeContext('test', {
            maxTokens: 200,
            contextWindow: 100,
            responseTokens: 50
        });
        await contextManager.addMessage('test', message);
        const context = await contextManager.getContext('test');
        expect(context?.tokens).toBeLessThan(90);
    });
});
//# sourceMappingURL=message-truncation.test.js.map