"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorAdapter = exports.ResourcePoolError = void 0;
const errors_1 = require("../types/errors");
/**
 * Error from resource pool operations
 */
class ResourcePoolError extends Error {
    constructor(code, message, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'ResourcePoolError';
        Object.setPrototypeOf(this, ResourcePoolError.prototype);
    }
}
exports.ResourcePoolError = ResourcePoolError;
/**
 * Adapter to convert various error types to MCP errors
 */
class ErrorAdapter {
    /**
     * Convert any error to an MCP error
     */
    static toMcpError(error) {
        // Already an MCP error
        if (error instanceof errors_1.McpError) {
            return error;
        }
        // Resource pool error
        if (error instanceof ResourcePoolError) {
            return this.convertResourcePoolError(error);
        }
        // Standard Error
        if (error instanceof Error) {
            return new errors_1.McpError(500, error.message);
        }
        // Unknown error type
        return new errors_1.McpError(500, 'An unexpected error occurred');
    }
    /**
     * Convert resource pool error to MCP error
     */
    static convertResourcePoolError(error) {
        const statusCode = this.getStatusCode(error.code);
        const message = this.formatErrorMessage(error);
        return new errors_1.McpError(statusCode, message);
    }
    /**
     * Map resource pool error codes to HTTP status codes
     */
    static getStatusCode(code) {
        switch (code) {
            case 'RESOURCE_STALE':
                return 404;
            case 'POOL_EXHAUSTED':
                return 503;
            case 'VALIDATION_ERROR':
                return 400;
            default:
                return 500;
        }
    }
    /**
     * Format error message with context
     */
    static formatErrorMessage(error) {
        let message = error.message;
        if (error.code) {
            message += ` (${error.code})`;
        }
        if (error.context) {
            const details = Object.entries(error.context)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            message += ` - ${details}`;
        }
        return message;
    }
}
exports.ErrorAdapter = ErrorAdapter;
//# sourceMappingURL=error-adapter.js.map