"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
class LRUCache {
    constructor(maxSize) {
        this.head = null;
        this.tail = null;
        this.lastCleanup = Date.now();
        this.cleanupInterval = 60000; // 1 minute
        if (maxSize <= 0) {
            throw new Error('Cache size must be positive');
        }
        this.maxSize = maxSize;
        this.cleanupThreshold = Math.max(maxSize * 0.75, maxSize - 1); // More aggressive cleanup at 75% capacity
        this.cache = new Map();
    }
    set(key, value) {
        const now = Date.now();
        // Check if cleanup is needed
        if (now - this.lastCleanup > this.cleanupInterval) {
            this.cleanup();
            this.lastCleanup = now;
        }
        const existingNode = this.cache.get(key);
        if (existingNode) {
            // Update existing node
            existingNode.value = value;
            existingNode.lastAccess = now;
            existingNode.accessCount++;
            this.moveToFront(existingNode);
            return;
        }
        // Create new node
        const newNode = {
            key,
            value,
            prev: null,
            next: null,
            lastAccess: now,
            accessCount: 1
        };
        // Add to cache
        this.cache.set(key, newNode);
        this.addToFront(newNode);
        // Handle size limit
        if (this.cache.size > this.maxSize) {
            this.evictLRU();
        }
    }
    get(key) {
        const node = this.cache.get(key);
        if (!node)
            return undefined;
        // Update access info
        node.lastAccess = Date.now();
        node.accessCount++;
        this.moveToFront(node);
        return node.value;
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        const node = this.cache.get(key);
        if (!node)
            return false;
        this.removeNode(node);
        this.cache.delete(key);
        return true;
    }
    clear() {
        this.cache.clear();
        this.head = null;
        this.tail = null;
    }
    get size() {
        return this.cache.size;
    }
    cleanup(targetSize) {
        const limit = targetSize || this.maxSize;
        if (this.cache.size <= limit)
            return;
        // Calculate how many items to evict
        const toEvict = this.cache.size - limit;
        // Batch eviction for better performance
        for (let i = 0; i < toEvict; i++) {
            if (!this.tail)
                break;
            this.delete(this.tail.key);
        }
    }
    getMetrics() {
        let totalAccesses = 0;
        let oldestAccess = Date.now();
        let newestAccess = 0;
        for (const node of this.cache.values()) {
            totalAccesses += node.accessCount;
            oldestAccess = Math.min(oldestAccess, node.lastAccess);
            newestAccess = Math.max(newestAccess, node.lastAccess);
        }
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilization: this.cache.size / this.maxSize,
            totalAccesses,
            averageAccesses: totalAccesses / Math.max(this.cache.size, 1),
            oldestAccess: new Date(oldestAccess),
            newestAccess: new Date(newestAccess)
        };
    }
    moveToFront(node) {
        if (node === this.head)
            return;
        this.removeNode(node);
        this.addToFront(node);
    }
    addToFront(node) {
        if (!this.head) {
            this.head = node;
            this.tail = node;
            return;
        }
        node.next = this.head;
        this.head.prev = node;
        this.head = node;
        node.prev = null;
    }
    removeNode(node) {
        if (node.prev) {
            node.prev.next = node.next;
        }
        else {
            this.head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        else {
            this.tail = node.prev;
        }
        node.prev = null;
        node.next = null;
    }
    evictLRU() {
        if (!this.tail)
            return;
        this.delete(this.tail.key);
    }
}
exports.LRUCache = LRUCache;
//# sourceMappingURL=lru-cache.js.map