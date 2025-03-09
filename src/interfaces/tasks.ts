import {
  SimpleAudioBuffer,
  AudioProcessingOptions as BaseAudioOptions,
} from "./audio";

/**
 * Task types for audio processing system
 */
export enum TaskType {
  AUDIO_PROCESS = "audio.process",
  AUDIO_ANALYZE = "audio.analyze",
  AUDIO_ENHANCE = "audio.enhance",
}

/**
 * Base task interface
 */
export interface Task {
  id: string;
  type: TaskType;
  timestamp: number;
  priority?: number;
  data: any;
}

/**
 * Audio specific task interface
 */
export interface AudioTask extends Task {
  data: {
    audio: SimpleAudioBuffer;
    options?: BaseAudioOptions;
  };
}

/**
 * Task processing result
 */
export interface TaskResult {
  success: boolean;
  data: any;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audio task result
 */
export interface AudioTaskResult extends TaskResult {
  data: {
    /** Processed audio if modified */
    audio?: SimpleAudioBuffer;

    /** Transcription if requested */
    transcription?: string;

    /** Analysis results if requested */
    analysis?: {
      features?: Float32Array[];
      metadata?: Record<string, unknown>;
    };
  };
}
