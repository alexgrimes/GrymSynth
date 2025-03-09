import { HealthMonitor } from "../../../monitoring/HealthMonitor";

export enum AudioProcessingErrorType {
  CONNECTION_ERROR = "connection_error",
  TIMEOUT_ERROR = "timeout_error",
  MODEL_ERROR = "model_error",
  INVALID_INPUT = "invalid_input",
  RESOURCE_EXCEEDED = "resource_exceeded",
  UNKNOWN_ERROR = "unknown_error",
}

export interface AudioProcessingError extends Error {
  type: AudioProcessingErrorType;
  details?: Record<string, any>;
  recoverable: boolean;
  retryable: boolean;
}

export class AudioProcessingErrorHandler {
  constructor(private healthMonitor: HealthMonitor) {}

  handleError(error: Error | AudioProcessingError): AudioProcessingError {
    // If it's already an AudioProcessingError, just record it
    if ("type" in error) {
      this.recordError(error as AudioProcessingError);
      return error as AudioProcessingError;
    }

    // Otherwise, classify the error
    const processedError = this.classifyError(error);
    this.recordError(processedError);
    return processedError;
  }

  private classifyError(error: Error): AudioProcessingError {
    const message = error.message.toLowerCase();

    // Classify based on error message
    if (message.includes("network") || message.includes("connection")) {
      return {
        name: "ConnectionError",
        message: error.message,
        type: AudioProcessingErrorType.CONNECTION_ERROR,
        stack: error.stack,
        recoverable: true,
        retryable: true,
      };
    }

    if (message.includes("timeout")) {
      return {
        name: "TimeoutError",
        message: error.message,
        type: AudioProcessingErrorType.TIMEOUT_ERROR,
        stack: error.stack,
        recoverable: true,
        retryable: true,
      };
    }

    if (message.includes("model") || message.includes("prediction")) {
      return {
        name: "ModelError",
        message: error.message,
        type: AudioProcessingErrorType.MODEL_ERROR,
        stack: error.stack,
        recoverable: false,
        retryable: false,
      };
    }

    if (message.includes("invalid") || message.includes("input")) {
      return {
        name: "InvalidInputError",
        message: error.message,
        type: AudioProcessingErrorType.INVALID_INPUT,
        stack: error.stack,
        recoverable: false,
        retryable: false,
      };
    }

    if (message.includes("memory") || message.includes("resource")) {
      return {
        name: "ResourceExceededError",
        message: error.message,
        type: AudioProcessingErrorType.RESOURCE_EXCEEDED,
        stack: error.stack,
        recoverable: true,
        retryable: false,
      };
    }

    // Default case
    return {
      name: "UnknownError",
      message: error.message,
      type: AudioProcessingErrorType.UNKNOWN_ERROR,
      stack: error.stack,
      recoverable: false,
      retryable: false,
    };
  }

  private recordError(error: AudioProcessingError): void {
    this.healthMonitor.recordMetric("audio.processing.error", {
      type: error.type,
      message: error.message,
      recoverable: error.recoverable,
      retryable: error.retryable,
      timestamp: Date.now(),
    });
  }

  /**
   * Get recovery action suggestions based on error type
   */
  suggestRecoveryAction(error: AudioProcessingError): string {
    switch (error.type) {
      case AudioProcessingErrorType.CONNECTION_ERROR:
        return "Check network connection and try again";

      case AudioProcessingErrorType.TIMEOUT_ERROR:
        return "Try processing a smaller audio segment or try again later";

      case AudioProcessingErrorType.MODEL_ERROR:
        return "Try using a different model configuration";

      case AudioProcessingErrorType.INVALID_INPUT:
        return "Check the audio file format and ensure it is valid";

      case AudioProcessingErrorType.RESOURCE_EXCEEDED:
        return "Try processing a smaller audio file or free up system resources";

      default:
        return "Contact support if the issue persists";
    }
  }

  /**
   * Check if an error should trigger a retry attempt
   */
  shouldRetry(error: AudioProcessingError): boolean {
    return error.retryable;
  }

  /**
   * Calculate appropriate backoff time for retries
   */
  getRetryBackoff(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const exponential = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
    const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
    return exponential + jitter;
  }
}
