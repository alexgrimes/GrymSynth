import { AudioBuffer } from "./audio";

export interface ModelConfig {
  name: string;
  version: string;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface FeatureExtractionConfig {
  windowSize: number;
  hopSize: number;
  sampleRate: number;
  normalize: boolean;
  parameters?: Record<string, any>;
}

export interface ModelMetrics {
  processingTime: number;
  memoryUsage: number;
  batchSize?: number;
  inputShape?: number[];
  outputShape?: number[];
  custom?: Record<string, any>;
}

export interface ModelCapabilities {
  supportedSampleRates: number[];
  maxInputLength: number;
  minInputLength: number;
  supportedChannels: number[];
  features: string[];
  realTime: boolean;
}

export interface ModelPrediction {
  features: Float32Array;
  confidence: number;
  timing: {
    preprocessingTime: number;
    inferenceTime: number;
    postprocessingTime: number;
  };
  metadata?: Record<string, any>;
}

export interface ModelProvider {
  initialize(config?: ModelConfig): Promise<void>;
  loadModel(config: ModelConfig): Promise<void>;
  unloadModel(): Promise<void>;
  predict(input: AudioBuffer): Promise<ModelPrediction>;
  getMetrics(): ModelMetrics;
  getCapabilities(): ModelCapabilities;
  dispose(): Promise<void>;
}

export interface StreamingConfig {
  chunkSize: number;
  overlap: number;
  maxQueueSize: number;
  batchSize: number;
  preprocessingSteps?: Array<(chunk: Float32Array) => Float32Array>;
  postprocessingSteps?: Array<(features: Float32Array) => Float32Array>;
}

export interface StreamingModelProvider extends ModelProvider {
  startStreaming(config: StreamingConfig): Promise<void>;
  processChunk(chunk: Float32Array): Promise<ModelPrediction>;
  stopStreaming(): Promise<void>;
  flush(): Promise<ModelPrediction[]>;
}

export interface ModelRegistry {
  registerModel(name: string, provider: ModelProvider): void;
  unregisterModel(name: string): void;
  getModel(name: string): ModelProvider | undefined;
  listModels(): string[];
}

export interface ModelFactory {
  createModel(config: ModelConfig): Promise<ModelProvider>;
  createStreamingModel(config: ModelConfig): Promise<StreamingModelProvider>;
  dispose(): Promise<void>;
}
