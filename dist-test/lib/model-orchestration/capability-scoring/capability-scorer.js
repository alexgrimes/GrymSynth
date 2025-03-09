"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilityScorer = void 0;
class CapabilityScorer {
    constructor(config = {}) {
        this.modelData = new Map();
        this.config = {
            decayFactor: config.decayFactor ?? 0.95,
            timeWindow: config.timeWindow ?? 7 * 24 * 60 * 60 * 1000,
            minSamples: config.minSamples ?? 5,
            weightFactors: {
                successRate: config.weightFactors?.successRate ?? 0.5,
                latency: config.weightFactors?.latency ?? 0.3,
                resourceUsage: config.weightFactors?.resourceUsage ?? 0.2
            }
        };
    }
    async recordSuccess(modelId, capability, metrics) {
        await this.recordPerformance(modelId, capability, {
            success: true,
            latency: metrics.latency,
            resourceUsage: metrics.resourceUsage ?? 0,
            timestamp: Date.now()
        });
    }
    async recordFailure(modelId, capability, metrics) {
        await this.recordPerformance(modelId, capability, {
            success: false,
            latency: metrics.latency,
            resourceUsage: metrics.resourceUsage ?? 0,
            timestamp: Date.now()
        });
    }
    async getCapabilityScore(modelId, capability) {
        const data = this.getModelCapabilityData(modelId, capability);
        if (!data || data.records.length < this.config.minSamples) {
            return 0;
        }
        await this.updateScore(modelId, capability);
        return data.aggregateScore;
    }
    async getModelScores(modelId) {
        const capabilities = new Map();
        const performanceMetrics = {
            successRate: 0,
            latency: 0,
            resourceUsage: 0
        };
        const modelCapabilities = this.modelData.get(modelId);
        if (modelCapabilities) {
            let totalCapabilities = 0;
            for (const [capability, data] of modelCapabilities.entries()) {
                if (data.records.length >= this.config.minSamples) {
                    const score = await this.getCapabilityScore(modelId, capability);
                    capabilities.set(capability, score);
                    const metrics = this.calculatePerformanceMetrics(data.records);
                    performanceMetrics.successRate += metrics.successRate;
                    performanceMetrics.latency += metrics.latency;
                    performanceMetrics.resourceUsage += metrics.resourceUsage;
                    totalCapabilities++;
                }
            }
            if (totalCapabilities > 0) {
                performanceMetrics.successRate /= totalCapabilities;
                performanceMetrics.latency /= totalCapabilities;
                performanceMetrics.resourceUsage /= totalCapabilities;
            }
        }
        return {
            modelId,
            capabilities,
            performanceMetrics
        };
    }
    async recordPerformance(modelId, capability, record) {
        const data = this.getOrCreateModelCapabilityData(modelId, capability);
        data.records.push(record);
        data.records = this.pruneOldRecords(data.records);
        await this.updateScore(modelId, capability);
    }
    async updateScore(modelId, capability) {
        const data = this.getModelCapabilityData(modelId, capability);
        if (!data)
            return;
        const records = this.pruneOldRecords(data.records);
        if (records.length < this.config.minSamples) {
            data.aggregateScore = 0;
            return;
        }
        const metrics = this.calculatePerformanceMetrics(records);
        const score = this.calculateAggregateScore(metrics);
        // Apply time decay
        const timeSinceLastUpdate = Date.now() - data.lastUpdated;
        const decayFactor = Math.pow(this.config.decayFactor, timeSinceLastUpdate / (24 * 60 * 60 * 1000));
        data.aggregateScore = score * decayFactor;
        data.lastUpdated = Date.now();
    }
    calculatePerformanceMetrics(records) {
        const recent = records.slice(-this.config.minSamples);
        const successCount = recent.filter(r => r.success).length;
        return {
            successRate: successCount / recent.length,
            latency: this.calculateAverageLatency(recent),
            resourceUsage: this.calculateAverageResourceUsage(recent)
        };
    }
    calculateAggregateScore(metrics) {
        const { weightFactors } = this.config;
        // Normalize metrics to 0-1 range with steeper penalties
        const normalizedLatency = Math.max(0, 1 - Math.pow(metrics.latency / 500, 1.5)); // Steeper penalty over 500ms
        const normalizedResourceUsage = Math.max(0, 1 - Math.pow(metrics.resourceUsage, 2)); // Quadratic penalty
        // Calculate weighted score
        const score = metrics.successRate * weightFactors.successRate +
            normalizedLatency * weightFactors.latency +
            normalizedResourceUsage * weightFactors.resourceUsage;
        // Apply additional penalty for very poor metrics
        if (metrics.latency > 800 || metrics.resourceUsage > 0.8) {
            return score * 0.5; // 50% penalty for severe performance issues
        }
        return score;
    }
    calculateAverageLatency(records) {
        return records.reduce((sum, r) => sum + r.latency, 0) / records.length;
    }
    calculateAverageResourceUsage(records) {
        return records.reduce((sum, r) => sum + r.resourceUsage, 0) / records.length;
    }
    pruneOldRecords(records) {
        const cutoff = Date.now() - this.config.timeWindow;
        return records.filter(r => r.timestamp >= cutoff);
    }
    getModelCapabilityData(modelId, capability) {
        return this.modelData.get(modelId)?.get(capability);
    }
    getOrCreateModelCapabilityData(modelId, capability) {
        if (!this.modelData.has(modelId)) {
            this.modelData.set(modelId, new Map());
        }
        const modelCapabilities = this.modelData.get(modelId);
        if (!modelCapabilities.has(capability)) {
            modelCapabilities.set(capability, {
                records: [],
                aggregateScore: 0,
                lastUpdated: Date.now()
            });
        }
        return modelCapabilities.get(capability);
    }
}
exports.CapabilityScorer = CapabilityScorer;
//# sourceMappingURL=capability-scorer.js.map