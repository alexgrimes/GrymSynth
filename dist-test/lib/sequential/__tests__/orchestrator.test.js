"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const orchestrator_1 = require("../orchestrator");
const memory_profile_1 = require("../../testing/memory-profile");
const jest_setup_1 = require("../../testing/jest.setup");
describe('Sequential Orchestrator Memory Tests', () => {
    let orchestrator;
    let profiler;
    const MEMORY_LIMIT = 16 * 1024 * 1024 * 1024; // 16GB
    beforeEach(async () => {
        profiler = new memory_profile_1.MemoryProfiler(MEMORY_LIMIT);
        orchestrator = new orchestrator_1.SequentialOrchestrator(MEMORY_LIMIT);
        await (0, jest_setup_1.forceGC)();
    });
    afterEach(async () => {
        await orchestrator.unloadModel();
        await (0, jest_setup_1.forceGC)();
    });
    it('should respect memory limits when loading models', async () => {
        const models = [
            {
                id: 'small',
                name: 'Small Model',
                memoryRequirement: 2 * 1024 * 1024 * 1024,
                capabilities: { transcription: true }
            },
            {
                id: 'medium',
                name: 'Medium Model',
                memoryRequirement: 8 * 1024 * 1024 * 1024,
                capabilities: { synthesis: true }
            }
        ];
        for (const model of models) {
            const beforeLoad = await profiler.getActualMemoryUsage();
            await profiler.takeSnapshot(`before_${model.id}`);
            await orchestrator.loadModel(model);
            expect(profiler.checkMemoryUsage()).toBe(true);
            const afterLoad = await profiler.getActualMemoryUsage();
            const memoryUsed = afterLoad.heap - beforeLoad.heap;
            expect(memoryUsed).toBeLessThan(model.memoryRequirement);
            await orchestrator.unloadModel();
            await (0, jest_setup_1.forceGC)();
            const afterUnload = await profiler.getActualMemoryUsage();
            const retainedMemory = afterUnload.heap - beforeLoad.heap;
            expect(retainedMemory).toBeLessThan(50 * 1024 * 1024); // Less than 50MB retained
        }
        const delta = profiler.getMemoryDelta('init', 'final');
        expect(delta?.totalDelta).toBeLessThan(100 * 1024 * 1024); // Less than 100MB overall growth
    });
    it('should handle sequential task processing', async () => {
        const model = {
            id: 'test-model',
            name: 'Test Model',
            memoryRequirement: 4 * 1024 * 1024 * 1024,
            capabilities: { transcription: true }
        };
        await orchestrator.loadModel(model);
        const task = {
            id: 'test-task',
            type: 'transcription',
            input: createTestAudioBuffer(1.0) // 1 second audio buffer
        };
        for (let i = 0; i < 5; i++) {
            const beforeTask = await profiler.getActualMemoryUsage();
            await orchestrator.processTask(task);
            const afterTask = await profiler.getActualMemoryUsage();
            const taskMemoryUsage = afterTask.heap - beforeTask.heap;
            expect(taskMemoryUsage).toBeLessThan(1 * 1024 * 1024 * 1024); // Less than 1GB per task
        }
    });
    it('should reject oversized models', async () => {
        const oversizedModel = {
            id: 'huge',
            name: 'Huge Model',
            memoryRequirement: 20 * 1024 * 1024 * 1024,
            capabilities: { transcription: true }
        };
        await expect(orchestrator.loadModel(oversizedModel))
            .rejects.toThrow(/Insufficient memory/);
        const finalSnapshot = await profiler.getActualMemoryUsage();
        expect(finalSnapshot.heap).toBeLessThan(MEMORY_LIMIT);
    });
    it('should maintain stable memory during transitions', async () => {
        const initialSnapshot = await profiler.getActualMemoryUsage();
        const models = [
            {
                id: 'model-a',
                name: 'Model A',
                memoryRequirement: 2 * 1024 * 1024 * 1024,
                capabilities: { transcription: true }
            },
            {
                id: 'model-b',
                name: 'Model B',
                memoryRequirement: 4 * 1024 * 1024 * 1024,
                capabilities: { synthesis: true }
            }
        ];
        for (const model of models) {
            await profiler.takeSnapshot(`before_${model.id}`);
            await orchestrator.loadModel(model);
            await profiler.takeSnapshot(`loaded_${model.id}`);
            await orchestrator.unloadModel();
            await profiler.takeSnapshot(`unloaded_${model.id}`);
            await (0, jest_setup_1.forceGC)();
        }
        const finalSnapshot = await profiler.getActualMemoryUsage();
        const memoryDiff = Math.abs(finalSnapshot.heap - initialSnapshot.heap);
        expect(memoryDiff).toBeLessThan(100 * 1024 * 1024); // Less than 100MB difference
    });
});
//# sourceMappingURL=orchestrator.test.js.map