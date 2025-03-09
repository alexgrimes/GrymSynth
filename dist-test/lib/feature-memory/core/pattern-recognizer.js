"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternRecognizer = void 0;
const types_1 = require("./types");
const metrics_collector_1 = require("./metrics-collector");
const lru_cache_1 = require("./lru-cache");
const health_monitor_1 = require("./health-monitor");
function createRecognitionMetrics(startTime, baseMetrics) {
    return {
        ...(0, types_1.createFeatureMemoryMetrics)({
            timestamp: new Date(),
            durationMs: performance.now() - startTime,
            patternRecognitionLatency: baseMetrics.patternRecognitionLatency,
            storageOperationLatency: baseMetrics.storageOperationLatency,
            optimizationEffectiveness: baseMetrics.optimizationEffectiveness,
            recentLatencies: baseMetrics.recentLatencies
        }, {
            ...types_1.DEFAULT_RESOURCE_METRICS,
            memoryUsage: process.memoryUsage().heapUsed,
            cpuUsage: baseMetrics.resourceUsage.cpuUsage,
            storageUsage: baseMetrics.resourceUsage.storageUsage,
            storageLimit: baseMetrics.resourceUsage.storageLimit
        }, baseMetrics.healthStatus),
        operationType: 'recognition'
    };
}
class PatternRecognizer {
    constructor(options = {}) {
        this.patterns = [];
        this.cleanupInterval = null;
        this.healthCheckInterval = null;
        this.featureIndex = new Map();
        this.recentLatencies = [];
        this.maxLatencyHistory = 1000;
        this.options = { ...PatternRecognizer.DEFAULT_OPTIONS, ...options };
        this.metrics = new metrics_collector_1.MetricsCollector();
        this.healthMonitor = new health_monitor_1.HealthMonitor(this.metrics);
        this.cache = new lru_cache_1.LRUCache(this.options.cacheSize);
        this.initializeIntervals();
    }
    initializeIntervals() {
        // Clear any existing intervals first
        this.clearIntervals();
        try {
            this.cleanupInterval = setInterval(() => {
                try {
                    const metrics = this.cache.getMetrics();
                    if (metrics.size > this.options.cacheSize * 0.75) {
                        this.cache.cleanup(Math.floor(this.options.cacheSize * 0.5));
                    }
                    this.cleanupLatencyHistory();
                }
                catch (error) {
                    console.error('Error in cleanup interval:', error);
                    // Don't let errors stop the interval, but log them
                }
            }, this.options.cacheExpiration / 2);
            this.healthCheckInterval = setInterval(() => {
                try {
                    this.updateHealthStatus();
                }
                catch (error) {
                    console.error('Error in health check interval:', error);
                    // Don't let errors stop the interval, but log them
                }
            }, this.options.healthCheckInterval);
            // Set error handlers for the intervals
            if (this.cleanupInterval) {
                this.cleanupInterval.unref(); // Don't keep process alive
            }
            if (this.healthCheckInterval) {
                this.healthCheckInterval.unref(); // Don't keep process alive
            }
        }
        catch (error) {
            this.clearIntervals(); // Clean up on initialization error
            throw error;
        }
    }
    clearIntervals() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
    async recognizePatterns(features) {
        const startTime = performance.now();
        this.metrics.startOperation('recognizePatterns');
        try {
            if (!features || features.size === 0) {
                throw new Error('Invalid feature set');
            }
            // Validate feature values
            for (const [, value] of features.entries()) {
                if (value === null || value === undefined) {
                    throw new Error('Invalid feature values');
                }
            }
            // Check cache first
            const cacheKey = this.generateCacheKey(features);
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.options.cacheExpiration) {
                const duration = performance.now() - startTime;
                this.recordLatency(duration);
                this.metrics.endOperation('recognizePatterns');
                return {
                    success: true,
                    matches: [cached.pattern],
                    confidence: cached.confidence,
                    metrics: createRecognitionMetrics(startTime, this.metrics.getMetrics()),
                    health: this.healthMonitor.checkHealth()
                };
            }
            // Use indexed search for faster matching
            const candidatePatterns = this.findCandidatePatterns(features);
            const matches = await this.findMatchesInCandidates(candidatePatterns, features, startTime);
            // Calculate confidence from best match
            const bestMatch = matches[0];
            const confidence = bestMatch ? bestMatch.similarity : 0;
            const patterns = matches.map(m => m.pattern);
            // Update cache with best match
            if (bestMatch) {
                this.cache.set(cacheKey, {
                    pattern: bestMatch.pattern,
                    timestamp: Date.now(),
                    confidence
                });
            }
            const duration = performance.now() - startTime;
            this.recordLatency(duration);
            this.metrics.endOperation('recognizePatterns');
            return {
                success: true,
                matches: patterns,
                confidence,
                metrics: createRecognitionMetrics(startTime, this.metrics.getMetrics()),
                health: this.healthMonitor.checkHealth()
            };
        }
        catch (error) {
            this.metrics.recordError('recognizePatterns');
            this.metrics.endOperation('recognizePatterns');
            return {
                success: false,
                matches: [],
                error: error instanceof Error ? error.message : 'Unknown error',
                errorType: 'processing',
                metrics: createRecognitionMetrics(startTime, this.metrics.getMetrics()),
                health: this.healthMonitor.checkHealth()
            };
        }
    }
    recordLatency(duration) {
        this.recentLatencies.push(duration);
        if (this.recentLatencies.length > this.maxLatencyHistory) {
            this.recentLatencies.shift();
        }
    }
    cleanupLatencyHistory() {
        if (this.recentLatencies.length > this.maxLatencyHistory) {
            this.recentLatencies = this.recentLatencies.slice(-this.maxLatencyHistory);
        }
    }
    async addPattern(pattern) {
        this.metrics.startOperation('addPattern');
        const startTime = performance.now();
        try {
            const validationResult = await this.validatePattern(pattern);
            if (!validationResult.isValid) {
                this.metrics.endOperation('addPattern');
                return validationResult;
            }
            const newPattern = {
                ...pattern,
                id: this.generatePatternId()
            };
            // Maintain max patterns limit with LRU eviction
            if (this.patterns.length >= this.options.maxPatterns) {
                this.evictLeastRecentlyUsed();
            }
            this.patterns.push(newPattern);
            this.indexPattern(newPattern);
            const duration = performance.now() - startTime;
            this.metrics.recordLatency('addPattern', duration);
            this.metrics.endOperation('addPattern');
            return {
                isValid: true,
                errors: [],
                warnings: [],
                metadata: {
                    timestamp: new Date(),
                    validationDuration: duration,
                    validatedItemsCount: 1
                }
            };
        }
        catch (error) {
            this.metrics.recordError('addPattern');
            this.metrics.endOperation('addPattern');
            throw this.wrapError(error, 'Failed to add pattern');
        }
    }
    indexPattern(pattern) {
        for (const [key, value] of pattern.features.entries()) {
            const indexKey = `${key}:${this.getIndexValue(value)}`;
            if (!this.featureIndex.has(indexKey)) {
                this.featureIndex.set(indexKey, new Set());
            }
            this.featureIndex.get(indexKey).add(pattern);
        }
    }
    getIndexValue(value) {
        if (value === null || value === undefined)
            return '';
        if (typeof value === 'object')
            return JSON.stringify(Object.keys(value).sort());
        return String(value);
    }
    findCandidatePatterns(features) {
        const candidates = new Set();
        let isFirst = true;
        for (const [key, value] of features.entries()) {
            const indexKey = `${key}:${this.getIndexValue(value)}`;
            const matches = this.featureIndex.get(indexKey);
            if (matches) {
                if (isFirst) {
                    matches.forEach(pattern => candidates.add(pattern));
                    isFirst = false;
                }
                else {
                    // Intersect with existing candidates
                    for (const pattern of candidates) {
                        if (!matches.has(pattern)) {
                            candidates.delete(pattern);
                        }
                    }
                }
            }
        }
        return candidates;
    }
    async findMatchesInCandidates(candidates, features, startTime) {
        const matches = [];
        const timeoutAt = startTime + this.options.timeout;
        const requiredFeatures = new Set(features.keys());
        for (const pattern of candidates) {
            if (performance.now() >= timeoutAt) {
                break;
            }
            // Check if pattern has all required features
            const hasAllFeatures = Array.from(requiredFeatures).every(key => pattern.features.has(key));
            if (!hasAllFeatures) {
                continue;
            }
            const similarity = this.calculateSimilarity(pattern.features, features);
            // Stricter matching criteria
            const exactMatch = Array.from(features.entries()).every(([key, value]) => this.compareFeatureValues(pattern.features.get(key), value));
            // Calculate feature coverage
            const featureCoverage = Array.from(features.keys())
                .filter(key => pattern.features.has(key))
                .length / features.size;
            // Require both high similarity and good feature coverage
            if (similarity >= this.options.threshold && featureCoverage >= 0.8) {
                const finalSimilarity = exactMatch ? 1.0 :
                    similarity * (featureCoverage ** 2); // Penalize missing features more heavily
                // Only include if final similarity still meets threshold
                if (finalSimilarity >= this.options.threshold) {
                    matches.push({
                        pattern,
                        similarity: finalSimilarity
                    });
                }
            }
        }
        // Sort by similarity and limit results
        return matches
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 5); // Limit to top 5 matches
    }
    async validatePattern(pattern) {
        this.metrics.startOperation('validatePattern');
        const startTime = performance.now();
        const errors = [];
        const warnings = [];
        try {
            if (!pattern.features || !(pattern.features instanceof Map)) {
                errors.push({
                    code: 'INVALID_FEATURES',
                    message: 'Features must be provided as a Map',
                    severity: 'critical'
                });
            }
            if (typeof pattern.confidence !== 'number' || pattern.confidence < 0 || pattern.confidence > 1) {
                errors.push({
                    code: 'INVALID_CONFIDENCE',
                    message: 'Confidence must be a number between 0 and 1',
                    severity: 'critical'
                });
            }
            if (!pattern.metadata || !pattern.metadata.source || !pattern.metadata.category) {
                errors.push({
                    code: 'INVALID_METADATA',
                    message: 'Pattern metadata must include source and category',
                    severity: 'critical'
                });
            }
            if (pattern.features?.size === 0) {
                warnings.push({
                    code: 'EMPTY_FEATURES',
                    message: 'Pattern has no features defined'
                });
            }
            const duration = performance.now() - startTime;
            this.metrics.recordLatency('validatePattern', duration);
            this.metrics.endOperation('validatePattern');
            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                metadata: {
                    timestamp: new Date(),
                    validationDuration: duration,
                    validatedItemsCount: 1
                }
            };
        }
        catch (error) {
            this.metrics.recordError('validatePattern');
            this.metrics.endOperation('validatePattern');
            throw new Error(`Pattern validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    updateHealthStatus() {
        const metrics = this.metrics.getMetrics();
        const health = this.healthMonitor.checkHealth();
        const memUsage = process.memoryUsage();
        const heapUsed = memUsage.heapUsed / 1024 / 1024; // Convert to MB
        if (heapUsed > 200) { // More than 200MB
            this.cleanupResources();
        }
    }
    cleanupResources() {
        this.cache.cleanup(Math.floor(this.options.cacheSize * 0.7));
        if (this.patterns.length > this.options.maxPatterns * 0.9) {
            this.evictLeastRecentlyUsed(Math.floor(this.patterns.length * 0.2));
        }
        if (typeof global.gc === 'function') {
            global.gc();
        }
    }
    calculateSimilarity(pattern1, pattern2) {
        if (!pattern1 || !pattern2 || pattern1.size === 0 || pattern2.size === 0) {
            return 0;
        }
        let weightedScore = 0;
        let totalWeight = 0;
        let missingKeyPenalty = 0;
        const allKeys = new Set([...pattern1.keys(), ...pattern2.keys()]);
        for (const key of allKeys) {
            const weight = this.getFeatureWeight(key);
            totalWeight += weight;
            // Penalize missing keys more heavily
            if (!pattern1.has(key) || !pattern2.has(key)) {
                missingKeyPenalty += weight;
                continue;
            }
            const value1 = pattern1.get(key);
            const value2 = pattern2.get(key);
            // Calculate partial matching score with stricter criteria
            let matchScore = 0;
            if (Array.isArray(value1) && Array.isArray(value2)) {
                // Array similarity with order consideration
                const commonElements = value1.filter((v1, idx) => {
                    const v2 = value2[idx];
                    return v2 !== undefined && this.compareFeatureValues(v1, v2);
                });
                // Consider both order and content
                const orderScore = commonElements.length / Math.max(value1.length, value2.length);
                const contentScore = value1.filter(v1 => value2.some(v2 => this.compareFeatureValues(v1, v2))).length / Math.max(value1.length, value2.length);
                matchScore = (orderScore * 0.7 + contentScore * 0.3);
            }
            else if (typeof value1 === 'object' && value1 !== null &&
                typeof value2 === 'object' && value2 !== null) {
                // Object similarity with nested property comparison
                const props1 = Object.keys(value1);
                const props2 = Object.keys(value2);
                // Check both property names and values
                const commonProps = props1.filter(p => {
                    if (!props2.includes(p))
                        return false;
                    return this.compareFeatureValues(value1[p], value2[p]);
                });
                // Consider both property coverage and value equality
                const propScore = commonProps.length / Math.max(props1.length, props2.length);
                matchScore = propScore;
            }
            else if (typeof value1 === 'string' && typeof value2 === 'string') {
                // Enhanced string similarity with length and content consideration
                const lengthScore = Math.min(value1.length, value2.length) / Math.max(value1.length, value2.length);
                const contentScore = this.calculateStringSimularity(value1, value2);
                matchScore = (lengthScore * 0.3 + contentScore * 0.7);
            }
            else if (typeof value1 === 'number' && typeof value2 === 'number') {
                // Numeric similarity with adaptive tolerance
                const range = Math.max(Math.abs(value1), Math.abs(value2));
                const tolerance = range < 1 ? 0.001 : range * 0.05; // 5% tolerance for larger numbers
                const diff = Math.abs(value1 - value2);
                matchScore = diff <= tolerance ? 1 : Math.max(0, 1 - (diff / (tolerance * 2)));
            }
            else {
                // Strict equality for other types
                matchScore = this.compareFeatureValues(value1, value2) ? 1 : 0;
            }
            weightedScore += matchScore * weight;
        }
        // Calculate final similarity score with penalties
        const baseSimilarity = totalWeight > 0 ? weightedScore / totalWeight : 0;
        const missingKeyFactor = 1 - (missingKeyPenalty / totalWeight);
        // Apply threshold and penalties
        const adjustedSimilarity = baseSimilarity * missingKeyFactor;
        if (adjustedSimilarity >= this.options.threshold) {
            return adjustedSimilarity;
        }
        else {
            // Exponential penalty for scores below threshold
            return adjustedSimilarity * Math.pow(adjustedSimilarity / this.options.threshold, 2);
        }
    }
    calculateStringSimularity(str1, str2) {
        if (str1 === str2)
            return 1;
        if (!str1 || !str2)
            return 0;
        // Normalize strings
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        if (s1 === s2)
            return 0.95; // Almost perfect match after normalization
        // Early exit for significant length differences
        if (s1.length < s2.length * 0.5 || s2.length < s1.length * 0.5)
            return 0;
        // Calculate Levenshtein distance
        const matrix = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(0));
        // Initialize first row and column
        for (let i = 0; i <= s1.length; i++)
            matrix[i][0] = i;
        for (let j = 0; j <= s2.length; j++)
            matrix[0][j] = j;
        // Fill in the rest of the matrix
        for (let i = 1; i <= s1.length; i++) {
            for (let j = 1; j <= s2.length; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, // deletion
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        // Calculate base similarity from edit distance
        const maxLength = Math.max(s1.length, s2.length);
        const editDistance = matrix[s1.length][s2.length];
        const baseSimilarity = 1 - (editDistance / maxLength);
        // Apply position-based penalties
        let positionPenalty = 0;
        const minLength = Math.min(s1.length, s2.length);
        for (let i = 0; i < minLength; i++) {
            if (s1[i] !== s2[i]) {
                // Penalize more heavily for mismatches at the start
                positionPenalty += 1 / (i + 1);
            }
        }
        positionPenalty = Math.min(positionPenalty / minLength, 0.5);
        // Calculate prefix similarity
        const prefixLength = Math.min(3, minLength);
        const prefix1 = s1.substring(0, prefixLength);
        const prefix2 = s2.substring(0, prefixLength);
        const prefixMatch = prefix1 === prefix2 ? 0.2 : 0;
        // Final score combines base similarity, position penalty, and prefix bonus
        return Math.max(0, Math.min(1, baseSimilarity * (1 - positionPenalty) + prefixMatch));
    }
    compareFeatureValues(value1, value2) {
        if (value1 === value2)
            return true;
        if (value1 == null || value2 == null)
            return false;
        if (typeof value1 !== typeof value2)
            return false;
        if (typeof value1 === 'number' && typeof value2 === 'number') {
            const tolerance = 0.000001;
            return Math.abs(value1 - value2) < tolerance;
        }
        if (typeof value1 === 'string') {
            return value1 === value2;
        }
        if (Array.isArray(value1) && Array.isArray(value2)) {
            return value1.length === value2.length &&
                value1.every((v, i) => this.compareFeatureValues(v, value2[i]));
        }
        if (typeof value1 === 'object') {
            const keys1 = Object.keys(value1);
            const keys2 = Object.keys(value2);
            return keys1.length === keys2.length &&
                keys1.every(key => keys2.includes(key) &&
                    this.compareFeatureValues(value1[key], value2[key]));
        }
        return false;
    }
    getFeatureWeight(featureKey) {
        const weights = new Map([
            ['id', 0.25],
            ['type', 0.20],
            ['category', 0.15],
            ['name', 0.10],
            ['description', 0.10],
            ['tags', 0.10],
            ['default', 0.05]
        ]);
        return weights.get(featureKey) ?? weights.get('default');
    }
    wrapError(error, message) {
        return new Error(`${message}: ${error.message}`);
    }
    generatePatternId() {
        return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateCacheKey(features) {
        const keyParts = [];
        for (const [key, value] of features.entries()) {
            keyParts.push(`${key}:${this.getIndexValue(value)}`);
        }
        return keyParts.sort().join('|');
    }
    evictLeastRecentlyUsed(count = 1) {
        if (count <= 0 || this.patterns.length === 0)
            return;
        // Sort by frequency and last access time
        this.patterns.sort((a, b) => {
            const freqDiff = (a.metadata.frequency || 0) - (b.metadata.frequency || 0);
            if (freqDiff !== 0)
                return freqDiff;
            const aTime = a.metadata.lastUpdated?.getTime() || a.timestamp.getTime();
            const bTime = b.metadata.lastUpdated?.getTime() || b.timestamp.getTime();
            return aTime - bTime;
        });
        // Calculate actual number to remove
        const actualCount = Math.min(count, this.patterns.length);
        const removed = this.patterns.splice(0, actualCount);
        // Batch process removals for better performance
        const cacheKeysToRemove = new Set();
        const indexKeysToUpdate = new Map();
        // Collect all keys to update
        removed.forEach(pattern => {
            // Collect cache keys
            cacheKeysToRemove.add(this.generateCacheKey(pattern.features));
            // Collect index keys
            for (const [key, value] of pattern.features.entries()) {
                const indexKey = `${key}:${this.getIndexValue(value)}`;
                if (!indexKeysToUpdate.has(indexKey)) {
                    indexKeysToUpdate.set(indexKey, new Set());
                }
                indexKeysToUpdate.get(indexKey).add(pattern);
            }
        });
        // Batch remove from cache
        cacheKeysToRemove.forEach(key => this.cache.delete(key));
        // Batch update index
        indexKeysToUpdate.forEach((patternsToRemove, indexKey) => {
            const patterns = this.featureIndex.get(indexKey);
            if (patterns) {
                patternsToRemove.forEach(pattern => patterns.delete(pattern));
                if (patterns.size === 0) {
                    this.featureIndex.delete(indexKey);
                }
            }
        });
        // Force cache cleanup to maintain size limits
        this.cache.cleanup(Math.floor(this.options.cacheSize * 0.75));
    }
    destroy() {
        try {
            this.metrics.startOperation('destroy');
            // Clear all intervals first
            this.clearIntervals();
            // Clean up resources in a specific order
            this.cleanupResources();
            // Clear all data structures
            this.cache.clear();
            this.patterns = [];
            this.featureIndex.clear();
            this.recentLatencies = [];
            // Force garbage collection if available
            if (typeof global.gc === 'function') {
                global.gc();
            }
            // End metrics operation last
            this.metrics.endOperation('destroy');
        }
        catch (error) {
            console.error('Error during destroy:', error);
            // Ensure intervals are cleared even if other cleanup fails
            this.clearIntervals();
            this.metrics.recordError('destroy');
            this.metrics.endOperation('destroy');
            throw error; // Re-throw to notify caller
        }
    }
}
exports.PatternRecognizer = PatternRecognizer;
PatternRecognizer.DEFAULT_OPTIONS = {
    threshold: 0.8,
    maxPatterns: 1000,
    timeout: 100,
    cacheSize: 100,
    cacheExpiration: 300000,
    healthCheckInterval: 60000,
    chunkSize: 50
};
//# sourceMappingURL=pattern-recognizer.js.map