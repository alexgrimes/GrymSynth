"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_helpers_1 = require("./test-helpers");
const task_analyzer_1 = __importDefault(require("../task-analyzer"));
describe('TaskAnalyzer', () => {
    let analyzer;
    let mockRegistry;
    beforeEach(() => {
        mockRegistry = {
            findModels: jest.fn(),
            getModel: jest.fn(),
            listModels: jest.fn(),
            registerModel: jest.fn(),
            unregisterModel: jest.fn(),
            getModelChain: jest.fn().mockImplementation(async (requirements) => ({
                planner: (0, test_helpers_1.createMockModel)({
                    id: 'test-planner',
                    name: 'Test Planner',
                    capabilities: { reasoning: 0.9 }
                }),
                executor: (0, test_helpers_1.createMockModel)({
                    id: 'test-executor',
                    name: 'Test Executor',
                    capabilities: { [requirements.primaryCapability]: 0.9 }
                }),
                ...(requirements.priority === 'quality' && {
                    reviewer: (0, test_helpers_1.createMockModel)({
                        id: 'test-reviewer',
                        name: 'Test Reviewer',
                        capabilities: { analysis: 0.9 }
                    })
                })
            }))
        };
        analyzer = new task_analyzer_1.default();
    });
    it('should infer capabilities from task type', async () => {
        const task = (0, test_helpers_1.createTestTask)('architecture');
        const requirements = await analyzer.analyze(task);
        expect(requirements.primaryCapability).toBe('reasoning');
        expect(requirements.secondaryCapabilities).toContain('analysis');
        expect(requirements.secondaryCapabilities).toContain('code');
        expect(requirements.contextSize).toBeGreaterThan(4000);
    });
    it('should adjust context size based on task complexity', async () => {
        const smallTask = (0, test_helpers_1.createTestTask)('code_generation');
        const largeTask = {
            ...(0, test_helpers_1.createTestTask)('architecture'),
            input: { largeData: 'x'.repeat(10000) }
        };
        const smallReqs = await analyzer.analyze(smallTask);
        const largeReqs = await analyzer.analyze(largeTask);
        expect(largeReqs.contextSize).toBeGreaterThan(smallReqs.contextSize);
    });
    it('should handle invalid task types', async () => {
        const task = (0, test_helpers_1.createTestTask)('invalid_type');
        const requirements = await analyzer.analyze(task);
        expect(requirements.primaryCapability).toBe('reasoning');
    });
    it('should validate requirements', () => {
        const validReqs = {
            primaryCapability: 'reasoning',
            secondaryCapabilities: ['analysis'],
            minCapabilityScores: new Map([['reasoning', 0.8]]),
            contextSize: 4000,
            priority: 'quality'
        };
        expect(analyzer.validateRequirements(validReqs)).toBe(true);
    });
    it('should handle resource constraints', async () => {
        const task = (0, test_helpers_1.createTestTask)('code_generation', 'efficiency', {
            resourceConstraints: {
                maxMemory: 1000,
                maxCpu: 0.8,
                maxLatency: 200
            }
        });
        const requirements = await analyzer.analyze(task);
        expect(requirements.resourceConstraints).toBeDefined();
        expect(requirements.resourceConstraints.maxMemory).toBe(1000);
        expect(requirements.resourceConstraints.maxCpu).toBe(0.8);
        expect(requirements.resourceConstraints.maxLatency).toBe(200);
    });
});
//# sourceMappingURL=task-analyzer.test.js.map