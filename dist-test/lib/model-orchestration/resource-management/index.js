"use strict";
/**
 * Resource Management System
 * Provides centralized resource management for the model orchestration framework
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.createModelResourceManager = exports.initializeResourceManagement = exports.DefaultResourceConfig = void 0;
const resource_detection_1 = require("./resource-detection");
__exportStar(require("./types"), exports);
__exportStar(require("./resource-detection"), exports);
// Re-export commonly used configurations
var resource_detection_2 = require("./resource-detection");
Object.defineProperty(exports, "DefaultResourceConfig", { enumerable: true, get: function () { return resource_detection_2.DEFAULT_RESOURCE_DETECTION_CONFIG; } });
/**
 * Initialize the resource management system
 * This will be expanded as we implement additional components
 */
async function initializeResourceManagement(config = resource_detection_1.DEFAULT_RESOURCE_DETECTION_CONFIG, onResourceUpdate, onResourceAlert) {
    const { createResourceDetector } = await Promise.resolve().then(() => __importStar(require('./resource-detection')));
    // Initialize resource detection
    const detector = createResourceDetector(config, onResourceUpdate, onResourceAlert);
    detector.start();
    // TODO: Initialize pool management when implemented
    // TODO: Initialize memory management when implemented
    // TODO: Initialize CPU management when implemented
    return {
        detector,
        // Will add additional components as they are implemented:
        // poolManager: null,
        // memoryManager: null,
        // cpuManager: null,
        /**
         * Stop all resource management systems
         */
        shutdown: async () => {
            detector.stop();
            // Will add cleanup for other components as they are implemented
        }
    };
}
exports.initializeResourceManagement = initializeResourceManagement;
/**
 * Create a preconfigured resource management system with recommended settings
 * for model orchestration workloads
 */
async function createModelResourceManager(maxMemoryGB = 4, maxCpuUtilization = 80, minDiskSpaceGB = 20) {
    const config = {
        ...resource_detection_1.DEFAULT_RESOURCE_DETECTION_CONFIG,
        constraints: {
            memory: {
                maxAllocation: maxMemoryGB * 1024 * 1024 * 1024,
                warningThreshold: maxMemoryGB * 0.8 * 1024 * 1024 * 1024,
                criticalThreshold: maxMemoryGB * 0.9 * 1024 * 1024 * 1024
            },
            cpu: {
                maxUtilization: maxCpuUtilization,
                warningThreshold: maxCpuUtilization * 0.8,
                criticalThreshold: maxCpuUtilization * 0.9
            },
            disk: {
                minAvailable: minDiskSpaceGB * 1024 * 1024 * 1024,
                warningThreshold: minDiskSpaceGB * 2 * 1024 * 1024 * 1024,
                criticalThreshold: minDiskSpaceGB * 1024 * 1024 * 1024
            }
        }
    };
    return initializeResourceManagement(config);
}
exports.createModelResourceManager = createModelResourceManager;
// Export version for tracking
exports.VERSION = '0.1.0';
//# sourceMappingURL=index.js.map