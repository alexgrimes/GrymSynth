import { ResourceRequest } from '../types';
import { PooledResource } from './types';
export declare class PoolCache {
    private cache;
    private maxSize;
    private hits;
    private misses;
    constructor(maxSize: number);
    get(request: ResourceRequest): PooledResource | undefined;
    put(request: ResourceRequest, resource: PooledResource): void;
    remove(request: ResourceRequest): void;
    clear(): void;
    getHitRate(): number;
    getSize(): number;
    private createCacheKey;
    private evictOldest;
}
