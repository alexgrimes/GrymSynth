"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureMemorySystem = void 0;
const metrics_collector_1 = require("./metrics-collector");
const pattern_recognizer_1 = require("./pattern-recognizer");
const pattern_storage_1 = require("./pattern-storage");
const health_monitor_1 = require("./health-monitor");
class FeatureMemorySystem {
    constructor(options = {}) {
        this.metrics = new metrics_collector_1.MetricsCollector();
        this.recognizer = new pattern_recognizer_1.PatternRecognizer({
            cacheSize: options.cacheSize || 1000,
            threshold: options.recognitionThreshold || 0.8,
            maxPatterns: options.maxPatterns || 10000
        });
        this.storage = new pattern_storage_1.PatternStorage({
            cacheSizeLimit: options.cacheSize || 1000,
            persistenceEnabled: options.persistenceEnabled ?? false,
            maxPatterns: options.maxPatterns || 10000,
            healthCheckInterval: options.healthCheckInterval || 60000
        });
        this.healthMonitor = new health_monitor_1.HealthMonitor(this.metrics);
    }
    async recognizePattern(features) {
        this.metrics.startOperation('systemRecognizePattern');
        try {
            const result = await this.recognizer.recognizePatterns(features);
            this.metrics.endOperation('systemRecognizePattern');
            return {
                ...result,
                systemMetrics: this.metrics.getMetrics(),
                health: this.healthMonitor.checkHealth()
            };
        }
        catch (error) {
            this.metrics.recordError('systemRecognizePattern');
            this.metrics.endOperation('systemRecognizePattern');
            throw error;
        }
    }
    async storePattern(pattern) {
        this.metrics.startOperation('systemStorePattern');
        try {
            const result = await this.storage.store(pattern);
            await this.recognizer.addPattern(pattern);
            this.metrics.endOperation('systemStorePattern');
            return {
                ...result,
                metrics: {
                    ...result.metrics,
                    ...this.metrics.getMetrics()
                },
                health: this.healthMonitor.checkHealth()
            };
        }
        catch (error) {
            this.metrics.recordError('systemStorePattern');
            this.metrics.endOperation('systemStorePattern');
            throw error;
        }
    }
    async searchPatterns(criteria) {
        this.metrics.startOperation('systemSearchPatterns');
        try {
            const result = await this.storage.search(criteria);
            this.metrics.endOperation('systemSearchPatterns');
            return {
                ...result,
                metrics: {
                    ...result.metrics,
                    ...this.metrics.getMetrics()
                },
                health: this.healthMonitor.checkHealth()
            };
        }
        catch (error) {
            this.metrics.recordError('systemSearchPatterns');
            this.metrics.endOperation('systemSearchPatterns');
            throw error;
        }
    }
    async getHealth() {
        const healthStatus = this.healthMonitor.checkHealth();
        const metrics = this.metrics.getMetrics();
        const storage = await this.storage.store(await this.createHealthCheckPattern());
        const recognition = await this.recognizer.recognizePatterns(new Map([['type', 'healthcheck']]));
        return {
            status: healthStatus.status,
            indicators: healthStatus.indicators,
            lastCheck: healthStatus.lastCheck,
            recommendations: [
                ...healthStatus.recommendations,
                ...(storage.success ? [] : ['Storage system is not responding correctly']),
                ...(recognition.matches.length === 0 ? ['Pattern recognition system may be degraded'] : [])
            ],
            metrics: healthStatus.metrics
        };
    }
    async createHealthCheckPattern() {
        return {
            id: `healthcheck_${Date.now()}`,
            features: new Map([['type', 'healthcheck']]),
            confidence: 1,
            timestamp: new Date(),
            metadata: {
                source: 'system',
                category: 'healthcheck',
                frequency: 1,
                lastUpdated: new Date()
            }
        };
    }
    async destroy() {
        await Promise.all([
            this.storage.destroy(),
            // Add any other cleanup needed
        ]);
    }
}
exports.FeatureMemorySystem = FeatureMemorySystem;
//# sourceMappingURL=feature-memory-system.js.map