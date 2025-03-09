"use strict";
/**
 * Resource Detection Module
 * Provides system resource monitoring and management capabilities
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResourceDetector = exports.DEFAULT_RESOURCE_DETECTION_CONFIG = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./resource-detector"), exports);
// Default configuration that can be used as a starting point
exports.DEFAULT_RESOURCE_DETECTION_CONFIG = {
    updateIntervalMs: 5000,
    thresholds: {
        memory: {
            warning: 80,
            critical: 90 // 90% utilization
        },
        cpu: {
            warning: 70,
            critical: 85 // 85% utilization
        },
        disk: {
            warning: 85,
            critical: 95 // 95% utilization
        }
    },
    constraints: {
        memory: {
            maxAllocation: 1024 * 1024 * 1024 * 2,
            warningThreshold: 1024 * 1024 * 1024 * 1.6,
            criticalThreshold: 1024 * 1024 * 1024 * 1.8 // 1.8GB
        },
        cpu: {
            maxUtilization: 85,
            warningThreshold: 70,
            criticalThreshold: 80
        },
        disk: {
            minAvailable: 1024 * 1024 * 1024 * 10,
            warningThreshold: 1024 * 1024 * 1024 * 20,
            criticalThreshold: 1024 * 1024 * 1024 * 10 // 10GB
        }
    }
};
// Helper function to create a resource detector with default config
function createResourceDetector(config = exports.DEFAULT_RESOURCE_DETECTION_CONFIG, onUpdate, onAlert) {
    return new (require('./resource-detector').ResourceDetector)(config, onUpdate, onAlert);
}
exports.createResourceDetector = createResourceDetector;
//# sourceMappingURL=index.js.map