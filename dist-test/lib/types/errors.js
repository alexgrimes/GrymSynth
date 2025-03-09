"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.NotFoundError = exports.ValidationError = exports.ResourceError = exports.McpError = void 0;
/**
 * Base error class for MCP errors
 */
class McpError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'McpError';
        Object.setPrototypeOf(this, McpError.prototype);
    }
}
exports.McpError = McpError;
/**
 * Error thrown when a resource request cannot be fulfilled
 */
class ResourceError extends McpError {
    constructor(code, message, context) {
        super(code, message);
        this.context = context;
        this.name = 'ResourceError';
        Object.setPrototypeOf(this, ResourceError.prototype);
    }
}
exports.ResourceError = ResourceError;
/**
 * Error thrown when validation fails
 */
class ValidationError extends McpError {
    constructor(message, context) {
        super(400, message);
        this.context = context;
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * Error thrown when a resource is not found
 */
class NotFoundError extends McpError {
    constructor(message, context) {
        super(404, message);
        this.context = context;
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Error thrown when a service is unavailable
 */
class ServiceUnavailableError extends McpError {
    constructor(message, context) {
        super(503, message);
        this.context = context;
        this.name = 'ServiceUnavailableError';
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
//# sourceMappingURL=errors.js.map