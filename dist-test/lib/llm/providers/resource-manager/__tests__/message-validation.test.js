"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const context_manager_1 = require("../context-manager");
const createValidMessage = (content) => ({
    content,
    role: 'user',
    timestamp: Date.now()
});
const createInvalidMessage = (override) => ({
    ...createValidMessage('test'),
    ...override
});
describe('Message Validation', () => {
    let contextManager;
    beforeEach(() => {
        contextManager = new context_manager_1.ContextManager();
    });
    afterEach(async () => {
        await contextManager.cleanup();
        jest.restoreAllMocks();
    });
    describe('Message Content Validation', () => {
        it('should reject empty messages', async () => {
            await expect(contextManager.addMessage('test', createInvalidMessage({ content: '' }))).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content cannot be empty'));
        });
        it('should reject undefined messages', async () => {
            await expect(contextManager.addMessage('test', undefined)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message cannot be null or undefined'));
        });
        it('should reject whitespace-only messages', async () => {
            await expect(contextManager.addMessage('test', createInvalidMessage({ content: '   ' }))).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content cannot be empty'));
        });
    });
    describe('Message Type Validation', () => {
        it('should validate message object structure', async () => {
            await expect(contextManager.addMessage('test', { content: 123 })).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content must be a string'));
        });
        it('should validate role field', async () => {
            await expect(contextManager.addMessage('test', createInvalidMessage({ role: 'user' }))).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Invalid message role'));
        });
        it('should accept valid roles', async () => {
            await contextManager.initializeContext('test', {
                contextWindow: 1000,
                maxTokens: 500,
                responseTokens: 100
            });
            const validRoles = ['user', 'assistant', 'system'];
            for (const role of validRoles) {
                const message = createValidMessage('test content');
                message.role = role;
                await expect(contextManager.addMessage('test', message)).resolves.not.toThrow();
            }
        });
    });
    describe('Message Size Validation', () => {
        beforeEach(async () => {
            // Initialize context with very small limits to trigger size validation
            await contextManager.initializeContext('test', {
                contextWindow: 10,
                maxTokens: 5,
                responseTokens: 2
            });
        });
        it('should reject messages exceeding size limit', async () => {
            const largeContent = 'x'.repeat(1000); // Will exceed token limit
            let error;
            try {
                await contextManager.addMessage('test', createValidMessage(largeContent));
            }
            catch (e) {
                error = e;
            }
            expect(error).toBeDefined();
            expect(error).toBeInstanceOf(types_1.ResourceError);
            expect(error instanceof types_1.ResourceError && error.code).toBe('RESOURCE_EXHAUSTED');
        });
        it('should accept messages within size limit', async () => {
            const validContent = 'test'; // Small enough to be within limit
            await expect(contextManager.addMessage('test', createValidMessage(validContent))).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=message-validation.test.js.map