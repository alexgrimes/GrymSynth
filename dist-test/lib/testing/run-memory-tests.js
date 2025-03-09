"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMemoryTests = void 0;
const orchestrator_1 = require("../sequential/orchestrator");
const memory_profile_1 = require("./memory-profile");
const memory_viz_1 = require("./memory-viz");
const path = __importStar(require("path"));
const MEMORY_LIMIT = 16 * 1024 * 1024 * 1024; // 16GB
const REPORTS_DIR = path.join(__dirname, '../../../reports/memory');
async function runMemoryTests() {
    const orchestrator = new orchestrator_1.SequentialOrchestrator(MEMORY_LIMIT);
    const profiler = new memory_profile_1.MemoryProfiler(MEMORY_LIMIT);
    const visualizer = new memory_viz_1.MemoryVisualizer();
    const scenarios = [
        {
            name: 'Sequential Model Loading',
            run: async (orchestrator, profiler) => {
                const models = [
                    {
                        id: 'small-model',
                        name: 'Small Audio Model',
                        memoryRequirement: 2 * 1024 * 1024 * 1024,
                        capabilities: { transcription: true }
                    },
                    {
                        id: 'medium-model',
                        name: 'Medium Audio Model',
                        memoryRequirement: 4 * 1024 * 1024 * 1024,
                        capabilities: { synthesis: true }
                    },
                    {
                        id: 'large-model',
                        name: 'Large Audio Model',
                        memoryRequirement: 8 * 1024 * 1024 * 1024,
                        capabilities: { streaming: true }
                    }
                ];
                for (const model of models) {
                    await profiler.takeSnapshot(`before_${model.id}`);
                    visualizer.track(await profiler.getActualMemoryUsage());
                    await orchestrator.loadModel(model);
                    await profiler.takeSnapshot(`loaded_${model.id}`);
                    visualizer.track(await profiler.getActualMemoryUsage(), { type: 'load', model: model.id, timestamp: Date.now() });
                    await orchestrator.unloadModel();
                    await profiler.takeSnapshot(`unloaded_${model.id}`);
                    visualizer.track(await profiler.getActualMemoryUsage(), { type: 'unload', model: model.id, timestamp: Date.now() });
                }
            }
        },
        {
            name: 'Concurrent Task Processing',
            run: async (orchestrator, profiler) => {
                const model = {
                    id: 'test-model',
                    name: 'Test Model',
                    memoryRequirement: 4 * 1024 * 1024 * 1024,
                    capabilities: { transcription: true, synthesis: true }
                };
                await profiler.takeSnapshot('before_tasks');
                visualizer.track(await profiler.getActualMemoryUsage());
                await orchestrator.loadModel(model);
                visualizer.track(await profiler.getActualMemoryUsage(), { type: 'load', model: model.id, timestamp: Date.now() });
                const tasks = Array(5).fill(null).map((_, i) => ({
                    id: `task-${i}`,
                    type: 'transcription',
                    input: new AudioBuffer({
                        length: 48000,
                        numberOfChannels: 2,
                        sampleRate: 48000
                    })
                }));
                await profiler.takeSnapshot('tasks_start');
                for (const task of tasks) {
                    await orchestrator.processTask(task);
                    await profiler.takeSnapshot(`task_${task.id}`);
                    visualizer.track(await profiler.getActualMemoryUsage());
                }
                await profiler.takeSnapshot('tasks_end');
                await orchestrator.unloadModel();
                visualizer.track(await profiler.getActualMemoryUsage(), { type: 'unload', model: model.id, timestamp: Date.now() });
            }
        }
    ];
    console.log('Starting memory tests...\n');
    for (const scenario of scenarios) {
        console.log(`Running scenario: ${scenario.name}`);
        profiler.startTracking();
        try {
            await scenario.run(orchestrator, profiler);
            console.log(`✓ ${scenario.name} completed`);
            const memoryReport = profiler.generateReport();
            console.log('\nMemory Report:');
            console.log(memoryReport);
        }
        catch (error) {
            console.error(`✗ ${scenario.name} failed:`, error);
        }
        finally {
            profiler.stopTracking();
        }
        console.log('\n---\n');
    }
    // Generate visual report
    const reportPath = path.join(REPORTS_DIR, 'memory-usage.html');
    await visualizer.generateReport(reportPath, MEMORY_LIMIT);
    console.log(`Memory visualization report generated at: ${reportPath}`);
}
exports.runMemoryTests = runMemoryTests;
// Run tests if executed directly
if (require.main === module) {
    runMemoryTests().catch(error => {
        console.error('Memory tests failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=run-memory-tests.js.map