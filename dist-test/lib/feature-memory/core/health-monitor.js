"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMonitor = void 0;
const types_1 = require("./types");
// Pure metric evaluation functions
function evaluateMemoryMetrics(metrics, thresholds, previousStatus) {
    const heapUsage = metrics.resourceUsage.memoryUsage;
    const heapLimit = process.memoryUsage().heapTotal;
    const heapRatio = heapUsage / heapLimit;
    const cacheUtilization = metrics.resourceUsage.storageUsage / metrics.resourceUsage.storageLimit;
    console.log(`[Memory Metrics] Heap ratio: ${heapRatio.toFixed(2)}, Cache utilization: ${cacheUtilization.toFixed(2)}`);
    // Start with current status as default
    let status = previousStatus;
    const isCritical = heapRatio > thresholds.heapUsageCritical || cacheUtilization > thresholds.cacheUtilizationCritical;
    const isWarning = heapRatio > thresholds.heapUsageWarning || cacheUtilization > thresholds.cacheUtilizationWarning;
    const isRecovered = heapRatio <= thresholds.heapUsageRecovery * 0.95 && cacheUtilization <= thresholds.cacheUtilizationRecovery * 0.95;
    // State transition logic based on current state
    switch (previousStatus) {
        case 'healthy':
            // From healthy, can only go to degraded
            if (isWarning || isCritical) {
                console.log('[Memory Alert] Warning threshold exceeded');
                status = 'degraded';
            }
            break;
        case 'degraded':
            // From degraded, can go to either healthy or unhealthy
            if (isCritical) {
                console.log('[Memory Alert] Critical threshold exceeded');
                status = 'unhealthy';
            }
            else if (isRecovered) {
                console.log('[Memory Recovery] Metrics within recovery thresholds');
                status = 'healthy';
            }
            break;
        case 'unhealthy':
            // From unhealthy, can only go to degraded
            if (!isCritical && isRecovered) {
                console.log('[Memory Recovery] Moving to degraded state');
                status = 'degraded';
            }
            break;
    }
    return { heapUsage, heapLimit, cacheUtilization, status };
}
function evaluatePerformanceMetrics(metrics, thresholds, previousStatus) {
    const recentLatencies = metrics.recentLatencies;
    const averageLatency = calculateAverage(recentLatencies);
    const p95Latency = calculateP95(recentLatencies);
    const latencyVariance = calculateVariance(recentLatencies, averageLatency);
    const throughput = metrics.healthStatus.metrics.throughput;
    const recentThroughput = calculateRecentThroughput(metrics);
    const spikeFactor = calculateSpikeFactor(recentLatencies, averageLatency, latencyVariance);
    const highLatencyRatio = calculateHighLatencyRatio(recentLatencies, thresholds.latencyWarning);
    console.log(`[Performance Metrics] Avg latency: ${averageLatency.toFixed(2)}, P95: ${p95Latency.toFixed(2)}, Throughput: ${throughput}`);
    // Start with current status as default
    let status = previousStatus;
    // Calculate condition flags
    const isCritical = averageLatency > thresholds.latencyCritical ||
        p95Latency > thresholds.latencyCritical * 1.1 ||
        throughput < thresholds.throughputCritical ||
        spikeFactor > 2.5 ||
        highLatencyRatio > 0.4 ||
        recentThroughput < throughput * 0.5;
    const isWarning = averageLatency >= thresholds.latencyWarning * 0.9 ||
        p95Latency >= thresholds.latencyWarning ||
        throughput < thresholds.throughputWarning * 1.1 ||
        spikeFactor > 1.2 ||
        highLatencyRatio > 0.25 ||
        recentThroughput < throughput * 0.8;
    const isRecovered = averageLatency <= thresholds.latencyRecovery * 0.9 &&
        p95Latency <= thresholds.latencyRecovery * 1.1 &&
        throughput >= thresholds.throughputRecovery * 1.1 &&
        spikeFactor <= 1.1 &&
        recentThroughput >= throughput * 0.98 &&
        highLatencyRatio <= 0.05;
    // State transition logic based on current state
    switch (previousStatus) {
        case 'healthy':
            // From healthy, can only go to degraded
            if (isWarning || isCritical) {
                console.log('[Performance Alert] Warning threshold exceeded');
                status = 'degraded';
            }
            break;
        case 'degraded':
            // From degraded, can go to either healthy or unhealthy
            if (isCritical) {
                console.log('[Performance Alert] Critical threshold exceeded');
                status = 'unhealthy';
            }
            else if (isRecovered) {
                console.log('[Performance Recovery] Metrics within recovery thresholds');
                status = 'healthy';
            }
            break;
        case 'unhealthy':
            // From unhealthy, can only go to degraded
            if (!isCritical && isRecovered) {
                console.log('[Performance Recovery] Moving to degraded state');
                status = 'degraded';
            }
            break;
    }
    return {
        averageLatency,
        p95Latency,
        throughput,
        latencyVariance,
        spikeFactor,
        recentThroughput,
        status
    };
}
function evaluateErrorMetrics(metrics, thresholds, errorWindow, metricsCollector, previousStatus) {
    const recentErrors = metricsCollector.getRecentErrorCount(errorWindow);
    const totalOperations = metricsCollector.getTotalOperations();
    const errorRate = totalOperations > 0 ? recentErrors / totalOperations : 0;
    console.log(`[Error Metrics] Error rate: ${errorRate.toFixed(4)}, Recent errors: ${recentErrors}`);
    // Start with current status as default
    let status = previousStatus;
    // Calculate condition flags
    const isCritical = errorRate > thresholds.errorRateCritical;
    const isWarning = errorRate > thresholds.errorRateWarning;
    const isRecovered = errorRate <= thresholds.errorRateRecovery * 0.95;
    // State transition logic based on current state
    switch (previousStatus) {
        case 'healthy':
            // From healthy, can only go to degraded
            if (isWarning || isCritical) {
                console.log('[Error Alert] Warning threshold exceeded');
                status = 'degraded';
            }
            break;
        case 'degraded':
            // From degraded, can go to either healthy or unhealthy
            if (isCritical) {
                console.log('[Error Alert] Critical threshold exceeded');
                status = 'unhealthy';
            }
            else if (isRecovered) {
                console.log('[Error Recovery] Error rate within recovery threshold');
                status = 'healthy';
            }
            break;
        case 'unhealthy':
            // From unhealthy, can only go to degraded
            if (!isCritical && isRecovered) {
                console.log('[Error Recovery] Moving to degraded state');
                status = 'degraded';
            }
            break;
    }
    return { errorRate, recentErrors, status };
}
// State machine implementation
class HealthStateMachine {
    constructor(config) {
        this.lastTransitionTime = Date.now();
        this.transitionsInLastMinute = 0;
        this.lastTransitionCheck = Date.now();
        this.stateHistory = [];
        this.historyLimit = 100;
        this.config = config;
        // Initialize transitions with proper typing
        this.transitions = new Map();
        // Healthy can only transition to degraded
        this.transitions.set('healthy', new Set(['degraded']));
        // Degraded can transition to either healthy or unhealthy
        this.transitions.set('degraded', new Set(['healthy', 'unhealthy']));
        // Unhealthy can only transition to degraded
        this.transitions.set('unhealthy', new Set(['degraded']));
    }
    validateStateProgression(from, to) {
        // Enforce state progression rules
        if (from === 'healthy' && to === 'unhealthy') {
            console.log(`[State Machine] Cannot transition directly from healthy to unhealthy`);
            return false;
        }
        if (from === 'unhealthy' && to === 'healthy') {
            console.log(`[State Machine] Cannot transition directly from unhealthy to healthy`);
            return false;
        }
        // Check valid transition path
        if (!this.transitions.get(from)?.has(to)) {
            console.log(`[State Machine] Invalid transition path: ${from} -> ${to}`);
            return false;
        }
        return true;
    }
    validateTimingConstraints(now) {
        // Check minimum duration
        const timeSinceLastTransition = now - this.lastTransitionTime;
        if (timeSinceLastTransition < this.config.minStateDuration) {
            console.log(`[State Machine] Minimum duration not met: ${timeSinceLastTransition}ms < ${this.config.minStateDuration}ms`);
            return false;
        }
        // Reset transition counter if minute has passed
        if (now - this.lastTransitionCheck >= 60000) {
            this.transitionsInLastMinute = 0;
            this.lastTransitionCheck = now;
        }
        // Check transition rate
        if (this.transitionsInLastMinute >= this.config.maxTransitionsPerMinute) {
            console.log(`[State Machine] Max transitions per minute exceeded: ${this.transitionsInLastMinute}`);
            return false;
        }
        return true;
    }
    validateRecoveryConditions(from, to) {
        if (to === 'healthy' && from === 'degraded') {
            // Check for sustained improvement
            const recentStates = this.stateHistory.slice(-this.config.confirmationSamples);
            const allDegraded = recentStates.every(s => s.state === 'degraded');
            const sustainedDuration = recentStates.length > 0
                ? Date.now() - recentStates[0].timestamp
                : 0;
            if (!allDegraded || sustainedDuration < this.config.minStateDuration * 1.5) {
                console.log(`[State Machine] Recovery conditions not met: Need sustained degraded state`);
                return false;
            }
        }
        return true;
    }
    canTransition(from, to) {
        const now = Date.now();
        return this.validateStateProgression(from, to) &&
            this.validateTimingConstraints(now) &&
            this.validateRecoveryConditions(from, to);
    }
    transition(from, to) {
        if (!this.canTransition(from, to)) {
            throw new Error(`Invalid transition: ${from} -> ${to}`);
        }
        this.lastTransitionTime = Date.now();
        this.transitionsInLastMinute++;
        // Record state history
        this.stateHistory.push({ state: to, timestamp: Date.now() });
        if (this.stateHistory.length > this.historyLimit) {
            this.stateHistory.shift();
        }
        console.log(`[State Machine] Transition executed: ${from} -> ${to}`);
    }
    getStateHistory() {
        return [...this.stateHistory];
    }
}
// Helper functions
function calculateAverage(values) {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
function calculateVariance(values, mean) {
    return values.length > 0
        ? Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length)
        : 0;
}
function calculateP95(samples) {
    if (samples.length === 0)
        return 0;
    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
}
function calculateSpikeFactor(values, mean, variance) {
    return variance > 0
        ? Math.max(...values.map(v => Math.abs(v - mean) / variance))
        : 0;
}
function calculateHighLatencyRatio(values, threshold) {
    const highLatencyCount = values.filter(v => v > threshold).length;
    return values.length > 0 ? highLatencyCount / values.length : 0;
}
function calculateRecentThroughput(metrics) {
    const recentWindow = 10000; // 10 seconds
    const now = Date.now();
    const recentOperations = metrics.recentLatencies.filter((_, idx) => now - metrics.recentLatencyTimestamps[idx] <= recentWindow).length;
    return (recentOperations / recentWindow) * 1000; // ops/sec
}
// Main health monitor class
class HealthMonitor {
    // Protected methods for subclasses
    getMetricsCollector() {
        return this.metrics;
    }
    getConfiguration() {
        return this.config;
    }
    getRawMetrics() {
        return this.metrics.getMetrics();
    }
    constructor(metrics, config) {
        this.statusHistory = [];
        this.historyLimit = 100;
        this.pendingSamples = [];
        this.pendingSamplesLimit = 20;
        this.metrics = metrics;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
            memoryThresholds: { ...DEFAULT_CONFIG.memoryThresholds, ...config?.memoryThresholds },
            performanceThresholds: { ...DEFAULT_CONFIG.performanceThresholds, ...config?.performanceThresholds },
            errorThresholds: { ...DEFAULT_CONFIG.errorThresholds, ...config?.errorThresholds },
            timeWindows: { ...DEFAULT_CONFIG.timeWindows, ...config?.timeWindows },
            stabilization: { ...DEFAULT_CONFIG.stabilization, ...config?.stabilization }
        };
        this.stateMachine = new HealthStateMachine(this.config.stabilization);
        this.lastStatus = { ...types_1.DEFAULT_HEALTH_STATUS };
    }
    checkHealth() {
        console.log('\n[Health Check] Starting health evaluation');
        const metricsData = this.metrics.getMetrics();
        // Evaluate individual components
        const memoryHealth = evaluateMemoryMetrics(metricsData, this.config.memoryThresholds, this.lastStatus.indicators.memory.status);
        const performanceHealth = evaluatePerformanceMetrics(metricsData, this.config.performanceThresholds, this.lastStatus.indicators.performance.status);
        const errorHealth = evaluateErrorMetrics(metricsData, this.config.errorThresholds, this.config.timeWindows.errorRateWindow, this.metrics, this.lastStatus.indicators.errors.status);
        // Calculate overall status
        const indicators = { memory: memoryHealth, performance: performanceHealth, errors: errorHealth };
        // Add to pending samples and get status
        const proposedStatus = this.determineOverallStatus(indicators);
        this.pendingSamples.push({ status: proposedStatus.status, timestamp: Date.now() });
        if (this.pendingSamples.length > this.pendingSamplesLimit) {
            this.pendingSamples.shift();
        }
        // Check if we have enough samples for state transition
        const recentSamples = this.pendingSamples.slice(-this.config.stabilization.confirmationSamples);
        const allSamplesMatch = recentSamples.length >= this.config.stabilization.confirmationSamples &&
            recentSamples.every(s => s.status === recentSamples[0].status);
        // Return current status if samples don't match
        if (!allSamplesMatch) {
            console.log(`[Health Check] Waiting for confirmation samples (${recentSamples.length}/${this.config.stabilization.confirmationSamples})`);
            return this.lastStatus;
        }
        // Try to transition if needed
        if (proposedStatus.status !== this.lastStatus.status) {
            try {
                if (this.stateMachine.canTransition(this.lastStatus.status, proposedStatus.status)) {
                    this.stateMachine.transition(this.lastStatus.status, proposedStatus.status);
                    this.recordStatusTransition(proposedStatus.status);
                    this.lastStatus = proposedStatus;
                    console.log(`[Health Check] State transition confirmed: ${this.lastStatus.status} -> ${proposedStatus.status}`);
                }
                else {
                    console.log(`[Health Check] State transition rejected by state machine`);
                    return this.lastStatus;
                }
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                console.log(`[Health Check] State transition error: ${errorMessage}`);
                return this.lastStatus;
            }
        }
        console.log(`[Health Check] Final status: ${proposedStatus.status}\n`);
        return proposedStatus;
    }
    getLastStatus() {
        return this.lastStatus;
    }
    getStatusHistory() {
        return [...this.statusHistory];
    }
    determineOverallStatus(indicators) {
        const currentState = this.lastStatus.status;
        const weights = { memory: 0.25, performance: 0.5, errors: 0.25 };
        const score = this.calculateHealthScore(indicators, weights);
        // Determine proposed state based on current state and metrics
        let proposedState;
        if (currentState === 'healthy') {
            // From healthy, can only go to degraded
            if (score < 0.85 ||
                indicators.performance.status === 'degraded' ||
                indicators.memory.status === 'degraded' ||
                indicators.errors.status === 'degraded') {
                proposedState = 'degraded';
            }
            else {
                proposedState = 'healthy';
            }
        }
        else if (currentState === 'degraded') {
            // From degraded, check recovery first
            if (score >= 0.85 &&
                indicators.performance.status === 'healthy' &&
                indicators.memory.status === 'healthy' &&
                indicators.errors.status === 'healthy') {
                proposedState = 'healthy';
            }
            // Then check for further degradation
            else if (indicators.memory.status === 'unhealthy' ||
                indicators.performance.status === 'unhealthy' ||
                indicators.errors.status === 'unhealthy' ||
                score < 0.45) {
                proposedState = 'unhealthy';
            }
            else {
                proposedState = 'degraded';
            }
        }
        else { // currentState === 'unhealthy'
            // From unhealthy, can only go to degraded
            if (score >= 0.45 &&
                indicators.performance.status !== 'unhealthy' &&
                indicators.memory.status !== 'unhealthy' &&
                indicators.errors.status !== 'unhealthy') {
                proposedState = 'degraded';
            }
            else {
                proposedState = 'unhealthy';
            }
        }
        // Attempt state transition if needed
        let finalState = currentState;
        if (proposedState !== currentState) {
            try {
                if (this.stateMachine.canTransition(currentState, proposedState)) {
                    finalState = proposedState;
                }
            }
            catch (error) {
                console.log(`[Health Monitor] State transition validation failed: ${error}`);
            }
        }
        const healthMetrics = {
            errorRate: indicators.errors.errorRate,
            responseTime: indicators.performance.averageLatency,
            throughput: indicators.performance.throughput,
            totalOperations: this.metrics.getTotalOperations()
        };
        const enrichedIndicators = {
            ...indicators,
            metrics: healthMetrics
        };
        return {
            status: finalState,
            indicators: enrichedIndicators,
            lastCheck: new Date(),
            recommendations: this.generateRecommendations(indicators),
            metrics: healthMetrics
        };
    }
    calculateHealthScore(indicators, weights) {
        const statusScore = (status) => {
            switch (status) {
                case 'healthy': return 1;
                case 'degraded': return 0.4;
                case 'unhealthy': return 0;
                default: return 0;
            }
        };
        return (statusScore(indicators.memory.status) * weights.memory +
            statusScore(indicators.performance.status) * weights.performance +
            statusScore(indicators.errors.status) * weights.errors);
    }
    recordStatusTransition(newStatus) {
        this.statusHistory.push({ status: newStatus, timestamp: Date.now() });
        if (this.statusHistory.length > this.historyLimit) {
            this.statusHistory.shift();
        }
    }
    generateRecommendations(indicators) {
        const recommendations = [];
        if (indicators.memory.status !== 'healthy') {
            recommendations.push('Consider increasing cleanup frequency', 'Review cache eviction policies', 'Monitor memory growth patterns');
        }
        if (indicators.performance.status !== 'healthy') {
            if (indicators.performance.spikeFactor > 1.5) {
                recommendations.push('Investigate latency spikes', 'Review system resource contention', 'Check for background processes');
            }
            if (indicators.performance.recentThroughput < indicators.performance.throughput * 0.8) {
                recommendations.push('Investigate recent throughput drop', 'Check for system bottlenecks', 'Monitor resource utilization');
            }
        }
        if (indicators.errors.status !== 'healthy') {
            recommendations.push('Review error logs for patterns', 'Check validation rules', 'Monitor error rate trends', 'Consider implementing circuit breakers');
        }
        return recommendations;
    }
}
exports.HealthMonitor = HealthMonitor;
// Default configuration
const DEFAULT_CONFIG = {
    memoryThresholds: {
        heapUsageWarning: 0.65,
        heapUsageCritical: 0.80,
        heapUsageRecovery: 0.60,
        cacheUtilizationWarning: 0.75,
        cacheUtilizationCritical: 0.85,
        cacheUtilizationRecovery: 0.70,
    },
    performanceThresholds: {
        latencyWarning: 30,
        latencyCritical: 45,
        latencyRecovery: 25,
        throughputWarning: 55,
        throughputCritical: 30,
        throughputRecovery: 60
    },
    errorThresholds: {
        errorRateWarning: 0.03,
        errorRateCritical: 0.08,
        errorRateRecovery: 0.02,
    },
    timeWindows: {
        errorRateWindow: 45000,
        performanceWindow: 20000
    },
    stabilization: {
        minStateDuration: 7000,
        confirmationSamples: 5,
        cooldownPeriod: 1500,
        maxTransitionsPerMinute: 8
    }
};
//# sourceMappingURL=health-monitor.js.map