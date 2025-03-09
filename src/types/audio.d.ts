export interface SimpleAudioBuffer {
  data: Float32Array;
  channels: number;
  sampleRate: number;
  metadata?: {
    format?: string;
    bitDepth?: number;
    duration?: number;
  };
}

export interface AudioBuffer extends SimpleAudioBuffer {
  length: number;
  duration: number;
  numberOfChannels: number;
  copyFromChannel(
    destination: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void;
  copyToChannel(
    source: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void;
  getChannelData(channel: number): Float32Array;
}

export interface AudioProcessingOptions {
  sampleRate?: number;
  channels?: number;
  format?: "wav" | "mp3" | "ogg";
  quality?: number;
  model?: {
    name: string;
    path?: string;
    settings?: Record<string, unknown>;
  };
}

export interface AudioProcessingResult {
  transcription?: string;
  confidence?: number;
  audio?: SimpleAudioBuffer;
  stats?: {
    duration: number;
    inputSize: number;
    outputSize: number;
    peakAmplitude: number;
  };
}

export interface BasicFeatures {
  features: Float32Array[];
  featureCount: number;
  metadata?: {
    type: string;
    dimensions: number[];
    sampleRate?: number;
    timeSteps?: number;
  };
}
