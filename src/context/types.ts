export interface ContextFilter {
  types?: string[];
  minPriority?: number;
  tags?: string[];
  fromTimestamp?: Date;
  toTimestamp?: Date;
  source?: string;
}

export class ContextItemNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContextItemNotFoundError";
  }
}

export interface ContextRepository {
  store(item: ContextItem): Promise<void>;
  retrieve(id: string): Promise<ContextItem>;
  query(filter: ContextFilter): Promise<ContextItem[]>;
  update(id: string, updates: Partial<ContextItem>): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

export type ContextItemType =
  | "audio_parameters"
  | "processing_requirements"
  | "stylistic_preferences"
  | "generation_parameters"
  | "task_history"
  | "prompt";

export interface ContextItem {
  id: string;
  type?: ContextItemType | string;
  content?: any;
  data?: any;
  metadata: ModelContextMetadata;
  timestamp?: Date | number;
  key?: string;
  workflowId?: string;
}

export interface ContextAdapter<T> {
  adaptContext(context: ContextItem[]): T;
}

export interface AudioModelContext {
  audioParameters: {
    sampleRate: number;
    channels: number;
    bitDepth: number;
    format: string;
  };
  processingRequirements: {
    quality: "low" | "medium" | "high";
    latency: "realtime" | "batch";
    priority: number;
  };
  stylistic: {
    genre: string;
    tempo: number;
    effects: string[];
  };
  generationParameters?: AudioGenerationParameters;
}

export interface AudioGenerationParameters {
  prompt: string;
  duration: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  seed?: number;
  batchSize: number;
  guidanceScale: number;
  useHalfPrecision?: boolean;
  diffusionSteps: number;
  sampleRate: number;
  quantization?: {
    enabled: boolean;
    bits: number;
  };
}

export interface ModelContextMetadata {
  timestamp: number | Date;
  source: string;
  priority: number;
  tags: string[];
  ttl?: number;
}

// Re-export types used from services
export { ContextQuery } from "../services/types";
