import { XenakisLDMService } from './XenakisLDMService';
import { AudioLDMService } from '../audio/AudioLDMService';
import { XenakisConfig } from './types';
import { MemoryManager } from '../../utils/memory';
import { Logger } from '../../utils/logger';

export class XenakisLDMServiceFactory {
  private static instance: XenakisLDMService | null = null;
  private static logger = new Logger({ namespace: 'xenakis-factory' });

  static async createService(
    config: XenakisConfig,
    audioLDM?: AudioLDMService
  ): Promise<XenakisLDMService> {
    if (this.instance) {
      this.logger.warn('XenakisLDM service instance already exists');
      return this.instance;
    }

    try {
      // Validate configuration
      this.validateConfig(config);

      // Create or verify AudioLDM service
      const audioLDMService = audioLDM || await this.createAudioLDMService(config);

      // Create XenakisLDM service
      this.instance = new XenakisLDMService(config, audioLDMService);
      await this.instance.initialize();

      return this.instance;
    } catch (error) {
      this.logger.error('Failed to create XenakisLDM service', { error });
      throw error;
    }
  }

  static async getInstance(): Promise<XenakisLDMService> {
    if (!this.instance) {
      throw new Error('XenakisLDM service has not been initialized');
    }
    return this.instance;
  }

  static async destroyInstance(): Promise<void> {
    if (this.instance) {
      await this.instance.shutdown();
      this.instance = null;
    }
  }

  private static validateConfig(config: XenakisConfig): void {
    const errors: string[] = [];

    if (!config.maxMemory) {
      errors.push('maxMemory is required');
    }

    // Validate memory format (e.g., "4GB", "512MB")
    if (!config.maxMemory.match(/^\d+(?:MB|GB)$/)) {
      errors.push('maxMemory must be in format: <number>MB or <number>GB');
    }

    if (config.parameterPrecision &&
        (config.parameterPrecision < 0 || config.parameterPrecision > 1)) {
      errors.push('parameterPrecision must be between 0 and 1');
    }

    if (config.maxParallelGenerators &&
        (config.maxParallelGenerators < 1 || !Number.isInteger(config.maxParallelGenerators))) {
      errors.push('maxParallelGenerators must be a positive integer');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid configuration: ${errors.join(', ')}`);
    }
  }

  private static parseMemoryString(memoryStr: string): number {
    const match = memoryStr.match(/^(\d+)(MB|GB)$/);
    if (!match) throw new Error('Invalid memory format');

    const value = parseInt(match[1]);
    const unit = match[2];

    return unit === 'GB' ? value * 1024 : value;
  }

  private static async createAudioLDMService(config: XenakisConfig): Promise<AudioLDMService> {
    // Create AudioLDM service with shared memory constraints
    const memoryManager = new MemoryManager({ maxMemory: config.maxMemory });
    const memoryInfo = memoryManager.getMemoryUsage();

    // Convert maxMemory to MB for calculations
    const totalMemoryMB = this.parseMemoryString(config.maxMemory);

    // Calculate available memory (total - used)
    const usedMemoryMB = Math.floor(memoryInfo.used / (1024 * 1024)); // Convert bytes to MB
    const availableMemoryMB = totalMemoryMB - usedMemoryMB;

    // Allocate 75% of available memory to AudioLDM
    const audioLDMMemory = Math.floor(availableMemoryMB * 0.75);

    return new AudioLDMService({
      maxMemory: `${audioLDMMemory}MB`,
      quantization: '8bit', // Use 8-bit quantization for better memory usage
      useHalfPrecision: true, // Enable half precision for better performance
      diffusionSteps: 25 // Default number of steps
    });
  }

  static getDefaultConfig(): XenakisConfig {
    return {
      maxMemory: '4GB',
      useWebAssembly: true,
      parameterPrecision: 0.001,
      cachingEnabled: true,
      maxParallelGenerators: 4
    };
  }
}
