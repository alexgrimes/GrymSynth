import {
  GeneratorConfig,
  ParameterStream,
  VisualizationData,
  ValidationResult,
  MappingConstraints,
  AudioGenerationParameters
} from '../types';

/**
 * Base class for all mathematical generators in the XenakisLDM system.
 * Provides common functionality and enforces consistent interface across generators.
 */
export abstract class MathematicalGenerator<T extends GeneratorConfig> {
  protected config: T;
  protected sampleRate: number;
  protected duration: number;

  constructor(config: T) {
    this.config = config;
    this.sampleRate = config.sampleRate;
    this.duration = config.duration;
  }

  /**
   * Generate a stream of parameters based on the mathematical model
   * @param startTime - The start time in seconds
   * @returns A stream of generated parameters
   */
  abstract generate(startTime?: number): Promise<ParameterStream>;

  /**
   * Create a visualization of the generator's current state or output
   * @param width - Width of the visualization in pixels
   * @param height - Height of the visualization in pixels
   * @returns Visualization data structure
   */
  abstract visualize(width: number, height: number): Promise<VisualizationData>;

  /**
   * Validate the generator's configuration
   * @returns Validation result with any errors or warnings
   */
  abstract validate(): ValidationResult;

  /**
   * Map the generated parameters to AudioLDM parameters
   * @param params - The generated parameter stream
   * @param constraints - Optional constraints for the mapping
   * @returns AudioLDM generation parameters
   */
  abstract mapToAudioParameters(
    params: ParameterStream,
    constraints?: MappingConstraints
  ): Promise<AudioGenerationParameters>;

  /**
   * Update the generator's configuration
   * @param config - New configuration parameters
   */
  updateConfig(config: Partial<T>): void {
    this.config = { ...this.config, ...config };
    if (config.sampleRate) {
      this.sampleRate = config.sampleRate;
    }
    if (config.duration) {
      this.duration = config.duration;
    }
  }

  /**
   * Get the current configuration
   * @returns The current configuration
   */
  getConfig(): T {
    return { ...this.config };
  }

  /**
   * Calculate the number of samples needed based on duration and sample rate
   * @param duration - Optional duration override
   * @returns Number of samples
   */
  protected calculateSampleCount(duration?: number): number {
    return Math.ceil((duration || this.duration) * this.sampleRate);
  }

  /**
   * Convert a time in seconds to sample index
   * @param time - Time in seconds
   * @returns Sample index
   */
  protected timeToSample(time: number): number {
    return Math.floor(time * this.sampleRate);
  }

  /**
   * Convert a sample index to time in seconds
   * @param sample - Sample index
   * @returns Time in seconds
   */
  protected sampleToTime(sample: number): number {
    return sample / this.sampleRate;
  }

  /**
   * Validate common generator parameters
   * @returns Validation result for common parameters
   */
  protected validateCommon(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (this.duration <= 0) {
      errors.push('Duration must be positive');
    }
    if (this.sampleRate <= 0) {
      errors.push('Sample rate must be positive');
    }
    if (this.duration > 300) { // 5 minutes max
      warnings.push('Duration exceeds recommended maximum of 300 seconds');
    }
    if (this.sampleRate < 8000) {
      warnings.push('Sample rate below recommended minimum of 8000 Hz');
    }
    if (this.sampleRate > 48000) {
      warnings.push('Sample rate above recommended maximum of 48000 Hz');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Normalize a value to a specified range
   * @param value - Value to normalize
   * @param min - Minimum of target range
   * @param max - Maximum of target range
   * @returns Normalized value
   */
  protected normalize(value: number, min: number, max: number): number {
    return min + (max - min) * value;
  }

  /**
   * Get metadata about the generator
   * @returns Generator metadata
   */
  getMetadata(): Record<string, any> {
    return {
      type: this.config.type,
      sampleRate: this.sampleRate,
      duration: this.duration,
      sampleCount: this.calculateSampleCount()
    };
  }

  /**
   * Clean up any resources used by the generator
   */
  dispose(): void {
    // Base implementation does nothing
    // Override in derived classes if cleanup is needed
  }
}
