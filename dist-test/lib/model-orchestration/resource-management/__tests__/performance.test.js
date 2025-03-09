"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const perf_hooks_1 = require("perf_hooks");
const node_os_1 = __importDefault(require("node:os"));
jest.mock('node:os');
describe('Resource Management Performance', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        // Mock system resources
        node_os_1.default.totalmem.mockReturnValue(16000000000);
        node_os_1.default.freemem.mockReturnValue(8000000000);
        node_os_1.default.cpus.mockReturnValue(Array(8).fill({
            times: {
                user: 100,
                nice: 0,
                sys: 50,
                idle: 150,
                irq: 0
            }
        }));
        node_os_1.default.loadavg.mockReturnValue([2.5, 2.0, 1.8]);
    });
    describe('Resource Detection Performance', () => {
        it('should detect resources within 100ms', async () => {
            const system = await (0, __1.createModelResourceManager)();
            const start = perf_hooks_1.performance.now();
            const resources = system.detector.getCurrentResources();
            const end = perf_hooks_1.performance.now();
            const detectionTime = end - start;
            expect(detectionTime).toBeLessThan(100);
            await system.shutdown();
        });
        it('should maintain detection speed under load', async () => {
            const system = await (0, __1.createModelResourceManager)();
            const iterations = 1000;
            const times = [];
            for (let i = 0; i < iterations; i++) {
                const start = perf_hooks_1.performance.now();
                system.detector.getCurrentResources();
                const end = perf_hooks_1.performance.now();
                times.push(end - start);
            }
            const averageTime = times.reduce((a, b) => a + b) / times.length;
            const maxTime = Math.max(...times);
            expect(averageTime).toBeLessThan(50); // Average should be well below limit
            expect(maxTime).toBeLessThan(100); // Even worst case should meet limit
            await system.shutdown();
        });
    });
    describe('Monitoring Overhead', () => {
        it('should maintain CPU usage below 1%', async () => {
            const system = await (0, __1.createModelResourceManager)();
            const monitoringDuration = 5000; // 5 seconds
            const measurementInterval = 100; // 100ms
            const measurements = [];
            const startTime = Date.now();
            // Start monitoring
            system.detector.start();
            // Measure CPU usage over time
            while (Date.now() - startTime < monitoringDuration) {
                const startUsage = process.cpuUsage();
                await new Promise(resolve => setTimeout(resolve, measurementInterval));
                const endUsage = process.cpuUsage(startUsage);
                // Convert to percentage
                const totalUsage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
                const usagePercent = (totalUsage / measurementInterval) * 100;
                measurements.push(usagePercent);
            }
            const averageUsage = measurements.reduce((a, b) => a + b) / measurements.length;
            expect(averageUsage).toBeLessThan(1);
            await system.shutdown();
        });
    });
    describe('Memory Overhead', () => {
        it('should maintain memory overhead below 50MB', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            const system = await (0, __1.createModelResourceManager)();
            system.detector.start();
            // Perform some operations to ensure memory is allocated
            for (let i = 0; i < 1000; i++) {
                system.detector.getCurrentResources();
            }
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryOverhead = (finalMemory - initialMemory) / (1024 * 1024); // Convert to MB
            expect(memoryOverhead).toBeLessThan(50);
            await system.shutdown();
        });
    });
    describe('Resource Updates', () => {
        it('should handle rapid resource updates efficiently', async () => {
            const system = await (0, __1.createModelResourceManager)();
            const updates = [];
            let updateCount = 0;
            // Configure fast updates
            const fastSystem = await (0, __1.initializeResourceManagement)({
                updateIntervalMs: 10,
                thresholds: {
                    memory: { warning: 80, critical: 90 },
                    cpu: { warning: 70, critical: 85 },
                    disk: { warning: 85, critical: 95 }
                },
                constraints: {
                    memory: {
                        maxAllocation: 1024 * 1024 * 1024,
                        warningThreshold: 1024 * 1024 * 1024 * 0.8,
                        criticalThreshold: 1024 * 1024 * 1024 * 0.9
                    },
                    cpu: {
                        maxUtilization: 85,
                        warningThreshold: 70,
                        criticalThreshold: 80
                    },
                    disk: {
                        minAvailable: 1024 * 1024 * 1024,
                        warningThreshold: 1024 * 1024 * 1024 * 2,
                        criticalThreshold: 1024 * 1024 * 1024
                    }
                }
            }, () => updateCount++);
            // Run for 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Should have ~100 updates (1000ms / 10ms)
            // Allow some variance due to setTimeout precision
            expect(updateCount).toBeGreaterThan(80);
            expect(updateCount).toBeLessThan(120);
            await fastSystem.shutdown();
            await system.shutdown();
        });
    });
    describe('Concurrent Operations', () => {
        it('should handle multiple concurrent resource requests efficiently', async () => {
            const system = await (0, __1.createModelResourceManager)();
            const concurrentRequests = 100;
            const start = perf_hooks_1.performance.now();
            // Make concurrent requests
            await Promise.all(Array(concurrentRequests)
                .fill(0)
                .map(() => Promise.resolve(system.detector.getCurrentResources())));
            const end = perf_hooks_1.performance.now();
            const timePerRequest = (end - start) / concurrentRequests;
            // Each request should still be fast
            expect(timePerRequest).toBeLessThan(1);
            await system.shutdown();
        });
    });
});
//# sourceMappingURL=performance.test.js.map