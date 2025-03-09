/**
 * Core audio types for XenakisLDM system
 */

export interface AudioBuffer {
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  length: number;
  getChannelData(channel: number): Float32Array;
}

export interface AudioGenerationResult {
  audioBuffer: AudioBuffer;
  metadata: {
    generationTime: number;
    parameters: any;
    timestamp: number;
  };
}

export interface AudioServiceConfig {
  model: string;
  maxDuration: number;
  sampleRate: number;
}

export interface GenerationParameters {
  prompt: string;
  duration: number;
  [key: string]: any;
}

export interface BasicFeatures {
  spectralDensity: number;
  frequency: {
    min: number;
    max: number;
    mean: number;
  };
  amplitude: {
    rms: number;
    peak: number;
  };
  timbre: {
    brightness: number;
    roughness: number;
  };
}

export interface AudioProcessingConfig {
  windowSize: number;
  hopSize: number;
  sampleRate: number;
}

export class StreamingAudioProcessor {
  private config: AudioProcessingConfig;
  private buffer: Float32Array[];

  constructor(config: AudioProcessingConfig) {
    this.config = config;
    this.buffer = [];
  }

  async processChunk(chunk: Float32Array): Promise<BasicFeatures> {
    // In a real implementation, this would do actual audio processing
    // For testing purposes, we return mock features
    return {
      spectralDensity: 0.5,
      frequency: {
        min: 20,
        max: 20000,
        mean: 1000
      },
      amplitude: {
        rms: 0.7,
        peak: 0.9
      },
      timbre: {
        brightness: 0.6,
        roughness: 0.3
      }
    };
  }

  async analyzeBuffer(buffer: AudioBuffer): Promise<BasicFeatures[]> {
    const features: BasicFeatures[] = [];
    const channelData = buffer.getChannelData(0);
    const hopSize = this.config.hopSize;

    for (let i = 0; i < channelData.length; i += hopSize) {
      const chunk = channelData.slice(i, i + this.config.windowSize);
      const chunkFeatures = await this.processChunk(chunk);
      features.push(chunkFeatures);
    }

    return features;
  }

  reset(): void {
    this.buffer = [];
  }
}

export interface SpectralAnalysis {
  density: {
    mean: number;
    variance: number;
  };
  frequency: {
    min: number;
    max: number;
  };
}
