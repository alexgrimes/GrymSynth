"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolCache = void 0;
class PoolCache {
    constructor(maxSize) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }
    get(request) {
        // Create cache key based on resource requirements
        const key = this.createCacheKey(request);
        const item = this.cache.get(key);
        if (item) {
            // Update last accessed time and hit count
            item.lastAccessed = Date.now();
            this.hits++;
            return item.resource;
        }
        this.misses++;
        return undefined;
    }
    put(request, resource) {
        const key = this.createCacheKey(request);
        // Evict oldest item if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(key, {
            resource,
            lastAccessed: Date.now()
        });
    }
    remove(request) {
        const key = this.createCacheKey(request);
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
    getHitRate() {
        const total = this.hits + this.misses;
        return total === 0 ? 0 : (this.hits / total) * 100;
    }
    getSize() {
        return this.cache.size;
    }
    createCacheKey(request) {
        // Create deterministic key based on request requirements
        const { type, requirements, constraints } = request;
        return JSON.stringify({
            type,
            requirements,
            constraints
        });
    }
    evictOldest() {
        let oldestKey;
        let oldestAccessed = Infinity;
        // Find least recently used item
        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccessed < oldestAccessed) {
                oldestAccessed = item.lastAccessed;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}
exports.PoolCache = PoolCache;
//# sourceMappingURL=pool-cache.js.map