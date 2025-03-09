"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimalTestFramework = void 0;
const orchestrator_1 = require("../sequential/orchestrator");
class MinimalTestFramework {
    constructor(memoryLimit = 16 * 1024 * 1024 * 1024) {
        this.memorySnapshots = [];
        this.orchestrator = new orchestrator_1.SequentialOrchestrator(memoryLimit);
    }
    async takeMemorySnapshot() {
        const usage = process.memoryUsage();
        const snapshot = {
            timestamp: Date.now(),
            heapUsed: usage.heapUsed,
            external: usage.external,
            total: usage.heapUsed + usage.external
        };
        this.memorySnapshots.push(snapshot);
        return snapshot;
    }
    async modelTests() {
        const results = {
            loadUnload: await this.testLoadUnload(),
            basicProcessing: await this.testBasicProcessing(),
            memoryProfile: await this.testMemoryProfile()
        };
        return results;
    }
    async orchestrationTests() {
        const results = {
            taskPlanning: await this.testTaskPlanning(),
            modelHandoff: await this.testModelHandoff(),
            errorRecovery: await this.testErrorRecovery()
        };
        return results;
    }
    async testLoadUnload() {
        try {
            const initialSnapshot = await this.takeMemorySnapshot();
            // Test loading and unloading different sized models
            const models = [
                {
                    id: 'small-model',
                    name: 'Small Test Model',
                    memoryRequirement: 1 * 1024 * 1024 * 1024,
                    capabilities: { transcription: true }
                },
                {
                    id: 'medium-model',
                    name: 'Medium Test Model',
                    memoryRequirement: 4 * 1024 * 1024 * 1024,
                    capabilities: { synthesis: true }
                }
            ];
            for (const model of models) {
                await this.orchestrator.loadModel(model);
                const loadedSnapshot = await this.takeMemorySnapshot();
                await this.orchestrator.unloadModel();
                const unloadedSnapshot = await this.takeMemorySnapshot();
                // Verify memory is properly freed
                const memoryDiff = unloadedSnapshot.total - initialSnapshot.total;
                if (memoryDiff > 100 * 1024 * 1024) { // Allow 100MB variance
                    console.error(`Memory leak detected: ${memoryDiff / 1024 / 1024}MB not freed`);
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error('Load/Unload test failed:', error);
            return false;
        }
    }
    async testBasicProcessing() {
        try {
            const task = {
                id: 'test-task',
                type: 'transcription',
                input: new AudioBuffer({ length: 1000, sampleRate: 44100, numberOfChannels: 1 })
            };
            const result = await this.orchestrator.processTask(task);
            return result.length > 0;
        }
        catch (error) {
            console.error('Basic processing test failed:', error);
            return false;
        }
    }
    async testMemoryProfile() {
        const startSnapshot = await this.takeMemorySnapshot();
        const memoryLimit = this.orchestrator.getMemoryLimit();
        try {
            // Process multiple tasks sequentially
            const tasks = [
                {
                    id: 'task1',
                    type: 'transcription',
                    input: new AudioBuffer({ length: 1000, sampleRate: 44100, numberOfChannels: 1 })
                },
                {
                    id: 'task2',
                    type: 'synthesis',
                    input: 'Test synthesis text'
                }
            ];
            for (const task of tasks) {
                await this.orchestrator.processTask(task);
                const snapshot = await this.takeMemorySnapshot();
                // Verify memory never exceeds limit
                if (snapshot.total > memoryLimit) {
                    console.error(`Memory limit exceeded: ${snapshot.total / 1024 / 1024}MB > ${memoryLimit / 1024 / 1024}MB`);
                    return { passed: false, profile: this.memorySnapshots };
                }
            }
            const endSnapshot = await this.takeMemorySnapshot();
            const memoryDiff = endSnapshot.total - startSnapshot.total;
            return {
                passed: memoryDiff < 100 * 1024 * 1024,
                profile: this.memorySnapshots
            };
        }
        catch (error) {
            console.error('Memory profile test failed:', error);
            return { passed: false, profile: this.memorySnapshots };
        }
    }
    async testTaskPlanning() {
        try {
            const task = {
                id: 'complex-task',
                type: 'analysis',
                input: new AudioBuffer({ length: 1000, sampleRate: 44100, numberOfChannels: 1 })
            };
            const plan = await this.orchestrator.planTask(task);
            return plan.length > 0 && plan.every(step => step.modelType &&
                step.operation &&
                step.modelType.memoryRequirement <= this.orchestrator.getMemoryLimit());
        }
        catch (error) {
            console.error('Task planning test failed:', error);
            return false;
        }
    }
    async testModelHandoff() {
        try {
            // Test sequential model transitions
            const task1 = {
                id: 'task1',
                type: 'transcription',
                input: new AudioBuffer({ length: 1000, sampleRate: 44100, numberOfChannels: 1 })
            };
            const task2 = {
                id: 'task2',
                type: 'synthesis',
                input: 'Test handoff'
            };
            await this.orchestrator.processTask(task1);
            await this.orchestrator.processTask(task2);
            return true;
        }
        catch (error) {
            console.error('Model handoff test failed:', error);
            return false;
        }
    }
    async testErrorRecovery() {
        try {
            // Test oversized model
            const oversizedModel = {
                id: 'oversized',
                name: 'Oversized Model',
                memoryRequirement: 20 * 1024 * 1024 * 1024,
                capabilities: { transcription: true }
            };
            try {
                await this.orchestrator.loadModel(oversizedModel);
                console.error('Failed: Oversized model should have been rejected');
                return false;
            }
            catch (error) {
                // Expected error
                const snapshot = await this.takeMemorySnapshot();
                return snapshot.total < this.orchestrator.getMemoryLimit();
            }
        }
        catch (error) {
            console.error('Error recovery test failed:', error);
            return false;
        }
    }
    getMemoryProfile() {
        return this.memorySnapshots;
    }
}
exports.MinimalTestFramework = MinimalTestFramework;
//# sourceMappingURL=minimal-test.js.map