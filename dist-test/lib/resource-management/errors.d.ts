/**
 * Base error class for resource management errors
 */
export declare class ResourceManagementError extends Error {
    readonly context?: Record<string, unknown> | undefined;
    constructor(message: string, context?: Record<string, unknown> | undefined);
}
/**
 * Error thrown by resource pool operations
 */
export declare class ResourcePoolError extends ResourceManagementError {
    readonly code: string;
    constructor(code: string, message: string, context?: Record<string, unknown>);
}
/**
 * Error thrown when resource allocation fails
 */
export declare class ResourceAllocationError extends ResourcePoolError {
    constructor(message: string, context?: Record<string, unknown>);
}
/**
 * Error thrown when resource pool is exhausted
 */
export declare class PoolExhaustedError extends ResourcePoolError {
    constructor(message?: string, context?: Record<string, unknown>);
}
/**
 * Error thrown when resource becomes stale
 */
export declare class StaleResourceError extends ResourcePoolError {
    constructor(message?: string, context?: Record<string, unknown>);
}
/**
 * Error thrown when resource validation fails
 */
export declare class ResourceValidationError extends ResourcePoolError {
    constructor(message: string, context?: Record<string, unknown>);
}
/**
 * Error thrown during resource cleanup
 */
export declare class ResourceCleanupError extends ResourcePoolError {
    constructor(message: string, context?: Record<string, unknown>);
}
