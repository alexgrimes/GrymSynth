"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_health_monitor_1 = require("../model-health-monitor");
const metrics_collector_1 = require("../metrics-collector");
const project_manager_1 = require("../project-manager");
const feature_memory_system_1 = require("../feature-memory-system");
describe('Model Orchestration Health Integration', () => {
    let healthMonitor;
    let metricsCollector;
    let projectManager;
    let memorySystem;
    beforeEach(async () => {
        metricsCollector = new metrics_collector_1.MetricsCollector();
        healthMonitor = new model_health_monitor_1.ModelHealthMonitor(metricsCollector, undefined, {
            maxActiveModels: 3,
            maxQueueDepth: 5,
            minAvailableMemory: 256 * 1024 * 1024
        });
        memorySystem = new feature_memory_system_1.FeatureMemorySystem();
        projectManager = new project_manager_1.ProjectManager(memorySystem, healthMonitor);
        // Initialize test models
        await projectManager.initializeModel('audio', { type: 'processing' });
        await projectManager.initializeModel('pattern', { type: 'analysis' });
    });
    describe('Model Handoffs', () => {
        it('should track active handoffs during model interactions', async () => {
            const audioModel = await projectManager.getModel('audio');
            const patternModel = await projectManager.getModel('pattern');
            // Check initial health
            let health = await healthMonitor.checkModelHealth();
            expect(health.orchestration.activeHandoffs).toBe(0);
            expect(health.canAcceptTasks).toBe(true);
            // Start model handoff
            const handoffPromise = projectManager.handoff(audioModel, patternModel, {
                priority: 'high',
                timeout: 5000
            });
            // Check health during handoff
            health = await healthMonitor.checkModelHealth();
            expect(health.orchestration.activeHandoffs).toBe(1);
            expect(health.resources.activeModels).toBe(2);
            // Complete handoff
            await handoffPromise;
            // Verify health after handoff
            health = await healthMonitor.checkModelHealth();
            expect(health.orchestration.activeHandoffs).toBe(0);
        });
        it('should manage queue depth during multiple handoffs', async () => {
            const audioModel = await projectManager.getModel('audio');
            const patternModel = await projectManager.getModel('pattern');
            // Start multiple handoffs
            const handoffs = Array(3).fill(0).map(() => projectManager.handoff(audioModel, patternModel, {
                priority: 'normal',
                timeout: 5000
            }));
            // Check queue depth
            const health = await healthMonitor.checkModelHealth();
            expect(health.orchestration.queueDepth).toBe(3);
            expect(health.orchestration.status).toBe('degraded');
            // Complete handoffs
            await Promise.all(handoffs);
            // Verify queue is clear
            const finalHealth = await healthMonitor.checkModelHealth();
            expect(finalHealth.orchestration.queueDepth).toBe(0);
            expect(finalHealth.orchestration.status).toBe('available');
        });
        it('should prevent new tasks when resources are exhausted', async () => {
            const audioModel = await projectManager.getModel('audio');
            const patternModel = await projectManager.getModel('pattern');
            // Simulate resource exhaustion
            await projectManager.initializeModel('heavy', {
                type: 'processing',
                memoryRequirement: 400 * 1024 * 1024 // 400MB
            });
            const heavyModel = await projectManager.getModel('heavy');
            await projectManager.activateModel(heavyModel);
            // Check health after heavy model activation
            const health = await healthMonitor.checkModelHealth();
            expect(health.canAcceptTasks).toBe(false);
            expect(health.orchestration.status).toBe('unavailable');
            // Attempt handoff should be rejected
            await expect(projectManager.handoff(audioModel, patternModel)).rejects.toThrow('Insufficient resources');
        });
        it('should recover after resource pressure is relieved', async () => {
            const audioModel = await projectManager.getModel('audio');
            const patternModel = await projectManager.getModel('pattern');
            // Create resource pressure
            const heavyModel = await projectManager.initializeModel('heavy', {
                type: 'processing',
                memoryRequirement: 300 * 1024 * 1024
            });
            await projectManager.activateModel(heavyModel);
            // Verify degraded state
            let health = await healthMonitor.checkModelHealth();
            expect(health.orchestration.status).toBe('degraded');
            // Release heavy model
            await projectManager.deactivateModel(heavyModel);
            // Verify recovery
            health = await healthMonitor.checkModelHealth();
            expect(health.orchestration.status).toBe('available');
            expect(health.canAcceptTasks).toBe(true);
            // Should now be able to perform handoff
            await projectManager.handoff(audioModel, patternModel);
            expect(health.orchestration.activeHandoffs).toBe(1);
        });
    });
    describe('Resource Management', () => {
        it('should track memory usage across model lifecycle', async () => {
            // Initial state
            let health = await healthMonitor.checkModelHealth();
            const initialMemory = health.resources.memoryAvailable;
            // Load model
            const largeModel = await projectManager.initializeModel('large', {
                type: 'processing',
                memoryRequirement: 200 * 1024 * 1024
            });
            // Check after load
            health = await healthMonitor.checkModelHealth();
            expect(health.resources.memoryAvailable).toBeLessThan(initialMemory);
            // Unload model
            await projectManager.destroyModel(largeModel);
            // Verify memory recovery
            health = await healthMonitor.checkModelHealth();
            expect(health.resources.memoryAvailable).toBeGreaterThanOrEqual(initialMemory * 0.9);
        });
    });
});
//# sourceMappingURL=model-orchestration.test.js.map