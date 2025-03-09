"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const provider_resource_manager_1 = require("../provider-resource-manager");
const test_helpers_1 = require("../test/test-helpers");
const types_1 = require("../types");
const mock_llm_provider_1 = require("../test/mock-llm-provider");
const testConfig = {
    maxMemoryUsage: 1024 * 1024 * 1024,
    maxCpuUsage: 80,
    optimizationThreshold: 0.8,
    cleanupInterval: 1000,
    cacheDir: './test-cache',
    limits: {
        maxModels: 5,
        maxTokensPerModel: 8192,
        maxTotalTokens: 32768
    },
    contextPreservation: {
        enabled: true,
        maxSize: 1024 * 1024,
        preservationStrategy: 'hybrid'
    },
    debug: true
};
describe('LLM Integration Tests', () => {
    let resourceManager;
    let audioProvider;
    let compositionProvider;
    beforeEach(async () => {
        audioProvider = new mock_llm_provider_1.MockLLMProvider('audio', 'mock://audio', 4096, 'audio-specialist', {
            maxTokens: 1000,
            resourceUsage: {
                memoryUsage: 0,
                cpuUsage: 0,
                tokenCount: 0,
                messageCount: 0
            }
        });
        compositionProvider = new mock_llm_provider_1.MockLLMProvider('composition', 'mock://composition', 4096, 'composition-specialist', {
            maxTokens: 1000,
            resourceUsage: {
                memoryUsage: 0,
                cpuUsage: 0,
                tokenCount: 0,
                messageCount: 0
            }
        });
        resourceManager = new provider_resource_manager_1.ProviderResourceManager(testConfig);
        // Initialize providers
        await resourceManager.registerProvider('audio', audioProvider);
        await resourceManager.registerProvider('composition', compositionProvider);
    });
    afterEach(async () => {
        await resourceManager.cleanup();
    });
    describe('Provider Failure Handling', () => {
        it('should handle provider failures gracefully', async () => {
            const errorProvider = new mock_llm_provider_1.MockLLMProvider('error-prone', 'mock://error', 4096, 'audio-specialist', {
                failOnPurpose: true
            });
            await resourceManager.registerProvider('error', errorProvider);
            const message = (0, test_helpers_1.createTestMessage)('Trigger error');
            await expect(resourceManager.processMessage('error', message))
                .rejects
                .toThrow(types_1.ResourceError);
            // Verify provider is marked as ready after error
            const metrics = errorProvider.getResourceMetrics();
            expect(metrics.status).toBe('ready');
        });
        it('should handle token limit exceeded errors', async () => {
            const limitedProvider = new mock_llm_provider_1.MockLLMProvider('limited', 'mock://limited', 4096, 'audio-specialist', {
                maxTokens: 10
            });
            await resourceManager.registerProvider('limited', limitedProvider);
            const longMessage = (0, test_helpers_1.createTestMessage)('This is a very long message that should exceed the token limit');
            await expect(resourceManager.processMessage('limited', longMessage))
                .rejects
                .toThrow('Token limit exceeded');
        });
    });
    describe('Resource Pressure Events', () => {
        it('should emit resource pressure events when approaching limits', async () => {
            // Create provider with low threshold
            const highMemProvider = (0, test_helpers_1.createTestProvider)('high-mem', {
                specialization: 'audio-specialist',
                resourceUsage: {
                    memoryUsage: 0.7,
                    cpuUsage: 0.5,
                    tokenCount: 100,
                    messageCount: 1
                }
            });
            // Register provider and set its resource manager
            await resourceManager.registerProvider('high-memory', highMemProvider);
            highMemProvider.setResourceManager(resourceManager);
            // Set up event listener first
            const eventPromise = (0, test_helpers_1.waitForEvent)(resourceManager, 'resourcePressure', 2000);
            // Then trigger pressure
            await (0, test_helpers_1.simulateResourcePressure)(highMemProvider);
            // Wait for event
            const event = await eventPromise;
            expect(event).toBeDefined();
            expect(event.data.pressure).toBeGreaterThan(0.8);
            expect(event.data.source).toBe('memory');
        });
    });
    describe('Resource Usage Tracking', () => {
        it('should track resource usage across providers', async () => {
            const message = (0, test_helpers_1.createTestMessage)('Test resource monitoring');
            // Process messages on both providers
            await resourceManager.processMessage('audio', message);
            await resourceManager.processMessage('composition', message);
            // Get metrics after processing
            const audioMetrics = audioProvider.getResourceMetrics();
            const compositionMetrics = compositionProvider.getResourceMetrics();
            // Verify resource tracking
            expect(audioMetrics.memoryUsage).toBeGreaterThan(0);
            expect(compositionMetrics.memoryUsage).toBeGreaterThan(0);
            expect(audioMetrics.messageCount).toBe(2); // Original message + response
            expect(compositionMetrics.messageCount).toBe(2);
            expect(audioMetrics.tokenCount).toBeGreaterThan(0);
            expect(compositionMetrics.tokenCount).toBeGreaterThan(0);
        });
        it('should optimize resources under memory pressure', async () => {
            const highMemoryProvider = new mock_llm_provider_1.MockLLMProvider('high-memory', 'mock://high-mem', 4096, 'audio-specialist', {
                memoryThreshold: 0.8,
                resourceUsage: {
                    memoryUsage: testConfig.maxMemoryUsage * 0.9,
                    cpuUsage: 0,
                    tokenCount: 0,
                    messageCount: 0
                }
            });
            await resourceManager.registerProvider('high-memory', highMemoryProvider);
            const message = (0, test_helpers_1.createTestMessage)('Test memory optimization');
            await resourceManager.processMessage('high-memory', message);
            const metrics = highMemoryProvider.getResourceMetrics();
            expect(metrics.memoryUsage).toBeLessThan(testConfig.maxMemoryUsage);
        });
    });
    describe('Context Management', () => {
        it('should maintain context when switching between providers', async () => {
            const message = (0, test_helpers_1.createTestMessage)('Analyze this audio sample');
            await resourceManager.processMessage('audio', message);
            await resourceManager.switchProvider('audio', 'composition');
            const compositionState = compositionProvider.getContextState();
            expect(compositionState.messages).toHaveLength(2); // Original message + response
            expect(compositionState.messages[0]).toMatchObject({
                role: message.role,
                content: message.content
            });
        });
        it('should accurately track token counts across provider switches', async () => {
            const messages = [
                (0, test_helpers_1.createTestMessage)('First message'),
                (0, test_helpers_1.createTestMessage)('Second message')
            ];
            for (const message of messages) {
                await resourceManager.processMessage('audio', message);
            }
            const audioState = audioProvider.getContextState();
            const expectedTokenCount = Math.ceil((messages[0].content.length + messages[1].content.length) / 4);
            expect(audioState.tokenCount).toBeGreaterThanOrEqual(expectedTokenCount);
            await resourceManager.switchProvider('audio', 'composition');
            const compositionState = compositionProvider.getContextState();
            expect(compositionState.tokenCount).toBeGreaterThanOrEqual(expectedTokenCount);
        });
    });
});
//# sourceMappingURL=llm-integration.test.js.map