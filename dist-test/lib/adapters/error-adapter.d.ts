import { McpError } from '../types/errors';
/**
 * Error from resource pool operations
 */
export declare class ResourcePoolError extends Error {
    readonly code: string;
    readonly context?: Record<string, unknown> | undefined;
    constructor(code: string, message: string, context?: Record<string, unknown> | undefined);
}
/**
 * Adapter to convert various error types to MCP errors
 */
export declare class ErrorAdapter {
    /**
     * Convert any error to an MCP error
     */
    static toMcpError(error: unknown): McpError;
    /**
     * Convert resource pool error to MCP error
     */
    private static convertResourcePoolError;
    /**
     * Map resource pool error codes to HTTP status codes
     */
    private static getStatusCode;
    /**
     * Format error message with context
     */
    private static formatErrorMessage;
}
