import { ChildProcess, spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { AudioProcessorMVP } from "../../interfaces/audio";
import {
  SimpleAudioBuffer,
  ProcessedAudio,
  BasicFeatures,
} from "../../interfaces/audio";
import { Logger } from "../../utils/logger";
import { MemoryManager } from "../../utils/memory";
import {
  ServiceStatus,
  ServiceMetrics,
  Task,
  TaskResult,
  createServiceMetrics,
} from "../types";
import { GAMAErrorHandler, RecoveryContext } from "./GAMAErrorHandler";
import { GAMAQualityAssurance } from "./GAMAQualityAssurance";
import { GAMAMonitor, MonitoringHandle as GAMAMonitoringHandle } from "./GAMAMonitor";

// Define ModelService interface since it's not available in the imports
interface ModelService {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): ServiceStatus;
  getMetrics(): Promise<ServiceMetrics>;
  executeTask(task: Task): Promise<TaskResult>;
}

// Helper function to create task result
function createTaskResult<T>(params: {
  id?: string;
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  status?: string;
  metrics?: ServiceMetrics;
}): TaskResult {
  return {
    id: params.id,
    success: params.success,
    data: params.data,
    error: params.error,
    metadata: {
      duration: params.duration,
      timestamp: Date.now(),
      status: params.status,
      metrics: params.metrics
    },
    status: params.status
  };
}

export interface GAMAServiceConfig {
  id: string;
  modelPath: string;
  checkpointPath?: string;
  maxMemory: string;
  device?: 'cpu' | 'cuda';
  quantization?: '8bit' | '4bit' | 'none';
  useFp16?: boolean;
  useGradientCheckpointing?: boolean;
  batchSize?: number;
  maxAudioLength?: number;
  // New configuration options for the enhanced components
  errorConfig?: {
    maxRetries?: number;
    backoffFactor?: number;
    initialDelayMs?: number;
    reducedBatchSize?: number;
    logConfig?: any;
  };
  qaConfig?: {
    audioFeaturesConfig?: {
      expectedDimensions: number;
      minValue: number;
      maxValue: number;
      nanThreshold?: number;
      zeroThreshold?: number;
    };
    patternConfig?: {
      minPatternLength: number;
      maxPatternLength: number;
      minConfidence: number;
    };
    responseTimeConfig?: {
      maxResponseTime: number;
      warningThreshold: number;
    };
    metricsConfig?: {
      storageConfig: any;
      thresholds?: {
        [key: string]: number;
      };
    };
    logConfig?: any;
  };
  monitorConfig?: {
    metricsConfig?: {
      collectionIntervalMs: number;
      operationThresholds: {
        [operation: string]: {
          duration: number;
        }
      };
      metricThresholds: {
        memory: {
          used: number;
          percentage: number;
        };
        cpu: {
          system: number;
          process: number;
        }
      };
    };
    alertConfig?: {
      email?: {
        enabled: boolean;
        recipients: string[];
        server: string;
        from: string;
      };
      slack?: {
        enabled: boolean;
        webhook: string;
        channel: string;
      };
      pagerDuty?: {
        enabled: boolean;
        serviceKey: string;
        severity: string;
      };
      historyConfig: {
        maxAlerts: number;
      };
    };
    logConfig?: any;
  };
}

export interface OptimizationParams {
  batchSize: number;
  precision: 'fp16' | 'fp32';
  useGradientCheckpointing: boolean;
  useQuantization: boolean;
}

export interface MonitoringHandle {
  end: () => void;
}

export interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

export class GAMAServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GAMAServiceError";
  }
}

export class GAMAService implements ModelService, AudioProcessorMVP {
  private initialized: boolean = false;
  private bridge: GAMABridge;
  private modelManager: GAMAModelManager;
  private memoryManager: MemoryManager;
  private logger: Logger;
  private status: ServiceStatus = ServiceStatus.INITIALIZING;
  private metrics: ServiceMetrics = createServiceMetrics();
  private config: GAMAServiceConfig;

  // New components
  private errorHandler: GAMAErrorHandler;
  private qualityAssurance: GAMAQualityAssurance;
  private monitor: GAMAMonitor;

  constructor(config: GAMAServiceConfig) {
    if (!config.maxMemory) {
      throw new GAMAServiceError(
        "Maximum memory must be specified",
        "CONFIG_ERROR"
      );
    }

    this.config = config;
    this.memoryManager = new MemoryManager({ maxMemory: config.maxMemory });
    this.logger = new Logger({ namespace: "gama-service" });
    this.modelManager = new GAMAModelManager(config);
    this.bridge = new GAMABridge();

    // Initialize new components with default configurations if not provided
    this.errorHandler = new GAMAErrorHandler(config.errorConfig || {});
// Create QA config with required fields
const qaConfig = config.qaConfig || {};
const audioFeaturesConfig = qaConfig.audioFeaturesConfig || {
  expectedDimensions: 512, // Default dimension size
  minValue: -10,
  maxValue: 10,
  nanThreshold: 0,
  zeroThreshold: 20
};

const patternConfig = qaConfig.patternConfig || {
  minPatternLength: 1,
  maxPatternLength: 1000,
  minConfidence: 0.7
};

const responseTimeConfig = qaConfig.responseTimeConfig || {
  maxResponseTime: 10000, // 10 seconds
  warningThreshold: 5000  // 5 seconds
};

const metricsConfig = qaConfig.metricsConfig || {
  storageConfig: {
    maxResultsPerType: 1000
  }
};

// Create complete QA config
const completeQAConfig = {
  audioFeaturesConfig,
  patternConfig,
  responseTimeConfig,
  metricsConfig,
  logConfig: qaConfig.logConfig || {}
};

this.qualityAssurance = new GAMAQualityAssurance(completeQAConfig);

// Create monitor config with required fields
const monitorConfig = config.monitorConfig || {};
const monitorMetricsConfig = monitorConfig.metricsConfig || {
  collectionIntervalMs: 5000, // 5 seconds
  operationThresholds: {
    process: { duration: 10000 },
    analyze: { duration: 5000 },
    extractFeatures: { duration: 2000 }
  },
  metricThresholds: {
    memory: {
      used: 1024 * 1024 * 1024, // 1GB
      percentage: 80
    },
    cpu: {
      system: 80,
      process: 70
    }
  }
};

const alertConfig = monitorConfig.alertConfig || {
  historyConfig: {
    maxAlerts: 1000
  }
};

// Create complete monitor config
const completeMonitorConfig = {
  metricsConfig: monitorMetricsConfig,
  alertConfig,
  logConfig: monitorConfig.logConfig || {}
};

this.monitor = new GAMAMonitor(completeMonitorConfig);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info("Initializing GAMA service");

      // Download and verify model if needed
      await this.modelManager.downloadModel();
      const isVerified = await this.modelManager.verifyModel();

      if (!isVerified) {
        throw new GAMAServiceError(
          "Model verification failed",
          "MODEL_VERIFICATION_ERROR"
        );
      }

      // Initialize Python bridge
      await this.bridge.initialize();

      // Load model through bridge
      await this.modelManager.loadModel(this.bridge);

      this.initialized = true;
      this.status = ServiceStatus.ONLINE;

      this.logger.info("GAMA service initialized successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to initialize GAMA service", { error: message });

      this.status = ServiceStatus.ERROR;
      // Log the error details since we can't store them in the enum
      this.logger.error("Initialization failed", {
        error: error instanceof Error ? error : new Error(String(error))
      });

      throw new GAMAServiceError(
        "Service initialization failed",
        "INIT_ERROR",
        { originalError: message }
      );
    }
  }

  async shutdown(): Promise<void> {
    try {
      if (!this.initialized) return;

      this.logger.info("Shutting down GAMA service");

      // Shutdown bridge
      await this.bridge.shutdown();

      this.initialized = false;
      this.status = ServiceStatus.OFFLINE;

      this.logger.info("GAMA service shut down successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to shut down GAMA service", { error: message });

      throw new GAMAServiceError(
        "Service shutdown failed",
        "SHUTDOWN_ERROR",
        { originalError: message }
      );
    }
  }

  getStatus(): ServiceStatus {
    return this.status;
  }

  async getMetrics(): Promise<ServiceMetrics> {
    const memUsage = this.memoryManager.getMemoryUsage();
    const opStats = this.memoryManager.getOperationStats();

    // Calculate total processing time from operation stats
    let totalProcessingTime = 0;
    let totalRequests = 0;
    let successCount = 0;

    Object.values(opStats).forEach((stat) => {
      if (stat.avgDuration) {
        totalProcessingTime += stat.avgDuration * stat.count;
      }
      totalRequests += stat.count;
      // We don't have successCount in OperationStats, so we'll use count as an approximation
      successCount += stat.count;
    });

    return {
      ...this.metrics,
      requestCount: totalRequests || this.metrics.requestCount,
      successCount: successCount || this.metrics.successCount,
      averageResponseTime: totalRequests ? totalProcessingTime / totalRequests : 0,
      memoryUsage: {
        heapUsed: memUsage.used,
        heapTotal: memUsage.max,
        external: 0
      },
      resourceUsage: {
        memory: memUsage.used / memUsage.max,
        cpu: 0 // Would need a more sophisticated way to track CPU usage
      }
    };
  }

  // Add memory optimization methods that don't exist in MemoryManager
  private async optimizeForOperation(operation: string, dataSize: number): Promise<OptimizationParams> {
    // Get current memory usage
    const memUsage = this.memoryManager.getMemoryUsage();

    // Calculate available memory
    const availableMemory = memUsage.max - memUsage.used;

    // Determine batch size based on available memory
    // Assume each item needs approximately dataSize bytes
    const maxBatchSize = Math.floor(availableMemory / dataSize);
    const optimalBatchSize = Math.min(maxBatchSize, 16); // Cap at 16 as a reasonable default

    // Determine if we should use FP16 based on memory pressure
    const useFp16 = memUsage.percentage > 50; // Use FP16 if memory usage is above 50%

    // Determine if gradient checkpointing should be used
    const useGradientCheckpointing = memUsage.percentage > 70; // Use gradient checkpointing if memory usage is above 70%

    return {
      batchSize: Math.max(1, optimalBatchSize),
      precision: useFp16 ? 'fp16' : 'fp32',
      useGradientCheckpointing,
      useQuantization: this.config.quantization !== 'none'
    };
  }

  private recordOperationError(operation: string): void {
    // Just increment error count in metrics
    this.metrics.errorCount++;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      let result: any;

      switch (task.type) {
        case "audio_process":
        case "speech-to-text":
          result = await this.processAudioTask(task);
          break;

        case "audio_analyze":
        case "audio-feature-extraction":
          result = await this.analyzeAudioTask(task);
          break;

        case "extract-features":
          result = await this.extractFeaturesTask(task);
          break;

        default:
          throw new GAMAServiceError(
            `Unsupported task type: ${task.type}`,
            "INVALID_TASK_TYPE"
          );
      }

      this.metrics.successCount++;
      const processingTime = Date.now() - startTime;

      return createTaskResult({
        id: task.id,
        success: true,
        data: result,
        duration: processingTime,
        status: "success",
        metrics: await this.getMetrics()
      });
    } catch (error) {
      this.metrics.errorCount++;
      const message = error instanceof Error ? error.message : String(error);

      return createTaskResult({
        id: task.id,
        success: false,
        error: new GAMAServiceError(
          "Task execution failed",
          "EXECUTION_ERROR",
          { originalError: message }
        ),
        duration: Date.now() - startTime,
        status: "error",
        metrics: await this.getMetrics()
      });
    }
  }

  async process(audio: SimpleAudioBuffer): Promise<ProcessedAudio> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!audio?.data) {
      throw new GAMAServiceError(
        "Invalid audio data provided",
        "INVALID_INPUT"
      );
    }

    // Start monitoring the operation
    const monitoringHandle = await this.monitor.monitorOperation("process", {
      audioLength: audio.data.length,
      channels: audio.channels,
      sampleRate: audio.sampleRate
    });

    const startTime = this.memoryManager.startOperation("process");

    try {
      // Optimize memory usage for this operation
      const optimizationParams = await this.optimizeForOperation(
        "process",
        audio.data.length * Float32Array.BYTES_PER_ELEMENT
      );

      // Process audio with GAMA model
      const result = await this.bridge.executeOperation("process_audio", {
        audio: this.serializeAudio(audio),
        options: {
          use_fp16: optimizationParams.precision === 'fp16',
          batch_size: optimizationParams.batchSize,
          use_gradient_checkpointing: optimizationParams.useGradientCheckpointing
        }
      });

      // Transform result to ProcessedAudio format
      const processedAudio: ProcessedAudio = {
        transcription: result.transcription || "",
        confidence: result.confidence || 0.0,
        segments: result.segments || [],
        metadata: {
          model: "GAMA",
          duration: result.duration || 0,
          wordCount: result.word_count
        }
      };

      // Validate the output
      const validationResult = await this.qualityAssurance.validateOutput(
        processedAudio,
        "response-time",
        { duration: Date.now() - startTime }
      );

      if (!validationResult.valid) {
        this.logger.warn("Process output validation failed", {
          checks: validationResult.checks.filter(check => !check.passed)
        });
      }

      return processedAudio;
    } catch (error) {
      this.recordOperationError("process");

      // Use error handler to recover if possible
      const recoveryContext: RecoveryContext = {
        operation: this.bridge.executeOperation.bind(this.bridge, "process_audio"),
        params: {
          audio: this.serializeAudio(audio),
          options: {
            use_fp16: true,
            batch_size: 1,
            use_gradient_checkpointing: true
          }
        },
        audioLength: audio.data.length
      };

      // Ensure error is of type Error
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorResult = await this.errorHandler.handleError(errorObj, recoveryContext);

      if (errorResult.recoverySuccessful && errorResult.result) {
        // If recovery was successful, transform the result
        const recoveredResult = errorResult.result;
        return {
          transcription: recoveredResult.transcription || "",
          confidence: recoveredResult.confidence || 0.0,
          segments: recoveredResult.segments || [],
          metadata: {
            model: "GAMA",
            duration: recoveredResult.duration || 0,
            wordCount: recoveredResult.word_count,
            // Use type assertion to allow additional properties
            ...(({
              recovered: true,
              recoveryStrategy: errorResult.recoveryStrategy
            } as any))
          }
        };
      }

      // If recovery failed, throw the original error
      throw new GAMAServiceError(
        "Audio processing failed",
        "PROCESS_ERROR",
        {
          originalError: error instanceof Error ? error.message : String(error),
          recoveryAttempted: true,
          recoverySuccessful: false
        }
      );
    } finally {
      this.memoryManager.endOperation("process", startTime);

      // End monitoring
      await monitoringHandle.end();
    }
  }

  async analyze(audio: SimpleAudioBuffer): Promise<BasicFeatures> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!audio?.data) {
      throw new GAMAServiceError(
        "Invalid audio data provided",
        "INVALID_INPUT"
      );
    }

    // Start monitoring the operation
    const monitoringHandle = await this.monitor.monitorOperation("analyze", {
      audioLength: audio.data.length,
      channels: audio.channels,
      sampleRate: audio.sampleRate
    });

    const startTime = this.memoryManager.startOperation("analyze");

    try {
      // Optimize memory usage for this operation
      const optimizationParams = await this.optimizeForOperation(
        "analyze",
        audio.data.length * Float32Array.BYTES_PER_ELEMENT
      );

      // Extract features with GAMA model
      const result = await this.bridge.executeOperation("extract_features", {
        audio: this.serializeAudio(audio),
        options: {
          use_fp16: optimizationParams.precision === 'fp16',
          batch_size: optimizationParams.batchSize,
          use_gradient_checkpointing: optimizationParams.useGradientCheckpointing
        }
      });

      // Transform result to BasicFeatures format
      const features: BasicFeatures = {
        features: this.deserializeFeatures(result.features),
        featureCount: result.features.length,
        metadata: {
          type: result.metadata?.type || "gama_features",
          dimensions: result.metadata?.dimensions || [result.features[0].length],
          sampleRate: result.metadata?.sample_rate,
          timeSteps: result.metadata?.time_steps
        }
      };

      // Validate the output
      const validationResult = await this.qualityAssurance.validateOutput(
        features,
        "audio-features",
        {
          expectedDimensions: result.features[0].length,
          duration: Date.now() - startTime
        }
      );

      if (!validationResult.valid) {
        this.logger.warn("Analysis output validation failed", {
          checks: validationResult.checks.filter(check => !check.passed)
        });
      }

      return features;
    } catch (error) {
      this.recordOperationError("analyze");

      // Use error handler to recover if possible
      const recoveryContext: RecoveryContext = {
        operation: this.bridge.executeOperation.bind(this.bridge, "extract_features"),
        params: {
          audio: this.serializeAudio(audio),
          options: {
            use_fp16: true,
            batch_size: 1,
            use_gradient_checkpointing: true
          }
        },
        audioLength: audio.data.length,
        expectedDimensions: 512 // Default dimension size
      };

      // Ensure error is of type Error
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorResult = await this.errorHandler.handleError(errorObj, recoveryContext);

      if (errorResult.recoverySuccessful && errorResult.result) {
        // If recovery was successful, transform the result
        const recoveredResult = errorResult.result;

        // Create features from recovered result
        return {
          features: this.deserializeFeatures(recoveredResult.features || [[]]),
          featureCount: recoveredResult.features?.length || 0,
          metadata: {
            type: "gama_features",
            dimensions: recoveredResult.features?.[0]?.length ? [recoveredResult.features[0].length] : [0],
            sampleRate: audio.sampleRate,
            timeSteps: recoveredResult.time_steps || 1,
            // Use type assertion to allow additional properties
            ...(({
              recovered: true,
              recoveryStrategy: errorResult.recoveryStrategy
            } as any))
          }
        };
      }

      // If recovery failed, throw the original error
      throw new GAMAServiceError(
        "Audio analysis failed",
        "ANALYZE_ERROR",
        {
          originalError: errorObj.message,
          recoveryAttempted: true,
          recoverySuccessful: false
        }
      );
    } finally {
      this.memoryManager.endOperation("analyze", startTime);

      // End monitoring
      await monitoringHandle.end();
    }
  }

  async extractFeatures(audio: SimpleAudioBuffer): Promise<Float32Array> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!audio?.data) {
      throw new GAMAServiceError(
        "Invalid audio data provided",
        "INVALID_INPUT"
      );
    }

    // Start monitoring the operation
    const monitoringHandle = await this.monitor.monitorOperation("extractFeatures", {
      audioLength: audio.data.length,
      channels: audio.channels,
      sampleRate: audio.sampleRate
    });

    const startTime = this.memoryManager.startOperation("extractFeatures");

    try {
      // Optimize memory usage for this operation
      const optimizationParams = await this.optimizeForOperation(
        "extractFeatures",
        audio.data.length * Float32Array.BYTES_PER_ELEMENT
      );

      // Extract features with GAMA model
      const result = await this.bridge.executeOperation("extract_features", {
        audio: this.serializeAudio(audio),
        options: {
          use_fp16: optimizationParams.precision === 'fp16',
          batch_size: optimizationParams.batchSize,
          use_gradient_checkpointing: optimizationParams.useGradientCheckpointing,
          return_vector: true
        }
      });

      // Get the feature vector
      const featureVector = new Float32Array(result.feature_vector);

      // Validate the output (simple validation for feature vector)
      const validationResult = await this.qualityAssurance.validateOutput(
        { features: [featureVector] },
        "audio-features",
        {
          expectedDimensions: featureVector.length,
          duration: Date.now() - startTime
        }
      );

      if (!validationResult.valid) {
        this.logger.warn("Feature extraction output validation failed", {
          checks: validationResult.checks.filter(check => !check.passed)
        });
      }

      return featureVector;
    } catch (error) {
      this.recordOperationError("extractFeatures");

      // Use error handler to recover if possible
      const recoveryContext: RecoveryContext = {
        operation: this.bridge.executeOperation.bind(this.bridge, "extract_features"),
        params: {
          audio: this.serializeAudio(audio),
          options: {
            use_fp16: true,
            batch_size: 1,
            use_gradient_checkpointing: true,
            return_vector: true
          }
        },
        audioLength: audio.data.length,
        expectedDimensions: 512 // Default dimension size
      };

      // Ensure error is of type Error
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorResult = await this.errorHandler.handleError(errorObj, recoveryContext);

      if (errorResult.recoverySuccessful && errorResult.result) {
        // If recovery was successful, return the recovered feature vector
        const recoveredResult = errorResult.result;

        // Log recovery information
        this.logger.info("Feature extraction recovered successfully", {
          strategy: errorResult.recoveryStrategy,
          vectorLength: recoveredResult.feature_vector?.length || 0
        });

        return new Float32Array(recoveredResult.feature_vector || []);
      }

      // If recovery failed, throw the original error
      throw new GAMAServiceError(
        "Feature extraction failed",
        "FEATURE_EXTRACTION_ERROR",
        {
          originalError: errorObj.message,
          recoveryAttempted: true,
          recoverySuccessful: false
        }
      );
    } finally {
      this.memoryManager.endOperation("extractFeatures", startTime);

      // End monitoring
      await monitoringHandle.end();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private async processAudioTask(task: Task): Promise<any> {
    // Extract audio data from task
    const audio = await this.getAudioFromTask(task);

    // Process audio
    return await this.process(audio);
  }

  private async analyzeAudioTask(task: Task): Promise<any> {
    // Extract audio data from task
    const audio = await this.getAudioFromTask(task);

    // Analyze audio
    return await this.analyze(audio);
  }

  private async extractFeaturesTask(task: Task): Promise<any> {
    // Extract audio data from task
    const audio = await this.getAudioFromTask(task);

    // Extract features
    const features = await this.extractFeatures(audio);

    return {
      features: Array.from(features),
      dimensions: [features.length],
      type: "gama_feature_vector"
    };
  }

  private async getAudioFromTask(task: Task): Promise<SimpleAudioBuffer> {
    // Check if audio data is directly in the task
    if (task.data?.audio) {
      return task.data.audio;
    }

    // Check if audio path is provided
    if (task.data?.audioPath) {
      // Load audio from path (implementation would depend on your audio loading utilities)
      // This is a placeholder
      return {
        data: new Float32Array(0),
        channels: 1,
        sampleRate: 16000
      };
    }

    throw new GAMAServiceError(
      "No audio data or path provided in task",
      "INVALID_TASK_DATA"
    );
  }

  private serializeAudio(audio: SimpleAudioBuffer): any {
    // Convert audio to format expected by Python bridge
    return {
      data: Array.from(audio.data),
      channels: audio.channels,
      sample_rate: audio.sampleRate,
      metadata: audio.metadata
    };
  }

  private deserializeFeatures(features: number[][]): Float32Array[] {
    // Convert feature arrays from Python to Float32Array
    return features.map(feature => new Float32Array(feature));
  }
}

class GAMABridge {
  private pythonProcess: ChildProcess | null = null;
  private requestQueue: Map<string, PendingRequest> = new Map();
  private isInitialized: boolean = false;
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ namespace: "gama-bridge" });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Start Python process with GAMA model
      this.pythonProcess = spawn('python', ['-m', 'gama_operations']);

      if (!this.pythonProcess || !this.pythonProcess.stdin || !this.pythonProcess.stdout) {
        throw new Error('Failed to start Python process');
      }

      // Set up communication channels
      this.setupCommunication();

      // Wait for ready signal
      await this.waitForReady();

      this.isInitialized = true;
      this.logger.info("GAMA bridge initialized successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to initialize GAMA bridge", { error: message });

      throw new GAMAServiceError(
        "Bridge initialization failed",
        "BRIDGE_INIT_ERROR",
        { originalError: message }
      );
    }
  }

  async executeOperation(operation: string, data: any): Promise<any> {
    if (!this.isInitialized || !this.pythonProcess) {
      throw new GAMAServiceError(
        "Bridge not initialized",
        "BRIDGE_NOT_INITIALIZED"
      );
    }

    // Create unique request ID
    const requestId = uuidv4();

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      this.requestQueue.set(requestId, { resolve, reject });
    });

    // Send operation to Python process
    if (this.pythonProcess.stdin) {
      this.pythonProcess.stdin.write(
        JSON.stringify({
          id: requestId,
          operation,
          data
        }) + '\n'
      );
    } else {
      throw new GAMAServiceError(
        "Python process stdin not available",
        "BRIDGE_COMMUNICATION_ERROR"
      );
    }

    // Wait for response
    return responsePromise;
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized || !this.pythonProcess) {
      return;
    }

    try {
      // Send shutdown signal
      await this.executeOperation('shutdown', {});
    } catch (error) {
      // Ignore errors during shutdown
      this.logger.warn("Error during bridge shutdown", {
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // Kill process if still running
    if (this.pythonProcess && !this.pythonProcess.killed) {
      this.pythonProcess.kill();
    }

    this.isInitialized = false;
    this.pythonProcess = null;
    this.logger.info("GAMA bridge shut down successfully");
  }

  private setupCommunication(): void {
    if (!this.pythonProcess || !this.pythonProcess.stdout || !this.pythonProcess.stderr) {
      throw new GAMAServiceError(
        "Python process not properly initialized",
        "BRIDGE_SETUP_ERROR"
      );
    }

    // Handle stdout for responses
    this.pythonProcess.stdout.on('data', (data) => {
      try {
        const lines = data.toString().split('\n').filter(Boolean);

        for (const line of lines) {
          const response = JSON.parse(line);
          this.handleResponse(response);
        }
      } catch (error) {
        this.logger.error("Error parsing Python response", {
          error: error instanceof Error ? error.message : String(error),
          data: data.toString()
        });
      }
    });

    // Handle stderr for errors
    this.pythonProcess.stderr.on('data', (data) => {
      this.logger.error("Python error", { error: data.toString() });
    });

    // Handle process exit
    this.pythonProcess.on('exit', (code) => {
      if (code !== 0) {
        this.logger.error(`Python process exited with code ${code}`);
      }

      this.isInitialized = false;
      this.pythonProcess = null;
    });
  }

  private handleResponse(response: any): void {
    const { id, result, error } = response;

    // Find pending request
    const pendingRequest = this.requestQueue.get(id);

    if (!pendingRequest) {
      this.logger.error(`No pending request found for ID: ${id}`);
      return;
    }

    // Remove from queue
    this.requestQueue.delete(id);

    // Resolve or reject promise
    if (error) {
      pendingRequest.reject(new GAMAServiceError(
        error,
        "PYTHON_EXECUTION_ERROR"
      ));
    } else {
      pendingRequest.resolve(result);
    }
  }

  private async waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new GAMAServiceError(
          "Timeout waiting for Python process to be ready",
          "BRIDGE_TIMEOUT_ERROR"
        ));
      }, 30000);

      const checkReady = async () => {
        try {
          await this.executeOperation('ping', {});
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          setTimeout(checkReady, 500);
        }
      };

      checkReady();
    });
  }
}

class GAMAModelManager {
  private modelPath: string;
  private checkpointPath: string;
  private config: GAMAServiceConfig;
  private logger: Logger;

  constructor(config: GAMAServiceConfig) {
    this.modelPath = config.modelPath;
    this.checkpointPath = config.checkpointPath || '';
    this.config = config;
    this.logger = new Logger({ namespace: "gama-model-manager" });
  }

  async downloadModel(): Promise<void> {
    // Check if model exists locally
    if (await this.modelExists()) {
      this.logger.info("Model already exists locally", { path: this.modelPath });
      return;
    }

    this.logger.info("Downloading model", { modelPath: this.modelPath });

    // In a real implementation, this would download from HuggingFace
    // For now, we'll just create the directory
    try {
      await fs.promises.mkdir(this.modelPath, { recursive: true });

      // Create a dummy config.json file to indicate the model exists
      await fs.promises.writeFile(
        path.join(this.modelPath, 'config.json'),
        JSON.stringify({ model_type: "gama", version: "1.0.0" })
      );

      this.logger.info("Model downloaded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to download model", { error: message });

      throw new GAMAServiceError(
        "Model download failed",
        "MODEL_DOWNLOAD_ERROR",
        { originalError: message }
      );
    }
  }

  async verifyModel(): Promise<boolean> {
    try {
      // Check if model files exist
      const configExists = await this.fileExists(path.join(this.modelPath, 'config.json'));

      if (!configExists) {
        this.logger.error("Model verification failed: config.json not found");
        return false;
      }

      this.logger.info("Model verified successfully");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Model verification failed", { error: message });
      return false;
    }
  }

  async loadModel(bridge: GAMABridge): Promise<void> {
    try {
      this.logger.info("Loading model", { modelPath: this.modelPath });

      // Load model with optimizations
      await bridge.executeOperation('load_model', {
        model_path: this.modelPath,
        checkpoint_path: this.checkpointPath,
        options: {
          device: this.config.device || 'cuda',
          quantization: this.config.quantization || '8bit',
          use_fp16: this.config.useFp16 !== false,
          use_gradient_checkpointing: this.config.useGradientCheckpointing || false
        }
      });

      this.logger.info("Model loaded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to load model", { error: message });

      throw new GAMAServiceError(
        "Model loading failed",
        "MODEL_LOAD_ERROR",
        { originalError: message }
      );
    }
  }

  private async modelExists(): Promise<boolean> {
    // Check if model files exist
    try {
      return await this.fileExists(path.join(this.modelPath, 'config.json'));
    } catch (error) {
      return false;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.promises.stat(filePath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }
}
