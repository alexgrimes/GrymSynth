import { Logger } from "../../utils/logger";
import { GAMAServiceError } from "./GAMAService";

export interface ErrorHandlerConfig {
  maxRetries?: number;
  backoffFactor?: number;
  initialDelayMs?: number;
  reducedBatchSize?: number;
  logConfig?: any;
}

export interface ErrorHandlingResult {
  recoverySuccessful: boolean;
  result?: any;
  error?: Error;
  errorType: string;
  recoveryStrategy?: string;
}

export interface RecoveryContext {
  operation: (params: any) => Promise<any>;
  params: any;
  audioLength?: number;
  options?: any;
  expectedDimensions?: number;
}

export interface RetryConfig {
  maxRetries: number;
  backoffFactor: number;
  initialDelayMs: number;
}

export interface ResourceOptimizationConfig {
  reduceQuality: boolean;
  batchSize: number;
}

export interface ValidationRecoveryConfig {
  fallbackToDefaults: boolean;
}

/**
 * Interface for recovery strategies
 */
export interface RecoveryStrategy {
  name: string;
  execute(context: RecoveryContext): Promise<any>;
}

/**
 * Retry strategy for handling transient errors
 */
export class RetryStrategy implements RecoveryStrategy {
  name = 'retry';
  private config: RetryConfig;
  private logger: Logger;

  constructor(config: RetryConfig) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-error-handler-retry" });
  }

  async execute(context: RecoveryContext): Promise<any> {
    let lastError: Error = new Error("Unknown error");
    let delay = this.config.initialDelayMs;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.info(`Retry attempt ${attempt}/${this.config.maxRetries}`, {
          operation: context.operation.name,
          delay
        });

        // Wait for the backoff period
        await new Promise(resolve => setTimeout(resolve, delay));

        // Attempt to execute the operation again
        const result = await context.operation(context.params);

        this.logger.info(`Retry successful on attempt ${attempt}`, {
          operation: context.operation.name
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Retry attempt ${attempt} failed`, {
          operation: context.operation.name,
          error: lastError.message
        });

        delay *= this.config.backoffFactor;
      }
    }

    throw new GAMAServiceError(
      `Max retries exceeded: ${lastError.message}`,
      "RETRY_EXHAUSTED",
      { attempts: this.config.maxRetries }
    );
  }
}

/**
 * Resource optimization strategy for handling resource-related errors
 */
export class ResourceOptimizationStrategy implements RecoveryStrategy {
  name = 'resource-optimization';
  private config: ResourceOptimizationConfig;
  private logger: Logger;

  constructor(config: ResourceOptimizationConfig) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-error-handler-resource" });
  }

  async execute(context: RecoveryContext): Promise<any> {
    this.logger.info("Applying resource optimization strategy", {
      reduceQuality: this.config.reduceQuality,
      batchSize: this.config.batchSize
    });

    // Create optimized parameters
    const optimizedParams = { ...context.params };

    // If params has options, modify them
    if (optimizedParams.options) {
      optimizedParams.options = {
        ...optimizedParams.options,
        use_fp16: this.config.reduceQuality ? true : optimizedParams.options.use_fp16,
        batch_size: this.config.batchSize,
        use_gradient_checkpointing: true
      };
    } else {
      // If no options exist, add them
      optimizedParams.options = {
        use_fp16: this.config.reduceQuality,
        batch_size: this.config.batchSize,
        use_gradient_checkpointing: true
      };
    }

    try {
      // Execute with optimized parameters
      const result = await context.operation(optimizedParams);

      this.logger.info("Resource optimization strategy successful", {
        operation: context.operation.name
      });

      return result;
    } catch (error) {
      this.logger.error("Resource optimization strategy failed", {
        operation: context.operation.name,
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }
}

/**
 * Validation recovery strategy for handling validation errors
 */
export class ValidationRecoveryStrategy implements RecoveryStrategy {
  name = 'validation-recovery';
  private config: ValidationRecoveryConfig;
  private logger: Logger;

  constructor(config: ValidationRecoveryConfig) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-error-handler-validation" });
  }

  async execute(context: RecoveryContext): Promise<any> {
    this.logger.info("Applying validation recovery strategy", {
      fallbackToDefaults: this.config.fallbackToDefaults
    });

    if (!this.config.fallbackToDefaults) {
      throw new GAMAServiceError(
        "Validation recovery failed: fallbackToDefaults is disabled",
        "VALIDATION_RECOVERY_ERROR"
      );
    }

    // Determine what type of result to generate based on context
    if (context.operation.name.includes("extractFeatures")) {
      const dimensions = context.expectedDimensions || 512;
      this.logger.info(`Generating fallback feature vector with ${dimensions} dimensions`);

      return new Float32Array(dimensions);
    } else if (context.operation.name.includes("process")) {
      this.logger.info("Generating fallback processed audio result");

      return {
        transcription: "",
        confidence: 0.5,
        segments: [],
        metadata: {
          model: "GAMA",
          duration: context.audioLength ? context.audioLength / 16000 : 0, // Assuming 16kHz sample rate
          wordCount: 0
        }
      };
    } else if (context.operation.name.includes("analyze")) {
      this.logger.info("Generating fallback analysis result");

      const dimensions = context.expectedDimensions || 512;
      return {
        features: [new Float32Array(dimensions)],
        featureCount: 1,
        metadata: {
          type: "gama_features",
          dimensions: [dimensions],
          sampleRate: 16000,
          timeSteps: 1
        }
      };
    } else {
      this.logger.warn("Unknown operation type for validation recovery", {
        operation: context.operation.name
      });

      return {
        status: "recovered",
        message: "Generated fallback result",
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Main error handler for GAMA service
 */
export class GAMAErrorHandler {
  private logger: Logger;
  private recoveryStrategies: Map<string, RecoveryStrategy>;

  constructor(config: ErrorHandlerConfig = {}) {
    this.logger = new Logger({ namespace: "gama-error-handler" });
    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies(config);
  }

  /**
   * Handle errors from GAMA operations
   */
  async handleError(error: Error, context: RecoveryContext): Promise<ErrorHandlingResult> {
    // Log the error
    this.logger.error(`GAMA error: ${error.message}`, {
      operationName: context.operation?.name,
      audioLength: context.audioLength,
      options: context.options,
      expectedDimensions: context.expectedDimensions
    });

    // Determine error type and execute appropriate recovery
    const errorType = this.categorizeError(error);
    const strategy = this.recoveryStrategies.get(errorType);

    if (strategy) {
      try {
        this.logger.info(`Attempting recovery with strategy: ${strategy.name}`, {
          errorType,
          operation: context.operation?.name
        });

        const result = await strategy.execute(context);

        return {
          recoverySuccessful: true,
          result,
          errorType,
          recoveryStrategy: strategy.name
        };
      } catch (recoveryError) {
        this.logger.error(`Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`, {
          originalError: error.message,
          errorType,
          recoveryStrategy: strategy.name
        });

        return this.executeDefaultRecovery(error, context);
      }
    }

    return this.executeDefaultRecovery(error, context);
  }

  /**
   * Categorize errors based on message, type, etc.
   */
  private categorizeError(error: Error): string {
    // Check for specific error types
    if (error instanceof GAMAServiceError) {
      // Use the error code if available
      return error.code.toLowerCase();
    }

    // Check error message for common patterns
    const message = error.message.toLowerCase();

    if (message.includes("timeout") || message.includes("timed out")) {
      return "timeout";
    } else if (message.includes("memory") || message.includes("out of memory") || message.includes("allocation")) {
      return "memory";
    } else if (message.includes("validation") || message.includes("invalid")) {
      return "validation";
    } else if (message.includes("model") || message.includes("checkpoint")) {
      return "model";
    } else if (message.includes("network") || message.includes("connection")) {
      return "network";
    } else if (error instanceof TypeError || error instanceof ReferenceError) {
      return "code";
    } else {
      return "unknown";
    }
  }

  /**
   * Execute default recovery strategy when no specific strategy is available
   */
  private async executeDefaultRecovery(error: Error, context: RecoveryContext): Promise<ErrorHandlingResult> {
    this.logger.warn("Using default recovery strategy", {
      error: error.message,
      operation: context.operation?.name
    });

    // Default strategy is to return the error
    return {
      recoverySuccessful: false,
      error,
      errorType: this.categorizeError(error)
    };
  }

  /**
   * Initialize recovery strategies based on config
   */
  private initializeRecoveryStrategies(config: ErrorHandlerConfig): void {
    // Initialize retry strategy
    this.recoveryStrategies.set("timeout", new RetryStrategy({
      maxRetries: config.maxRetries || 3,
      backoffFactor: config.backoffFactor || 1.5,
      initialDelayMs: config.initialDelayMs || 1000
    }));

    this.recoveryStrategies.set("network", new RetryStrategy({
      maxRetries: config.maxRetries || 3,
      backoffFactor: config.backoffFactor || 2,
      initialDelayMs: config.initialDelayMs || 2000
    }));

    // Initialize resource optimization strategy
    this.recoveryStrategies.set("memory", new ResourceOptimizationStrategy({
      reduceQuality: true,
      batchSize: config.reducedBatchSize || 1
    }));

    // Initialize validation recovery strategy
    this.recoveryStrategies.set("validation", new ValidationRecoveryStrategy({
      fallbackToDefaults: true
    }));

    this.recoveryStrategies.set("model", new RetryStrategy({
      maxRetries: 2,
      backoffFactor: 1,
      initialDelayMs: 500
    }));

    // Add more strategies as needed
  }
}
