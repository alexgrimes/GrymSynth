"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TaskAnalyzer {
    async analyze(task) {
        const primaryCapability = this.inferCapability(task.type);
        const secondaryCapabilities = this.inferSecondaryCapabilities(task.type);
        const contextSize = this.inferContextSize(task.type, task.input);
        // Create minimum capability scores map
        const minCapabilityScores = new Map();
        minCapabilityScores.set(primaryCapability, 0.8);
        secondaryCapabilities.forEach(cap => {
            minCapabilityScores.set(cap, 0.6);
        });
        const requirements = {
            primaryCapability,
            secondaryCapabilities,
            minCapabilityScores,
            contextSize,
            priority: task.requirements?.priority || 'quality',
            resourceConstraints: task.requirements?.resourceConstraints || {
                maxMemory: 1000,
                maxCpu: 0.8,
                maxLatency: 200
            }
        };
        if (!this.validateRequirements(requirements)) {
            throw new Error('Invalid requirements generated');
        }
        return requirements;
    }
    validateRequirements(requirements) {
        try {
            if (!requirements)
                return false;
            // Validate primary capability
            if (!requirements.primaryCapability)
                return false;
            // Validate secondary capabilities array exists
            if (!Array.isArray(requirements.secondaryCapabilities))
                return false;
            // Validate minCapabilityScores map exists and has entries
            if (!requirements.minCapabilityScores || requirements.minCapabilityScores.size === 0)
                return false;
            // Validate context size is positive
            if (!requirements.contextSize || requirements.contextSize <= 0)
                return false;
            // Validate priority is one of allowed values
            if (!requirements.priority || !['speed', 'quality', 'efficiency'].includes(requirements.priority))
                return false;
            // Validate resource constraints if present
            if (requirements.resourceConstraints) {
                const { maxMemory, maxCpu, maxLatency } = requirements.resourceConstraints;
                if ((maxMemory !== undefined && maxMemory <= 0) ||
                    (maxCpu !== undefined && (maxCpu <= 0 || maxCpu > 1)) ||
                    (maxLatency !== undefined && maxLatency <= 0)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async suggestModelChain(requirements) {
        const defaultCapabilities = {
            code: 0,
            reasoning: 0,
            vision: 0,
            context: 0,
            analysis: 0,
            interaction: 0,
            specialized: 0
        };
        const createModel = (id, name, capabilities) => ({
            id,
            name,
            capabilities: {
                get: (cap) => ({
                    score: capabilities[cap] || defaultCapabilities[cap],
                    confidence: 0.8,
                    lastUpdated: new Date(),
                    sampleSize: 100
                }),
                set: () => { },
                has: () => true,
                getAll: () => new Map()
            },
            contextWindow: requirements.contextSize,
            process: async () => ({}),
            testCapability: async () => ({ score: 0.9, confidence: 0.8, lastUpdated: new Date(), sampleSize: 100 }),
            getResourceMetrics: async () => ({ memoryUsage: 500, cpuUsage: 0.5, averageLatency: 100 }),
            getTokenStats: async () => ({ total: 1000, prompt: 500, completion: 500 })
        });
        return {
            planner: createModel('default-planner', 'Default Planning Model', { reasoning: 0.9 }),
            executor: createModel('default-executor', 'Default Execution Model', { [requirements.primaryCapability]: 0.9 })
        };
    }
    inferCapability(type) {
        switch (type) {
            case 'architecture': return 'reasoning';
            case 'code_generation': return 'code';
            default: return 'reasoning';
        }
    }
    inferSecondaryCapabilities(type) {
        switch (type) {
            case 'architecture':
                return ['analysis', 'code', 'reasoning'];
            case 'code_generation':
                return ['analysis', 'reasoning'];
            default:
                return ['analysis', 'reasoning'];
        }
    }
    inferContextSize(type, input) {
        const baseSize = type === 'architecture' ? 4096 : 2048;
        // Adjust for input size if present
        if (input && typeof input === 'object') {
            const inputSize = JSON.stringify(input).length;
            if (inputSize > 1000) {
                return Math.max(baseSize, Math.ceil(inputSize * 1.5));
            }
        }
        return baseSize;
    }
}
exports.default = TaskAnalyzer;
//# sourceMappingURL=task-analyzer.js.map