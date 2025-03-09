/**
 * Base error class for MCP errors
 */
export declare class McpError extends Error {
    readonly code: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: number, message: string, details?: Record<string, unknown> | undefined);
}
/**
 * Error thrown when a resource request cannot be fulfilled
 */
export declare class ResourceError extends McpError {
    readonly context?: Record<string, unknown> | undefined;
    constructor(code: number, message: string, context?: Record<string, unknown> | undefined);
}
/**
 * Error thrown when validation fails
 */
export declare class ValidationError extends McpError {
    readonly context?: Record<string, unknown> | undefined;
    constructor(message: string, context?: Record<string, unknown> | undefined);
}
/**
 * Error thrown when a resource is not found
 */
export declare class NotFoundError extends McpError {
    readonly context?: Record<string, unknown> | undefined;
    constructor(message: string, context?: Record<string, unknown> | undefined);
}
/**
 * Error thrown when a service is unavailable
 */
export declare class ServiceUnavailableError extends McpError {
    readonly context?: Record<string, unknown> | undefined;
    constructor(message: string, context?: Record<string, unknown> | undefined);
}
