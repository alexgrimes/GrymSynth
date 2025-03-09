import { SimpleAudioBuffer, AudioProcessingOptions } from "./audio";

export enum TaskType {
  AUDIO_PROCESS = "audio.process",
  AUDIO_ANALYZE = "audio.analyze",
  AUDIO_ENHANCE = "audio.enhance",
}

export interface Task {
  id: string;
  type: TaskType;
  timestamp: number;
  priority?: number;
  data: any;
}

export interface AudioTask extends Task {
  data: {
    audio: SimpleAudioBuffer;
    options?: AudioProcessingOptions;
  };
}

export interface TaskResult {
  success: boolean;
  data: any;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface AudioTaskResult extends TaskResult {
  data: {
    audio?: SimpleAudioBuffer;
    transcription?: string;
    analysis?: {
      features?: Float32Array[];
      metadata?: Record<string, unknown>;
    };
  };
}

export interface TaskProcessor<T extends Task = Task> {
  process(task: T): Promise<TaskResult>;
  canProcess(task: T): boolean;
  getPriority(): number;
}

export interface TaskQueue<T extends Task = Task> {
  enqueue(task: T): void;
  dequeue(): T | undefined;
  peek(): T | undefined;
  size(): number;
  isEmpty(): boolean;
  clear(): void;
}
