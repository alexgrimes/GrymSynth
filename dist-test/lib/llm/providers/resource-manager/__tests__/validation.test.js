"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const test_helpers_1 = require("../test/test-helpers");
const context_manager_1 = require("../context-manager");
describe('Message Validation', () => {
    let contextManager;
    beforeEach(async () => {
        contextManager = new context_manager_1.ContextManager();
        await contextManager.initializeContext('test', test_helpers_1.testModelConstraints);
    });
    afterEach(() => {
        contextManager.cleanup();
        jest.restoreAllMocks();
    });
    describe('Content Validation', () => {
        it('should reject empty messages', async () => {
            const emptyMessage = (0, test_helpers_1.createTestMessage)('');
            await expect(contextManager.addMessage('test', emptyMessage)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content cannot be empty'));
        });
        it('should reject whitespace-only messages', async () => {
            const whitespaceMessage = (0, test_helpers_1.createTestMessage)('   ');
            await expect(contextManager.addMessage('test', whitespaceMessage)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content cannot be empty'));
        });
        it('should reject undefined content', async () => {
            const invalidMessage = (0, test_helpers_1.createTestMessage)(undefined);
            await expect(contextManager.addMessage('test', invalidMessage)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content cannot be empty'));
        });
        it('should reject null content', async () => {
            const invalidMessage = (0, test_helpers_1.createTestMessage)(null);
            await expect(contextManager.addMessage('test', invalidMessage)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content cannot be empty'));
        });
    });
    describe('Type Validation', () => {
        it('should reject non-string content', async () => {
            const numberMessage = (0, test_helpers_1.createTestMessage)(123);
            await expect(contextManager.addMessage('test', numberMessage)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content must be a string'));
        });
        it('should reject object content', async () => {
            const objectMessage = (0, test_helpers_1.createTestMessage)({ text: 'test' });
            await expect(contextManager.addMessage('test', objectMessage)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content must be a string'));
        });
        it('should reject array content', async () => {
            const arrayMessage = (0, test_helpers_1.createTestMessage)(['test']);
            await expect(contextManager.addMessage('test', arrayMessage)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message content must be a string'));
        });
    });
    describe('Role Validation', () => {
        it('should reject missing role', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test');
            delete message.role;
            await expect(contextManager.addMessage('test', message)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Message role is required'));
        });
        it('should reject invalid role', async () => {
            const message = (0, test_helpers_1.createTestMessage)('test');
            message.role = 'invalid';
            await expect(contextManager.addMessage('test', message)).rejects.toThrow(new types_1.ResourceError('INVALID_MESSAGE', 'Invalid message role: invalid'));
        });
        it('should accept valid roles', async () => {
            const validRoles = ['user', 'assistant', 'system'];
            for (const role of validRoles) {
                const message = (0, test_helpers_1.createTestMessage)('test');
                message.role = role;
                await expect(contextManager.addMessage('test', message)).resolves.not.toThrow();
            }
        });
    });
    describe('Message Size', () => {
        it('should reject messages exceeding max size', async () => {
            const largeContent = 'x'.repeat(test_helpers_1.testModelConstraints.maxTokens + 1);
            const largeMessage = (0, test_helpers_1.createTestMessage)(largeContent);
            await expect(contextManager.addMessage('test', largeMessage)).rejects.toThrow(new types_1.ResourceError('MESSAGE_TOO_LARGE', 'Message exceeds maximum allowed size'));
        });
        it('should accept messages within size limit', async () => {
            const validContent = 'x'.repeat(test_helpers_1.testModelConstraints.maxTokens - 1);
            const validMessage = (0, test_helpers_1.createTestMessage)(validContent);
            await expect(contextManager.addMessage('test', validMessage)).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=validation.test.js.map