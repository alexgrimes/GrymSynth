export interface CacheMetrics {
    size: number;
    maxSize: number;
    utilization: number;
    totalAccesses: number;
    averageAccesses: number;
    oldestAccess: Date;
    newestAccess: Date;
}
export declare class LRUCache<K, V> {
    private cache;
    private head;
    private tail;
    private readonly maxSize;
    private cleanupThreshold;
    private lastCleanup;
    private readonly cleanupInterval;
    constructor(maxSize: number);
    set(key: K, value: V): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    get size(): number;
    cleanup(targetSize?: number): void;
    getMetrics(): CacheMetrics;
    private moveToFront;
    private addToFront;
    private removeNode;
    private evictLRU;
}
