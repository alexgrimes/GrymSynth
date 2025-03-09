/** Error types that can be simulated in tests */
type ResourceErrorType = 'exhausted' | 'stale' | 'validation';
/** Context object for creating detailed test errors */
interface ErrorContext {
    /** Error code identifier */
    code: string;
    /** Optional additional error details */
    details?: Record<string, unknown>;
}
/**
 * Utilities for creating and validating test errors
 */
export declare class ErrorTestUtils {
    /**
     * Creates a resource-specific error with predefined message and code
     * @param type - Type of resource error to create
     * @returns Error object with type-specific message and code
     */
    static createResourceError(type: ResourceErrorType): Error;
    /**
     * Creates an error with custom message and context
     * @param message - Custom error message
     * @param context - Error context including code and optional details
     * @returns Error object with context attached
     */
    static createErrorWithContext(message: string, context: ErrorContext): Error;
    /**
     * Verifies that an error has the expected error code
     * @param error - Error to verify
     * @param expectedCode - Expected error code
     * @throws Error if codes don't match
     */
    static verifyErrorCode(error: Error, expectedCode: string): void;
}
export {};
