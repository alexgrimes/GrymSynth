import { AudioLDMService } from './AudioLDMService';
import {
  ModelService,
  ServiceStatus,
  ServiceMetrics,
  Task,
  TaskResult,
  createServiceMetrics,
  createTaskResult
} from '../types';
import { Logger } from '../../utils/logger';

/**
 * Adapter to make AudioLDMService compatible with the ModelService interface
 */
export class AudioLDMAdapter implements ModelService {
  private service: AudioLDMService;
  private logger: Logger;
  private metrics: ServiceMetrics;

  constructor(service: AudioLDMService) {
    this.service = service;
    this.logger = new Logger({ namespace: 'audioldm-adapter' });
    this.metrics = createServiceMetrics();
  }

  async initialize(): Promise<void> {
    // AudioLDMService is already initialized when created
    this.logger.info('AudioLDMAdapter initialized');
  }

  async shutdown(): Promise<void> {
    await this.service.cleanup();
    this.logger.info('AudioLDMAdapter shut down');
  }

  getStatus(): ServiceStatus {
    return this.service.isReady() ? ServiceStatus.ONLINE : ServiceStatus.ERROR;
  }

  getMetrics(): ServiceMetrics {
    return this.metrics;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      if (task.type !== 'audio-generation' && task.type !== 'text-to-audio') {
        throw new Error(`Unsupported task type: ${task.type}`);
      }

      // Extract parameters from task
      const params = task.data?.params || {
        prompt: task.data?.prompt || 'ambient sound',
        duration: task.data?.duration || 3
      };

      // Generate audio
      const result = await this.service.generateAudio(params);

      this.metrics.successCount++;
      const processingTime = Date.now() - startTime;

      if (this.metrics.processingTime === undefined) {
        this.metrics.processingTime = processingTime;
      } else {
        this.metrics.processingTime += processingTime;
      }

      this.metrics.lastProcessedAt = Date.now();

      return createTaskResult(
        true,
        result,
        undefined,
        {
          duration: processingTime,
          metrics: this.metrics,
          status: 'success'
        },
        task.id,
        'success'
      );
    } catch (error) {
      this.metrics.errorCount++;

      return createTaskResult(
        false,
        undefined,
        error instanceof Error ? error : new Error(String(error)),
        {
          duration: Date.now() - startTime,
          metrics: this.metrics,
          status: 'error'
        },
        task.id,
        'error'
      );
    }
  }

  isInitialized(): boolean {
    return this.service.isReady();
  }
}
