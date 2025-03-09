"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_manager_1 = require("../resource-manager");
const types_1 = require("../types");
const test_helpers_1 = require("../test/test-helpers");
describe('Context Management', () => {
    let resourceManager;
    beforeEach(() => {
        resourceManager = new resource_manager_1.ResourceManager({
            maxMemoryUsage: 1000,
            maxCpuUsage: 80,
            optimizationThreshold: 0.8,
            cleanupInterval: 1000
        });
    });
    afterEach(async () => {
        await resourceManager.cleanup();
        jest.restoreAllMocks();
    });
    describe('Context Initialization', () => {
        it('should initialize context with valid constraints', async () => {
            const constraints = (0, test_helpers_1.createTestModelConstraints)();
            await resourceManager.initializeContext('test', constraints);
            const resources = await resourceManager.getCurrentResources();
            expect(resources.modelConstraints).toBeDefined();
        });
        it('should reject invalid context window', async () => {
            const invalidConstraints = (0, test_helpers_1.createTestModelConstraints)({ contextWindow: -1 });
            await expect(resourceManager.initializeContext('test', invalidConstraints)).rejects.toThrow(types_1.ResourceError);
        });
        it('should handle multiple contexts', async () => {
            await resourceManager.initializeContext('test1', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            await resourceManager.initializeContext('test2', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            const resources = await resourceManager.getCurrentResources();
            expect(resources.memory).toBeGreaterThan(0);
        });
    });
    describe('Context Updates', () => {
        it('should update context with new messages', async () => {
            await resourceManager.initializeContext('test', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            await resourceManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test message'));
            const resources = await resourceManager.getCurrentResources();
            expect(resources.memory).toBeGreaterThan(0);
        });
        it('should track memory usage per context', async () => {
            await resourceManager.initializeContext('test1', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            await resourceManager.initializeContext('test2', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            const initialResources = await resourceManager.getCurrentResources();
            await resourceManager.addMessage('test1', (0, test_helpers_1.createTestMessage)('test message 1'));
            await resourceManager.addMessage('test2', (0, test_helpers_1.createTestMessage)('test message 2'));
            const updatedResources = await resourceManager.getCurrentResources();
            expect(updatedResources.memory).toBeGreaterThan(initialResources.memory || 0);
        });
    });
    describe('Context Cleanup', () => {
        it('should cleanup unused contexts', async () => {
            await resourceManager.initializeContext('test', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            await resourceManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test message'));
            const initialResources = await resourceManager.getCurrentResources();
            await resourceManager.cleanup();
            const finalResources = await resourceManager.getCurrentResources();
            expect(finalResources.memory).toBeLessThan(initialResources.memory || Infinity);
        });
        it('should preserve active contexts during cleanup', async () => {
            await resourceManager.initializeContext('test', test_helpers_1.DEFAULT_MODEL_CONSTRAINTS);
            await resourceManager.addMessage('test', (0, test_helpers_1.createTestMessage)('test message'));
            // Mock current usage
            jest.spyOn(resourceManager, 'getCurrentResources').mockResolvedValue((0, test_helpers_1.createTestSystemResources)({
                memory: 500,
                totalMemory: 1000,
                memoryPressure: 0.5
            }));
            await resourceManager.cleanup();
            const context = await resourceManager.getContext('test');
            expect(context).toBeDefined();
        });
    });
});
//# sourceMappingURL=context-management.test.js.map