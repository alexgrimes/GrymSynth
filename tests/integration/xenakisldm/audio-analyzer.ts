import { AudioBuffer } from '../../../src/types/audio';

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

interface FFTResult {
  magnitude: Float32Array;
  frequency: Float32Array;
}

export class AudioAnalyzer {
  private sampleRate: number;
  private fftSize: number;

  constructor(sampleRate = 44100, fftSize = 2048) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
  }

  async analyzeBuffer(buffer: AudioBuffer): Promise<SpectralAnalysis> {
    const channelData = buffer.getChannelData(0); // Analyze first channel
    const spectralDensities: number[] = [];
    const frequencies: number[] = [];

    // Process buffer in chunks
    const hopSize = this.fftSize / 4;
    for (let i = 0; i < channelData.length - this.fftSize; i += hopSize) {
      const chunk = channelData.slice(i, i + this.fftSize);
      const fftResult = this.computeFFT(chunk);

      // Calculate spectral density for this frame
      const density = this.calculateSpectralDensity(fftResult.magnitude);
      spectralDensities.push(density);

      // Track frequency content
      const peakFreq = this.findPeakFrequency(fftResult);
      frequencies.push(peakFreq);
    }

    return {
      density: {
        mean: this.calculateMean(spectralDensities),
        variance: this.calculateVariance(spectralDensities)
      },
      frequency: {
        min: Math.min(...frequencies),
        max: Math.max(...frequencies)
      }
    };
  }

  private computeFFT(timeData: Float32Array): FFTResult {
    // Apply Hanning window
    const windowed = this.applyWindow(timeData);

    // For testing purposes, we'll simulate FFT computation
    // In a real implementation, we would use Web Audio API or a proper FFT library
    const magnitude = new Float32Array(this.fftSize / 2);
    const frequency = new Float32Array(this.fftSize / 2);

    for (let i = 0; i < this.fftSize / 2; i++) {
      // Simulate magnitude spectrum
      magnitude[i] = Math.abs(windowed[i * 2]) + Math.abs(windowed[i * 2 + 1]);
      // Calculate corresponding frequency
      frequency[i] = (i * this.sampleRate) / this.fftSize;
    }

    return { magnitude, frequency };
  }

  private applyWindow(data: Float32Array): Float32Array {
    const windowed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      // Hanning window
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (data.length - 1)));
      windowed[i] = data[i] * window;
    }
    return windowed;
  }

  private calculateSpectralDensity(magnitude: Float32Array): number {
    // Calculate normalized spectral centroid as a measure of density
    let weightedSum = 0;
    let sum = 0;

    for (let i = 0; i < magnitude.length; i++) {
      weightedSum += magnitude[i] * i;
      sum += magnitude[i];
    }

    return sum > 0 ? weightedSum / (sum * magnitude.length) : 0;
  }

  private findPeakFrequency(fft: FFTResult): number {
    let peakIndex = 0;
    let peakMagnitude = 0;

    for (let i = 0; i < fft.magnitude.length; i++) {
      if (fft.magnitude[i] > peakMagnitude) {
        peakMagnitude = fft.magnitude[i];
        peakIndex = i;
      }
    }

    return fft.frequency[peakIndex];
  }

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.calculateMean(squaredDiffs);
  }

  async validateSpectralProperties(
    buffer: AudioBuffer,
    expectedProperties: {
      density?: {
        mean?: number;
        variance?: number;
      };
      frequency?: {
        min?: number;
        max?: number;
      };
    }
  ): Promise<boolean> {
    const analysis = await this.analyzeBuffer(buffer);

    if (expectedProperties.density) {
      if (expectedProperties.density.mean !== undefined) {
        const meanDiff = Math.abs(analysis.density.mean - expectedProperties.density.mean);
        if (meanDiff > 0.15) return false;
      }

      if (expectedProperties.density.variance !== undefined) {
        const varianceDiff = Math.abs(
          analysis.density.variance - expectedProperties.density.variance
        );
        if (varianceDiff > 0.05) return false;
      }
    }

    if (expectedProperties.frequency) {
      if (expectedProperties.frequency.min !== undefined &&
          analysis.frequency.min < expectedProperties.frequency.min - 50) {
        return false;
      }

      if (expectedProperties.frequency.max !== undefined &&
          analysis.frequency.max > expectedProperties.frequency.max + 50) {
        return false;
      }
    }

    return true;
  }
}
