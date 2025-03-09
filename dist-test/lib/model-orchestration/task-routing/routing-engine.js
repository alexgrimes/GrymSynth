"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingEngine = void 0;
/**
 * Core Routing Engine Implementation
 */
class RoutingEngine {
    constructor(config = defaultConfig) {
        this.weights = {
            latency: 0.3,
            reliability: 0.3,
            errorRate: 0.2,
            resourceUsage: 0.2
        };
        this.config = config;
        this.routeCache = new Map();
    }
    /**
     * Calculate optimal routes for a given task
     */
    async calculateRoutes(task, models) {
        const cacheKey = this.generateCacheKey(task);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached.route;
        }
        // Score and rank available routes
        const scores = await Promise.all(models.map(async (model) => {
            const resourceMetrics = await model.getResourceMetrics();
            return {
                model,
                score: await this.calculateRouteScore({
                    capabilities: model.capabilities,
                    performance: resourceMetrics,
                    requirements: task.requirements
                }),
                metrics: this.convertToModelMetrics(resourceMetrics)
            };
        }));
        // Filter viable routes
        const viable = scores.filter(s => this.meetsMinimumRequirements(s, task.requirements));
        if (viable.length === 0) {
            throw new Error('No viable routes found for task');
        }
        // Select optimal route
        const route = await this.selectOptimalRoute(viable, task.requirements);
        // Cache the result
        this.cacheRoute(cacheKey, route);
        return route;
    }
    convertToModelMetrics(resourceMetrics) {
        return {
            executionTime: resourceMetrics.averageLatency,
            memoryUsed: resourceMetrics.memoryUsage,
            tokensUsed: resourceMetrics.tokensProcessed || 0,
            totalExecutionTime: resourceMetrics.totalProcessingTime,
            totalMemoryUsed: resourceMetrics.memoryUsage,
            totalTokensUsed: resourceMetrics.tokensProcessed,
            peakMemoryUsage: resourceMetrics.peakMemoryUsage,
            totalProcessingTime: resourceMetrics.totalProcessingTime
        };
    }
    /**
     * Optimize allocated route based on current conditions
     */
    async optimizeAllocation(route, currentLoad) {
        const loadImpact = this.calculateLoadImpact(route);
        const bottlenecks = this.identifyBottlenecks(currentLoad, loadImpact);
        if (bottlenecks.length > 0) {
            return this.applyOptimizations(route, bottlenecks);
        }
        return route;
    }
    /**
     * Validate route against health and performance criteria
     */
    async validateRoute(route, health) {
        const healthStatus = this.validateHealthStatus(route, health);
        if (!healthStatus.valid) {
            return false;
        }
        const performanceStatus = this.validatePerformance(route);
        if (!performanceStatus.valid) {
            return false;
        }
        return true;
    }
    /**
     * Update route scoring based on actual performance
     */
    updateRoutingWeights(performance) {
        if (performance.responseTime > this.config.performanceThresholds.maxLatency) {
            this.adjustLatencyWeight(performance.responseTime);
        }
        if (performance.successRate < this.config.performanceThresholds.minSuccessRate) {
            this.adjustReliabilityWeight(performance.successRate);
        }
        if (performance.errors > 0) {
            this.adjustErrorWeight(performance.errors);
        }
    }
    async calculateRouteScore(params) {
        return (0.4 * this.calculateCapabilityMatch(params) +
            0.3 * this.calculatePerformanceScore(params) +
            0.2 * this.calculateResourceEfficiency(params) +
            0.1 * this.calculateHistoricalSuccess(params));
    }
    calculateCapabilityMatch(params) {
        const { capabilities, requirements } = params;
        let totalScore = 0;
        let requiredCount = 1; // Count primary capability
        // Check primary capability
        if (capabilities.has(requirements.primaryCapability)) {
            const score = capabilities.get(requirements.primaryCapability).score;
            totalScore += score;
        }
        // Check secondary capabilities
        for (const capability of requirements.secondaryCapabilities) {
            requiredCount++;
            if (capabilities.has(capability)) {
                const score = capabilities.get(capability).score;
                totalScore += score;
            }
        }
        return totalScore / requiredCount;
    }
    calculatePerformanceScore(params) {
        const { performance } = params;
        // Normalize metrics to 0-1 range
        const normalizedLatency = Math.min(1, this.config.performanceThresholds.maxLatency / performance.averageLatency);
        const normalizedCpu = 1 - performance.cpuUsage;
        const normalizedMemory = 1 - (performance.memoryUsage / 1024); // Convert to GB
        return (normalizedLatency + normalizedCpu + normalizedMemory) / 3;
    }
    calculateResourceEfficiency(params) {
        const { performance } = params;
        return 1 - ((performance.memoryUsage / 1024 + performance.cpuUsage) / 2);
    }
    calculateHistoricalSuccess(params) {
        // Default to 1 if no historical data available
        return 1;
    }
    meetsMinimumRequirements(score, requirements) {
        // Check minimum capability scores
        for (const [capability, minScore] of requirements.minCapabilityScores) {
            if (!score.model.capabilities.has(capability))
                return false;
            if (score.model.capabilities.get(capability).score < minScore)
                return false;
        }
        // Check resource constraints if specified
        if (requirements.resourceConstraints) {
            const { maxMemory, maxCpu, maxLatency } = requirements.resourceConstraints;
            const defaultMaxLatency = this.config.performanceThresholds.maxLatency;
            if (maxMemory && score.metrics.memoryUsed > maxMemory)
                return false;
            if (maxCpu && score.metrics.executionTime > (maxLatency || defaultMaxLatency))
                return false;
        }
        return score.score >= this.config.minConfidenceScore;
    }
    async selectOptimalRoute(viable, requirements) {
        // Sort by score and apply constraints
        const sorted = viable.sort((a, b) => b.score - a.score);
        // Build route options from best candidate
        const best = sorted[0];
        const alternativeRoutes = sorted.slice(1, 3).map(s => ({
            planner: s.model,
            executor: s.model
        }));
        return {
            primaryRoute: {
                planner: best.model,
                executor: best.model
            },
            alternativeRoutes,
            estimatedCosts: [{
                    memoryUsage: best.metrics.memoryUsed,
                    cpuUtilization: best.metrics.executionTime / this.config.performanceThresholds.maxLatency,
                    expectedLatency: best.metrics.executionTime,
                    estimatedTokens: best.metrics.tokensUsed
                }],
            confidenceScores: new Map([[best.model.id, best.score]]),
            constraints: {
                maxLatency: requirements.resourceConstraints?.maxLatency || this.config.performanceThresholds.maxLatency,
                maxMemory: requirements.resourceConstraints?.maxMemory || 1024,
                priority: this.calculatePriority(best.score),
                requiredCapabilities: new Set([
                    requirements.primaryCapability,
                    ...requirements.secondaryCapabilities
                ])
            }
        };
    }
    generateCacheKey(task) {
        return `${task.id}-${task.type}-${JSON.stringify(task.requirements)}`;
    }
    getFromCache(key) {
        const cached = this.routeCache.get(key);
        if (cached) {
            cached.usageCount++;
            return cached;
        }
        return undefined;
    }
    cacheRoute(key, route) {
        if (this.routeCache.size >= this.config.routeCacheSize) {
            this.evictLeastUsed();
        }
        this.routeCache.set(key, {
            route,
            timestamp: Date.now(),
            usageCount: 1
        });
    }
    evictLeastUsed() {
        let leastUsedKey = '';
        let minUsage = Infinity;
        for (const [key, value] of this.routeCache.entries()) {
            if (value.usageCount < minUsage) {
                minUsage = value.usageCount;
                leastUsedKey = key;
            }
        }
        if (leastUsedKey) {
            this.routeCache.delete(leastUsedKey);
        }
    }
    calculateLoadImpact(route) {
        const costs = route.estimatedCosts[0];
        return (costs.cpuUtilization * this.weights.resourceUsage +
            (costs.memoryUsage / 1024) * this.weights.resourceUsage);
    }
    identifyBottlenecks(currentLoad, impact) {
        const bottlenecks = [];
        for (const [resource, load] of currentLoad.entries()) {
            if (load + impact > 0.8) { // 80% threshold
                bottlenecks.push(resource);
            }
        }
        return bottlenecks;
    }
    async applyOptimizations(route, bottlenecks) {
        const optimized = { ...route };
        for (const bottleneck of bottlenecks) {
            switch (bottleneck) {
                case 'memory':
                    optimized.constraints.maxMemory *= 0.8;
                    break;
                case 'cpu':
                    optimized.constraints.maxLatency *= 1.2;
                    break;
            }
        }
        return optimized;
    }
    validateHealthStatus(route, health) {
        const issues = [];
        for (const node of health) {
            if (node.status === 'failed') {
                issues.push(`Node ${node.nodeId} has failed`);
            }
            if (node.status === 'degraded') {
                issues.push(`Node ${node.nodeId} is degraded`);
            }
            if (node.errorRate > this.config.performanceThresholds.maxErrorRate) {
                issues.push(`Node ${node.nodeId} has high error rate`);
            }
        }
        return {
            valid: issues.length === 0,
            issues
        };
    }
    validatePerformance(route) {
        const issues = [];
        const costs = route.estimatedCosts[0];
        if (costs.expectedLatency > this.config.performanceThresholds.maxLatency) {
            issues.push('Expected latency exceeds threshold');
        }
        if (costs.cpuUtilization > 0.7) {
            issues.push('CPU utilization too high');
        }
        return {
            valid: issues.length === 0,
            issues
        };
    }
    calculatePriority(score) {
        if (score > 0.8)
            return 'high';
        if (score > 0.5)
            return 'medium';
        return 'low';
    }
    adjustLatencyWeight(latency) {
        const adjustment = 0.05 * (latency / this.config.performanceThresholds.maxLatency);
        this.weights.latency = Math.max(0.1, this.weights.latency - adjustment);
        this.normalizeWeights();
    }
    adjustReliabilityWeight(successRate) {
        const adjustment = 0.05 * (1 - successRate);
        this.weights.reliability = Math.min(0.5, this.weights.reliability + adjustment);
        this.normalizeWeights();
    }
    adjustErrorWeight(errors) {
        const adjustment = 0.05 * Math.min(1, errors / 10);
        this.weights.errorRate = Math.min(0.4, this.weights.errorRate + adjustment);
        this.normalizeWeights();
    }
    normalizeWeights() {
        const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
        for (const key of Object.keys(this.weights)) {
            this.weights[key] /= total;
        }
    }
}
exports.RoutingEngine = RoutingEngine;
const defaultConfig = {
    minConfidenceScore: 0.7,
    routeCacheSize: 100,
    performanceThresholds: {
        maxLatency: 500,
        minSuccessRate: 0.95,
        maxErrorRate: 0.05
    }
};
//# sourceMappingURL=routing-engine.js.map