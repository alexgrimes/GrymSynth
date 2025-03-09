/// <reference types="jest" />

declare global {
  namespace jest {
    interface AsymmetricMatchers {
      toBeWithinRange(floor: number, ceiling: number): void;
      toHaveValidAudioFormat(): void;
    }

    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidAudioFormat(): R;
    }

    interface Expect {
      toBeWithinRange(floor: number, ceiling: number): any;
      toHaveValidAudioFormat(): any;
    }
  }
}

export {};

declare module "@jest/types" {
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): R;
    toHaveValidAudioFormat(): R;
  }
}

interface AudioBuffer {
  readonly sampleRate: number;
  readonly numberOfChannels: number;
  readonly duration: number;
  readonly length: number;
  getChannelData(channel: number): Float32Array;
}

interface StochasticParameters {
  distribution: 'gaussian' | 'poisson' | 'uniform';
  mean?: number;
  variance?: number;
  lambda?: number;
  min?: number;
  max?: number;
}
