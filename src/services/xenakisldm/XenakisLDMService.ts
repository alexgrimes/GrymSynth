import {
  ServiceConfig,
  AudioLDMServiceConfig,
  ServiceMetrics,
  createServiceMetrics,
  createTaskResult
} from '../types';
import { AudioLDMService } from '../audio/AudioLDMService';
import { AudioBuffer, AudioGenerationResult } from '../../types/audio';
import { BaseServiceError } from '../errors';

export interface XenakisConfig extends ServiceConfig {
  audioLDM: AudioLDMService;
  maxGenerators: number;
  defaultDuration: number;
}

interface StochasticParameters {
  distribution: 'gaussian' | 'uniform';
  mean?: number;
  variance?: number;
  min?: number;
  max?: number;
  mapping: Array<{
    source: string;
    target: string;
    transform?: (value: number) => number;
  }>;
}

interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    return new Error(String(maybeError));
  }
}

export class XenakisLDMService {
  private config: XenakisConfig;
  private isInitialized: boolean = false;
  private metrics: ServiceMetrics;

  private constructor(config: XenakisConfig) {
    this.config = config;
    this.metrics = createServiceMetrics();
  }

  static async initialize(config: XenakisConfig): Promise<XenakisLDMService> {
    const service = new XenakisLDMService(config);
    await service.setup();
    return service;
  }

  private async setup(): Promise<void> {
    if (!this.config.audioLDM) {
      throw new BaseServiceError(
        'AudioLDM service not provided',
        'INITIALIZATION_ERROR'
      );
    }
    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.isInitialized = false;
  }

  private validateStochasticParameters(params: StochasticParameters): void {
    if (params.distribution === 'gaussian') {
      if (params.mean === undefined || params.variance === undefined) {
        throw new BaseServiceError(
          'Gaussian distribution requires mean and variance',
          'VALIDATION_ERROR'
        );
      }
      if (params.mean < 0 || params.mean > 1) {
        throw new BaseServiceError(
          'Mean must be between 0 and 1',
          'VALIDATION_ERROR'
        );
      }
      if (params.variance <= 0) {
        throw new BaseServiceError(
          'Variance must be positive',
          'VALIDATION_ERROR'
        );
      }
    } else if (params.distribution === 'uniform') {
      if (params.min === undefined || params.max === undefined) {
        throw new BaseServiceError(
          'Uniform distribution requires min and max',
          'VALIDATION_ERROR'
        );
      }
      if (params.min >= params.max) {
        throw new BaseServiceError(
          'Min must be less than max',
          'VALIDATION_ERROR'
        );
      }
    }
  }

  private generateStochasticValues(params: StochasticParameters, count: number): number[] {
    const values: number[] = [];

    for (let i = 0; i < count; i++) {
      let value: number;

      if (params.distribution === 'gaussian') {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        value = (params.mean || 0) + z * Math.sqrt(params.variance || 0.1);
      } else {
        value = (params.min || 0) + Math.random() * ((params.max || 1) - (params.min || 0));
      }

      // Apply mapping transform if provided
      if (params.mapping[0]?.transform) {
        value = params.mapping[0].transform(value);
      }

      values.push(value);
    }

    return values;
  }

  async generateAudio(params: {
    prompt: string;
    duration: number;
    mathematical: {
      stochastic?: StochasticParameters;
      [key: string]: any;
    };
    mapping: Array<{
      source: string;
      target: string;
      transform?: (value: number) => number;
    }>;
  }): Promise<AudioGenerationResult> {
    if (!this.isInitialized) {
      throw new BaseServiceError(
        'Service not initialized',
        'SERVICE_ERROR'
      );
    }

    const startTime = Date.now();

    try {
      // Validate parameters
      if (params.mathematical.stochastic) {
        this.validateStochasticParameters(params.mathematical.stochastic);
      }

      // Generate stochastic values if needed
      const stochasticValues = params.mathematical.stochastic
        ? this.generateStochasticValues(
            params.mathematical.stochastic,
            Math.ceil(params.duration * 10) // 10 values per second
          )
        : undefined;

      // Prepare parameters for AudioLDM
      const audioLDMParams = {
        prompt: params.prompt,
        duration: params.duration,
        parameters: {
          ...params.mathematical,
          stochasticValues
        }
      };

      // Generate audio using AudioLDM
      const result = await this.config.audioLDM.generateAudio(audioLDMParams);

      // Update metrics
      this.metrics.requestCount++;
      this.metrics.successCount++;
      this.metrics.averageResponseTime = (
        this.metrics.averageResponseTime * (this.metrics.requestCount - 1) +
        (Date.now() - startTime)
      ) / this.metrics.requestCount;

      return result;

    } catch (caught: unknown) {
      this.metrics.errorCount++;

      const error = toErrorWithMessage(caught);

      throw error instanceof BaseServiceError
        ? error
        : new BaseServiceError(
            error.message || 'Unknown error during audio generation',
            'GENERATION_ERROR'
          );
    }
  }
}
