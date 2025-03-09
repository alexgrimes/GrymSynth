import type { PoolConfig, PooledResource, ResourcePoolTier, CircuitBreakerConfig, PoolState, PoolAllocationResult, ResourcePoolError } from './types';
export { ResourcePoolManager } from './pool-manager';
export { PoolCache } from './pool-cache';
export { CircuitBreaker } from './circuit-breaker';
export type { PoolConfig, PooledResource, ResourcePoolTier, CircuitBreakerConfig, PoolState, PoolAllocationResult, ResourcePoolError };
export declare const DEFAULT_POOL_CONFIG: PoolConfig;
export declare const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig;
