"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternStorage = void 0;
const types_1 = require("./types");
const pattern_validator_1 = require("./pattern-validator");
const metrics_collector_1 = require("./metrics-collector");
const lru_cache_1 = require("./lru-cache");
const health_monitor_1 = require("./health-monitor");
const DEFAULT_OPTIONS = {
    maxPatterns: 10000,
    optimizationInterval: 3600000,
    compressionEnabled: true,
    persistenceEnabled: true,
    cacheSizeLimit: 1000,
    persistenceBatchSize: 100,
    persistenceInterval: 1000,
    healthCheckInterval: 60000, // 1 minute
};
class PatternStorage {
    constructor(options = {}, validator) {
        this.persistenceTimeout = null;
        this.optimizationInterval = null;
        this.healthCheckInterval = null;
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.patterns = new Map();
        this.persistenceQueue = [];
        this.validator = validator || new pattern_validator_1.PatternValidator();
        this.metrics = new metrics_collector_1.MetricsCollector();
        this.healthMonitor = new health_monitor_1.HealthMonitor(this.metrics);
        this.cache = new lru_cache_1.LRUCache(this.options.cacheSizeLimit);
        this.validationCache = new lru_cache_1.LRUCache(1000); // Cache recent validations
        this.featureIndices = new Map();
        this.initializeStorage();
    }
    initializeStorage() {
        if (this.options.optimizationInterval) {
            this.optimizationInterval = setInterval(() => this.optimize(), this.options.optimizationInterval);
        }
        this.healthCheckInterval = setInterval(() => this.healthMonitor.checkHealth(), this.options.healthCheckInterval);
    }
    async store(pattern) {
        const startTime = performance.now();
        this.metrics.startOperation('store');
        let validationResult = null;
        let storedSuccessfully = false;
        try {
            // Check validation cache first
            const cacheKey = this.generateValidationCacheKey(pattern);
            const cachedValidation = this.validationCache.get(cacheKey);
            if (cachedValidation) {
                validationResult = cachedValidation;
            }
            else {
                // Validate pattern if not in cache
                validationResult = await this.validator.validate(pattern);
                // Cache validation result regardless of success/failure
                this.validationCache.set(cacheKey, validationResult);
            }
            if (!validationResult.isValid) {
                const errorCode = validationResult.errors[0]?.code || 'VALIDATION_ERROR';
                const errorMessage = validationResult.errors[0]?.message || 'Validation failed';
                return (0, types_1.createStorageOperationResult)(validationResult, 'storage', startTime, false, `${errorCode}: ${errorMessage}`, 'validation');
            }
            // Check and optimize storage capacity
            if (this.patterns.size >= this.options.maxPatterns) {
                await this.optimize();
                if (this.patterns.size >= this.options.maxPatterns) {
                    return this.createCapacityError(startTime);
                }
            }
            // Prepare atomic operation
            const operations = new Map();
            const rollbacks = new Map();
            // Define operations and their rollbacks
            operations.set('patterns', () => {
                this.patterns.set(pattern.id, pattern);
                rollbacks.set('patterns', () => this.patterns.delete(pattern.id));
            });
            operations.set('indices', () => {
                this.updateIndices(pattern);
                rollbacks.set('indices', () => this.removeFromIndices(pattern));
            });
            operations.set('cache', () => {
                this.cache.set(pattern.id, { pattern, validationResult: validationResult });
                rollbacks.set('cache', () => this.cache.delete(pattern.id));
            });
            // Execute all operations
            try {
                for (const [, operation] of operations) {
                    operation();
                }
                storedSuccessfully = true;
            }
            catch (error) {
                // Execute rollbacks in reverse order
                for (const [, rollback] of Array.from(rollbacks).reverse()) {
                    try {
                        rollback();
                    }
                    catch (rollbackError) {
                        this.metrics.recordError('rollback');
                        console.error('Rollback failed:', rollbackError);
                    }
                }
                throw error;
            }
            // Queue for persistence only if storage was successful
            if (storedSuccessfully) {
                await this.queueForPersistence(pattern);
            }
            return (0, types_1.createStorageOperationResult)(validationResult, 'storage', startTime, true);
        }
        catch (error) {
            return this.handleStorageError(error, startTime);
        }
        finally {
            this.metrics.endOperation('store');
        }
    }
    async retrieve(id) {
        const startTime = performance.now();
        this.metrics.startOperation('retrieve');
        try {
            const cached = this.cache.get(id);
            if (cached) {
                return (0, types_1.createStorageOperationResult)(cached.pattern, 'retrieval', startTime, true);
            }
            const pattern = this.patterns.get(id);
            if (!pattern) {
                return (0, types_1.createStorageOperationResult)(null, 'retrieval', startTime, false, 'Pattern not found', 'processing');
            }
            return (0, types_1.createStorageOperationResult)(pattern, 'retrieval', startTime, true);
        }
        catch (error) {
            return this.handleRetrievalError(error, startTime);
        }
        finally {
            this.metrics.endOperation('retrieve');
        }
    }
    async search(criteria) {
        const startTime = performance.now();
        this.metrics.startOperation('search');
        try {
            if (!criteria) {
                return (0, types_1.createStorageOperationResult)([], 'search', startTime, false, 'Invalid search criteria', 'processing');
            }
            // Use indices for faster search
            const candidateIds = this.findCandidatesByIndices(criteria);
            const results = candidateIds.size > 0
                ? Array.from(candidateIds).map(id => this.patterns.get(id)).filter(p => this.matchesCriteria(p, criteria))
                : Array.from(this.patterns.values()).filter(p => this.matchesCriteria(p, criteria));
            return (0, types_1.createStorageOperationResult)(results, 'search', startTime, true);
        }
        catch (error) {
            return this.handleSearchError(error, startTime);
        }
        finally {
            this.metrics.endOperation('search');
        }
    }
    findCandidatesByIndices(criteria) {
        const candidates = new Set();
        let isFirst = true;
        // Use feature indices
        if (criteria.features instanceof Map) {
            for (const [key, value] of criteria.features.entries()) {
                const index = this.featureIndices.get(key);
                if (!index)
                    continue;
                const valueKey = this.getIndexKey(value);
                const matchingIds = index[valueKey];
                if (matchingIds) {
                    if (isFirst) {
                        matchingIds.forEach(id => candidates.add(id));
                        isFirst = false;
                    }
                    else {
                        // Intersect with existing candidates
                        for (const id of candidates) {
                            if (!matchingIds.has(id)) {
                                candidates.delete(id);
                            }
                        }
                    }
                }
            }
        }
        return candidates;
    }
    updateIndices(pattern) {
        for (const [key, value] of pattern.features.entries()) {
            let index = this.featureIndices.get(key);
            if (!index) {
                index = {};
                this.featureIndices.set(key, index);
            }
            const valueKey = this.getIndexKey(value);
            if (!index[valueKey]) {
                index[valueKey] = new Set();
            }
            index[valueKey].add(pattern.id);
        }
    }
    removeFromIndices(pattern) {
        for (const [key, value] of pattern.features.entries()) {
            const index = this.featureIndices.get(key);
            if (!index)
                continue;
            const valueKey = this.getIndexKey(value);
            const ids = index[valueKey];
            if (ids) {
                ids.delete(pattern.id);
                if (ids.size === 0) {
                    delete index[valueKey];
                }
            }
        }
    }
    getIndexKey(value) {
        if (value === null || value === undefined)
            return '';
        if (typeof value === 'object') {
            return JSON.stringify(Object.keys(value).sort());
        }
        return String(value);
    }
    generateValidationCacheKey(pattern) {
        const { id, timestamp, ...rest } = pattern;
        return JSON.stringify(rest);
    }
    async queueForPersistence(pattern) {
        this.metrics.startOperation('queuePersistence');
        try {
            this.persistenceQueue.push(pattern);
            if (this.persistenceQueue.length >= this.options.persistenceBatchSize) {
                await this.flushPersistenceQueue();
                return;
            }
            if (this.persistenceTimeout) {
                clearTimeout(this.persistenceTimeout);
            }
            this.persistenceTimeout = setTimeout(() => this.flushPersistenceQueue(), this.options.persistenceInterval);
        }
        finally {
            this.metrics.endOperation('queuePersistence');
        }
    }
    async flushPersistenceQueue() {
        if (!this.persistenceQueue.length)
            return;
        this.metrics.startOperation('flushPersistence');
        try {
            if (this.options.persistenceEnabled) {
                const batchesToProcess = this.chunkArray(this.persistenceQueue, this.options.persistenceBatchSize);
                await Promise.all(batchesToProcess.map(batch => this.persistBatch(batch)));
            }
            this.persistenceQueue = [];
        }
        catch (error) {
            this.metrics.recordError('flushPersistence');
            console.error('Failed to persist patterns:', error);
        }
        finally {
            this.metrics.endOperation('flushPersistence');
        }
    }
    async persistBatch(patterns) {
        this.metrics.startOperation('persistBatch');
        try {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        catch (error) {
            this.metrics.recordError('persistBatch');
            throw this.wrapError(error, 'Failed to persist batch');
        }
        finally {
            this.metrics.endOperation('persistBatch');
        }
    }
    matchesCriteria(pattern, criteria) {
        if (!pattern || !criteria)
            return false;
        let score = 0;
        let totalCriteria = 0;
        // Match metadata if provided
        if (criteria.metadata) {
            totalCriteria++;
            if (this.matchMetadata(pattern.metadata, criteria.metadata)) {
                score++;
            }
        }
        // Match features if provided
        if (criteria.features instanceof Map) {
            totalCriteria++;
            const featureMatchScore = this.matchFeatures(pattern.features, criteria.features);
            if (featureMatchScore > 0.7) { // Allow partial feature matches above 70%
                score++;
            }
        }
        // Return true if we match at least 70% of provided criteria
        return totalCriteria === 0 || (score / totalCriteria) >= 0.7;
    }
    matchMetadata(patternMeta, searchMeta) {
        if (!patternMeta || !searchMeta)
            return false;
        let matches = 0;
        let totalFields = 0;
        for (const [key, value] of Object.entries(searchMeta)) {
            if (value === undefined || value === null)
                continue;
            totalFields++;
            if (!patternMeta.hasOwnProperty(key))
                continue;
            // Handle array values with partial matching
            if (Array.isArray(value)) {
                if (Array.isArray(patternMeta[key])) {
                    const matchRatio = value.filter((v) => patternMeta[key].some((pv) => this.compareValues(v, pv))).length / value.length;
                    if (matchRatio >= 0.7) { // 70% of array elements must match
                        matches++;
                    }
                }
                continue;
            }
            // Handle object values recursively
            if (typeof value === 'object') {
                if (this.matchMetadata(patternMeta[key], value)) {
                    matches++;
                }
                continue;
            }
            // Handle primitive values with fuzzy matching
            if (this.compareValues(patternMeta[key], value)) {
                matches++;
            }
        }
        return totalFields === 0 || (matches / totalFields) >= 0.7;
    }
    matchFeatures(features1, features2) {
        if (!features1 || !features2)
            return 0;
        let matches = 0;
        let totalFeatures = features2.size;
        for (const [key, value] of features2.entries()) {
            if (!features1.has(key))
                continue;
            const storedValue = features1.get(key);
            // Handle array values with partial matching
            if (Array.isArray(value)) {
                if (Array.isArray(storedValue)) {
                    const matchRatio = value.filter((v) => storedValue.some((sv) => this.compareValues(v, sv))).length / value.length;
                    matches += matchRatio;
                }
                continue;
            }
            // Handle object values recursively
            if (typeof value === 'object' && value !== null) {
                if (typeof storedValue === 'object' && storedValue !== null) {
                    if (this.matchMetadata(storedValue, value)) {
                        matches++;
                    }
                }
                continue;
            }
            // Handle primitive values with fuzzy matching
            if (this.compareValues(storedValue, value)) {
                matches++;
            }
        }
        return totalFeatures > 0 ? matches / totalFeatures : 0;
    }
    compareValues(value1, value2) {
        if (value1 === value2)
            return true;
        // Handle string values with case-insensitive comparison
        if (typeof value1 === 'string' && typeof value2 === 'string') {
            return value1.toLowerCase() === value2.toLowerCase();
        }
        // Handle numeric values with tolerance
        if (typeof value1 === 'number' && typeof value2 === 'number') {
            const tolerance = Math.max(Math.abs(value1), Math.abs(value2)) * 0.001;
            return Math.abs(value1 - value2) <= tolerance;
        }
        return false;
    }
    async optimize() {
        this.metrics.startOperation('optimize');
        const removedPatterns = new Set();
        try {
            if (this.patterns.size >= this.options.maxPatterns) {
                // Sort by frequency and last access time
                const entries = Array.from(this.patterns.entries())
                    .sort(([, a], [, b]) => {
                    const freqDiff = (a.metadata.frequency || 0) - (b.metadata.frequency || 0);
                    if (freqDiff !== 0)
                        return freqDiff;
                    const aTime = a.metadata.lastUpdated?.getTime() || a.timestamp.getTime();
                    const bTime = b.metadata.lastUpdated?.getTime() || b.timestamp.getTime();
                    return aTime - bTime;
                });
                // Calculate optimal removal count based on current size
                const targetSize = Math.floor(this.options.maxPatterns * 0.8); // Target 80% capacity
                const removeCount = Math.max(Math.floor(entries.length * 0.2), // Remove at least 20%
                entries.length - targetSize // Or remove enough to reach target
                );
                // Batch process removals
                const toRemove = entries.slice(0, removeCount);
                // First phase: collect all patterns to remove
                toRemove.forEach(([, pattern]) => {
                    removedPatterns.add(pattern);
                });
                // Second phase: remove from all data structures atomically
                for (const pattern of removedPatterns) {
                    this.patterns.delete(pattern.id);
                    this.cache.delete(pattern.id);
                    this.validationCache.delete(this.generateValidationCacheKey(pattern));
                    this.removeFromIndices(pattern);
                }
                // Aggressive cache cleanup
                this.cache.cleanup(Math.floor(this.options.cacheSizeLimit * 0.7));
                this.validationCache.cleanup(Math.floor(this.options.cacheSizeLimit * 0.7));
            }
        }
        catch (error) {
            // Rollback on failure
            try {
                for (const pattern of removedPatterns) {
                    this.patterns.set(pattern.id, pattern);
                    this.updateIndices(pattern);
                }
            }
            catch (rollbackError) {
                this.metrics.recordError('optimizeRollback');
                throw this.wrapError(rollbackError, 'Failed to rollback optimization');
            }
            this.metrics.recordError('optimize');
            throw this.wrapError(error, 'Failed to optimize storage');
        }
        finally {
            this.metrics.endOperation('optimize');
        }
    }
    createCapacityError(startTime) {
        const failedResult = {
            isValid: false,
            errors: [{
                    code: 'STORAGE_LIMIT',
                    message: 'Storage capacity exceeded',
                    severity: 'critical'
                }],
            warnings: [],
            metadata: {
                timestamp: new Date(),
                validationDuration: performance.now() - startTime,
                validatedItemsCount: 0
            }
        };
        return (0, types_1.createStorageOperationResult)(failedResult, 'storage', startTime, false, 'Storage capacity exceeded', 'processing');
    }
    handleStorageError(error, startTime) {
        this.metrics.recordError('store');
        const errorMessage = this.wrapError(error, 'Storage operation failed').message;
        const failedResult = {
            isValid: false,
            errors: [{
                    code: 'STORAGE_ERROR',
                    message: errorMessage,
                    severity: 'critical'
                }],
            warnings: [],
            metadata: {
                timestamp: new Date(),
                validationDuration: performance.now() - startTime,
                validatedItemsCount: 0
            }
        };
        return (0, types_1.createStorageOperationResult)(failedResult, 'storage', startTime, false, errorMessage, 'processing');
    }
    handleRetrievalError(error, startTime) {
        this.metrics.recordError('retrieve');
        return (0, types_1.createStorageOperationResult)(null, 'retrieval', startTime, false, this.wrapError(error, 'Failed to retrieve pattern').message, 'processing');
    }
    handleSearchError(error, startTime) {
        this.metrics.recordError('search');
        return (0, types_1.createStorageOperationResult)([], 'search', startTime, false, this.wrapError(error, 'Failed to search patterns').message, 'processing');
    }
    chunkArray(array, size) {
        return array.reduce((chunks, item, index) => {
            const chunkIndex = Math.floor(index / size);
            if (!chunks[chunkIndex]) {
                chunks[chunkIndex] = [];
            }
            chunks[chunkIndex].push(item);
            return chunks;
        }, []);
    }
    wrapError(error, message) {
        return error instanceof Error
            ? new Error(`${message}: ${error.message}`)
            : new Error(`${message}: Unknown error`);
    }
    destroy() {
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
            this.optimizationInterval = null;
        }
        if (this.persistenceTimeout) {
            clearTimeout(this.persistenceTimeout);
            this.persistenceTimeout = null;
        }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}
exports.PatternStorage = PatternStorage;
//# sourceMappingURL=pattern-storage.js.map