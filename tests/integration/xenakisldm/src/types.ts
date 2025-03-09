export interface AudioMetrics {
  duration: {
    total: number;
    processing: number;
    overhead: number;
  };
  memory: {
    peak: number;
    average: number;
  };
  cpu: {
    peak: number;
    average: number;
  };
}

export interface AudioServiceConfig {
  model: string;
  maxDuration: number;
  sampleRate: number;
  deviceType?: 'cpu' | 'cuda';
  batchSize?: number;
}

export interface AudioBuffer {
  readonly length: number;
  readonly duration: number;
  readonly sampleRate: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
  copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
  copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
}
