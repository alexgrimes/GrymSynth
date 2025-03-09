/// <reference types="jest" />

declare namespace jest {
  interface Matchers<R> {
    /**
     * Checks if a number is within the specified range (inclusive)
     * @param floor - The minimum allowed value
     * @param ceiling - The maximum allowed value
     */
    toBeWithinRange(floor: number, ceiling: number): R;

    /**
     * Checks if an object has valid audio buffer format
     */
    toHaveValidAudioFormat(): R;
  }
}

// Audio types used in tests
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
