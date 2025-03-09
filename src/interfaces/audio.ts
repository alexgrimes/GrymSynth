/**
 * Basic audio buffer interface for simple operations
 */
export interface SimpleAudioBuffer {
  /** Raw audio data as float32 array */
  data: Float32Array;

  /** Number of channels in the audio */
  channels: number;

  /** Sample rate in Hz */
  sampleRate: number;

  /** Additional metadata */
  metadata?: {
    format?: string;
    bitDepth?: number;
    duration?: number;
  };
}

/**
 * Extended AudioBuffer interface compatible with Web Audio API
 */
export interface AudioBuffer extends SimpleAudioBuffer {
  /** Buffer length in samples */
  length: number;

  /** Duration in seconds */
  duration: number;

  /** Number of channels */
  numberOfChannels: number;

  /** Copy data from a channel into a Float32Array */
  copyFromChannel(
    destination: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void;

  /** Copy data from a Float32Array into a channel */
  copyToChannel(
    source: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void;

  /** Get channel data as Float32Array */
  getChannelData(channel: number): Float32Array;
}

/**
 * Options for audio processing
 */
export interface AudioProcessingOptions {
  /** Target sample rate */
  sampleRate?: number;

  /** Number of channels to process */
  channels?: number;

  /** Output format */
  format?: "wav" | "mp3" | "ogg";

  /** Quality level (0-1) */
  quality?: number;

  /** Model configuration */
  model?: {
    name: string;
    path?: string;
    settings?: Record<string, unknown>;
  };
}

/**
 * Result of audio processing
 */
export interface AudioProcessingResult {
  /** Transcribed text if applicable */
  transcription?: string;

  /** Confidence score (0-1) */
  confidence?: number;

  /** Processed audio data if modified */
  audio?: SimpleAudioBuffer;

  /** Processing statistics */
  stats?: {
    duration: number;
    inputSize: number;
    outputSize: number;
    peakAmplitude: number;
  };
}

/**
 * Audio feature extraction result
 */
export interface BasicFeatures {
  /** Extracted feature arrays */
  features: Float32Array[];

  /** Number of features */
  featureCount: number;

  /** Feature metadata */
  metadata?: {
    type: string;
    dimensions: number[];
    sampleRate?: number;
    timeSteps?: number;
  };
}

/**
 * Processed audio with transcription
 */
export interface ProcessedAudio {
  /** Transcribed text */
  transcription: string;

  /** Overall confidence score */
  confidence: number;

  /** Optional segment information */
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;

  /** Processing metadata */
  metadata?: {
    model: string;
    duration: number;
    wordCount?: number;
  };
}

/**
 * Configuration for Wav2Vec2 processor
 */
export interface Wav2Vec2Config {
  /** Path to model files */
  modelPath?: string;

  /** Maximum memory allocation */
  maxMemory: string;

  /** Processing device */
  device?: "cpu" | "cuda";

  /** Number of processing threads */
  threads?: number;

  /** Batch size for processing */
  batchSize?: number;
}

/**
 * Interface for audio processor implementation
 */
export interface AudioProcessorMVP {
  /** Process audio data */
  process(audio: SimpleAudioBuffer): Promise<ProcessedAudio>;

  /** Analyze audio features */
  analyze(audio: SimpleAudioBuffer): Promise<BasicFeatures>;
}
