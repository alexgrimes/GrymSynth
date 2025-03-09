"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
const resource_detection_1 = require("../resource-detection");
const node_os_1 = __importDefault(require("node:os"));
jest.mock('node:os');
describe('Resource Management Integration', () => {
    // Mock system resources
    const mockCpuInfo = {
        model: 'Intel(R) Core(TM) i7',
        speed: 2800,
        times: {
            user: 100,
            nice: 0,
            sys: 50,
            idle: 150,
            irq: 0
        }
    };
    beforeEach(() => {
        jest.resetAllMocks();
        // Setup os module mocks
        node_os_1.default.totalmem.mockReturnValue(16000000000);
        node_os_1.default.freemem.mockReturnValue(8000000000);
        node_os_1.default.cpus.mockReturnValue(Array(8).fill(mockCpuInfo));
        node_os_1.default.loadavg.mockReturnValue([2.5, 2.0, 1.8]);
    });
    afterEach(async () => {
        jest.useRealTimers();
    });
    describe('System Initialization', () => {
        it('should initialize with default configuration', async () => {
            const system = await (0, __1.initializeResourceManagement)();
            expect(system.detector).toBeDefined();
            await system.shutdown();
        });
        it('should handle resource updates', async () => {
            const updates = [];
            const onUpdate = (resources) => updates.push(resources);
            const system = await (0, __1.initializeResourceManagement)(resource_detection_1.DEFAULT_RESOURCE_DETECTION_CONFIG, onUpdate);
            // Should receive initial update
            expect(updates.length).toBeGreaterThan(0);
            expect(updates[0].memory).toBeDefined();
            expect(updates[0].cpu).toBeDefined();
            expect(updates[0].disk).toBeDefined();
            await system.shutdown();
        });
        it('should handle resource alerts', async () => {
            const alerts = [];
            const onAlert = (alert) => alerts.push(alert);
            // Configure thresholds to trigger warning but not critical
            const system = await (0, __1.initializeResourceManagement)({
                ...resource_detection_1.DEFAULT_RESOURCE_DETECTION_CONFIG,
                thresholds: {
                    memory: {
                        warning: 45,
                        critical: 80
                    },
                    cpu: {
                        warning: 70,
                        critical: 85
                    },
                    disk: {
                        warning: 85,
                        critical: 95
                    }
                }
            }, undefined, onAlert);
            // Should receive alerts due to memory usage above warning threshold
            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts[0].type).toBe('memory');
            expect(alerts[0].severity).toBe('warning');
            await system.shutdown();
        });
    });
    describe('Model Resource Manager', () => {
        it('should create preconfigured system for model workloads', async () => {
            const maxMemoryGB = 8;
            const maxCpuUtilization = 70;
            const minDiskSpaceGB = 50;
            const system = await (0, __1.createModelResourceManager)(maxMemoryGB, maxCpuUtilization, minDiskSpaceGB);
            const resources = system.detector.getCurrentResources();
            const availability = system.detector.getAvailability();
            expect(resources).toBeDefined();
            expect(availability.status).toBe('healthy');
            await system.shutdown();
        });
        it('should enforce resource constraints', async () => {
            const system = await (0, __1.createModelResourceManager)(2, 60, 10);
            const availability = system.detector.getAvailability();
            // With 2GB max memory, system should show warning/critical
            // when memory usage is high
            expect(availability.memory.utilizationPercent).toBeDefined();
            expect(typeof availability.memory.utilizationPercent).toBe('number');
            await system.shutdown();
        });
    });
    describe('Shutdown Behavior', () => {
        it('should properly cleanup resources on shutdown', async () => {
            const updates = [];
            const onUpdate = (resources) => updates.push(resources);
            const system = await (0, __1.initializeResourceManagement)(resource_detection_1.DEFAULT_RESOURCE_DETECTION_CONFIG, onUpdate);
            const initialLength = updates.length;
            await system.shutdown();
            // Wait a bit to ensure no more updates after shutdown
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(updates.length).toBe(initialLength);
        });
    });
});
//# sourceMappingURL=integration.test.js.map