"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCleanupError = exports.ResourceValidationError = exports.StaleResourceError = exports.PoolExhaustedError = exports.ResourceAllocationError = exports.ResourcePoolError = exports.ResourceManagementError = void 0;
/**
 * Base error class for resource management errors
 */
class ResourceManagementError extends Error {
    constructor(message, context) {
        super(message);
        this.context = context;
        this.name = 'ResourceManagementError';
        Object.setPrototypeOf(this, ResourceManagementError.prototype);
    }
}
exports.ResourceManagementError = ResourceManagementError;
/**
 * Error thrown by resource pool operations
 */
class ResourcePoolError extends ResourceManagementError {
    constructor(code, message, context) {
        super(message, context);
        this.code = code;
        this.name = 'ResourcePoolError';
        Object.setPrototypeOf(this, ResourcePoolError.prototype);
    }
}
exports.ResourcePoolError = ResourcePoolError;
/**
 * Error thrown when resource allocation fails
 */
class ResourceAllocationError extends ResourcePoolError {
    constructor(message, context) {
        super('ALLOCATION_ERROR', message, context);
        this.name = 'ResourceAllocationError';
        Object.setPrototypeOf(this, ResourceAllocationError.prototype);
    }
}
exports.ResourceAllocationError = ResourceAllocationError;
/**
 * Error thrown when resource pool is exhausted
 */
class PoolExhaustedError extends ResourcePoolError {
    constructor(message = 'No resources available', context) {
        super('POOL_EXHAUSTED', message, context);
        this.name = 'PoolExhaustedError';
        Object.setPrototypeOf(this, PoolExhaustedError.prototype);
    }
}
exports.PoolExhaustedError = PoolExhaustedError;
/**
 * Error thrown when resource becomes stale
 */
class StaleResourceError extends ResourcePoolError {
    constructor(message = 'Resource has expired', context) {
        super('RESOURCE_STALE', message, context);
        this.name = 'StaleResourceError';
        Object.setPrototypeOf(this, StaleResourceError.prototype);
    }
}
exports.StaleResourceError = StaleResourceError;
/**
 * Error thrown when resource validation fails
 */
class ResourceValidationError extends ResourcePoolError {
    constructor(message, context) {
        super('VALIDATION_ERROR', message, context);
        this.name = 'ResourceValidationError';
        Object.setPrototypeOf(this, ResourceValidationError.prototype);
    }
}
exports.ResourceValidationError = ResourceValidationError;
/**
 * Error thrown during resource cleanup
 */
class ResourceCleanupError extends ResourcePoolError {
    constructor(message, context) {
        super('CLEANUP_ERROR', message, context);
        this.name = 'ResourceCleanupError';
        Object.setPrototypeOf(this, ResourceCleanupError.prototype);
    }
}
exports.ResourceCleanupError = ResourceCleanupError;
//# sourceMappingURL=errors.js.map