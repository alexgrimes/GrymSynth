"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.handleApiError = exports.ErrorHandler = void 0;
const server_1 = require("next/server");
const toast_service_1 = require("./toast-service");
class ErrorHandler {
    constructor() {
        this.config = {
            maxRetries: 3,
            timeout: 300000,
            backoffFactor: 1.5
        };
    }
    async withRecovery(operation, onStatusUpdate) {
        let attempts = 0;
        let lastError = null;
        const updateStatus = (status) => {
            onStatusUpdate?.(status);
            if (status.isRetrying) {
                toast_service_1.toastService.loading(status.message);
            }
            else if (status.error) {
                toast_service_1.toastService.error(status.message);
            }
        };
        while (attempts < this.config.maxRetries) {
            try {
                if (attempts > 0) {
                    updateStatus({
                        isRetrying: true,
                        attempt: attempts,
                        maxAttempts: this.config.maxRetries,
                        message: `Retrying operation (attempt ${attempts}/${this.config.maxRetries})...`
                    });
                }
                const result = await operation();
                if (attempts > 0) {
                    toast_service_1.toastService.success('Operation recovered successfully');
                }
                return result;
            }
            catch (error) {
                lastError = error;
                attempts++;
                if (this.isRecoverable(error)) {
                    await this.handleRecoverableError(error, attempts, updateStatus);
                    continue;
                }
                updateStatus({
                    isRetrying: false,
                    attempt: attempts,
                    maxAttempts: this.config.maxRetries,
                    message: 'Unrecoverable error occurred',
                    error: lastError
                });
                break;
            }
        }
        const finalError = this.createFinalError(lastError, attempts);
        updateStatus({
            isRetrying: false,
            attempt: attempts,
            maxAttempts: this.config.maxRetries,
            message: finalError.message,
            error: finalError
        });
        throw finalError;
    }
    isRecoverable(error) {
        // Network related errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return true;
        }
        // HTTP errors that might be temporary
        if (error.status === 429 || // Too Many Requests
            error.status === 503 || // Service Unavailable
            error.status === 504) { // Gateway Timeout
            return true;
        }
        // Ollama specific errors
        if (error.message?.includes('MODEL_LOAD') || // Model loading issue
            error.message?.includes('connection') || // Connection issues
            error.message?.includes('timeout')) { // Timeout issues
            return true;
        }
        return false;
    }
    async handleRecoverableError(error, attempt, updateStatus) {
        // Calculate delay with exponential backoff
        const delay = Math.min(1000 * Math.pow(this.config.backoffFactor, attempt), 30000 // Max 30 seconds
        );
        updateStatus({
            isRetrying: true,
            attempt: attempt,
            maxAttempts: this.config.maxRetries,
            message: `Recoverable error occurred. Waiting ${Math.round(delay / 1000)}s before retry...`,
            error: error
        });
        console.error('Error details:', error);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    createFinalError(error, attempts) {
        return new Error(`Operation failed after ${attempts} attempts. Last error: ${error?.message || 'Unknown error'}`);
    }
}
exports.ErrorHandler = ErrorHandler;
// API error handler for Next.js API routes
function handleApiError(error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
        return server_1.NextResponse.json({ error: error.message }, { status: 500 });
    }
    return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
exports.handleApiError = handleApiError;
// Export a default instance
exports.errorHandler = new ErrorHandler();
//# sourceMappingURL=error-handler.js.map