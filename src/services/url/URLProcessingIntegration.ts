import { ServiceConfig, ServiceStatus, TaskResult } from '../types';
import { Logger } from '../../utils/logger';
import { URLProcessor, URLProcessingResult } from './URLProcessor';
import { ServiceRegistry } from '../service-registry';

export interface URLProcessingIntegrationConfig extends ServiceConfig {
  audioProcessingServiceId?: string;
  visualizationServiceId?: string;
  maxConcurrentProcessing?: number;
}

/**
 * Integration service that connects the URL processing system with other services
 * in the Audio-Learning-Hub.
 */
export class URLProcessingIntegration {
  private config: URLProcessingIntegrationConfig;
  private logger: Logger;
  private urlProcessor: URLProcessor;
  private serviceRegistry: ServiceRegistry;
  private processingQueue: string[] = [];
  private isProcessing: boolean = false;
  private status: ServiceStatus = {
    state: 'initializing',
    timestamp: Date.now()
  };

  constructor(config: URLProcessingIntegrationConfig, serviceRegistry: ServiceRegistry) {
    this.config = {
      ...config,
      audioProcessingServiceId: config.audioProcessingServiceId || 'audio-processing-service',
      visualizationServiceId: config.visualizationServiceId || 'visualization-service',
      maxConcurrentProcessing: config.maxConcurrentProcessing || 3
    };

    this.logger = new Logger({ namespace: 'url-processing-integration' });
    this.serviceRegistry = serviceRegistry;

    // Initialize URL processor
    this.urlProcessor = new URLProcessor({
      id: `${config.id}-url-processor`,
      maxRetries: 3,
      retryDelay: 1000,
      timeoutMs: 30000,
      securityCheckEnabled: true
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing URL processing integration service');

      // Initialize URL processor
      await this.urlProcessor.initialize();

      // Register with service registry
      this.serviceRegistry.registerService(this.config.id, this);

      this.status = {
        state: 'ready',
        timestamp: Date.now()
      };

      this.logger.info('URL processing integration service initialized successfully');
    } catch (error) {
      this.status = {
        state: 'error',
        message: 'Failed to initialize URL processing integration service',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now()
      };

      this.logger.error('Failed to initialize URL processing integration service', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down URL processing integration service');

      // Shutdown URL processor
      await this.urlProcessor.shutdown();

      this.status = {
        state: 'shutdown',
        timestamp: Date.now()
      };

      this.logger.info('URL processing integration service shut down successfully');
    } catch (error) {
      this.logger.error('Error shutting down URL processing integration service', { error });
      throw error;
    }
  }

  getStatus(): ServiceStatus {
    return this.status;
  }

  isInitialized(): boolean {
    return this.status.state === 'ready';
  }

  /**
   * Processes a URL and integrates the result with the audio processing pipeline
   */
  async processURLAndIntegrate(url: string): Promise<TaskResult<URLProcessingResult>> {
    try {
      this.logger.info(`Processing URL and integrating with audio pipeline: ${url}`);

      // Add to processing queue if we're at max concurrent processing
      if (this.isProcessing) {
        this.logger.info(`Adding URL to processing queue: ${url}`);
        this.processingQueue.push(url);

        return {
          success: true,
          data: {
            url,
            normalizedUrl: url,
            isStreaming: false,
            securityStatus: 'unknown',
            metadata: { status: 'queued' },
            processingTime: 0
          },
          metadata: {
            duration: 0,
            timestamp: Date.now(),
            status: 'queued'
          }
        };
      }

      this.isProcessing = true;

      try {
        // Process the URL
        const result = await this.urlProcessor.processURL(url);

        if (!result.success) {
          throw result.error || new Error('URL processing failed');
        }

        // Get audio processing service
        const audioProcessingService = await this.serviceRegistry.getService(
          this.config.audioProcessingServiceId!
        );

        // Pass the processed URL to the audio processing service
        if (result.data) {
          await this.integrateWithAudioProcessing(audioProcessingService, result.data);
        }

        // If it's a streaming URL, prepare for streaming
        if (result.data?.isStreaming) {
          await this.prepareForStreaming(result.data.normalizedUrl);
        }

        return result;
      } finally {
        this.isProcessing = false;

        // Process next URL in queue if any
        if (this.processingQueue.length > 0) {
          const nextUrl = this.processingQueue.shift();
          if (nextUrl) {
            // Process next URL asynchronously
            this.processURLAndIntegrate(nextUrl).catch(error => {
              this.logger.error(`Error processing queued URL: ${nextUrl}`, { error });
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error processing URL and integrating: ${url}`, { error });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: 0,
          timestamp: Date.now()
        }
      };
    }
  }

  /**
   * Prepares a URL for streaming and integrates with the audio processing pipeline
   */
  async prepareStreamingAndIntegrate(url: string): Promise<TaskResult<any>> {
    try {
      this.logger.info(`Preparing URL for streaming and integrating: ${url}`);

      // Prepare for streaming
      const streamingResult = await this.urlProcessor.prepareForStreaming(url);

      if (!streamingResult.success) {
        throw streamingResult.error || new Error('Failed to prepare streaming');
      }

      // Get audio processing service
      const audioProcessingService = await this.serviceRegistry.getService(
        this.config.audioProcessingServiceId!
      );

      // Integrate with audio processing
      await this.integrateStreamingWithAudioProcessing(audioProcessingService, streamingResult.data);

      return streamingResult;
    } catch (error) {
      this.logger.error(`Error preparing streaming and integrating: ${url}`, { error });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          duration: 0,
          timestamp: Date.now()
        }
      };
    }
  }

  /**
   * Integrates a processed URL with the audio processing service
   */
  private async integrateWithAudioProcessing(
    audioProcessingService: any,
    processingResult: URLProcessingResult
  ): Promise<void> {
    try {
      this.logger.info(`Integrating URL with audio processing: ${processingResult.url}`);

      // In a real implementation, this would call the appropriate method on the audio processing service
      // For this example, we'll simulate the integration

      // Check if the audio processing service has the required method
      if (typeof audioProcessingService.processAudioFromURL !== 'function') {
        throw new Error('Audio processing service does not support URL processing');
      }

      // Call the audio processing service
      await audioProcessingService.processAudioFromURL({
        url: processingResult.normalizedUrl,
        metadata: processingResult.metadata,
        isStreaming: processingResult.isStreaming
      });

      this.logger.info(`Successfully integrated URL with audio processing: ${processingResult.url}`);
    } catch (error) {
      this.logger.error(`Error integrating URL with audio processing: ${processingResult.url}`, { error });
      throw error;
    }
  }

  /**
   * Integrates streaming with the audio processing service
   */
  private async integrateStreamingWithAudioProcessing(
    audioProcessingService: any,
    streamingData: any
  ): Promise<void> {
    try {
      this.logger.info(`Integrating streaming with audio processing: ${streamingData.url}`);

      // In a real implementation, this would call the appropriate method on the audio processing service
      // For this example, we'll simulate the integration

      // Check if the audio processing service has the required method
      if (typeof audioProcessingService.setupStreamingAudio !== 'function') {
        throw new Error('Audio processing service does not support streaming');
      }

      // Call the audio processing service
      await audioProcessingService.setupStreamingAudio({
        streamingSession: streamingData,
        options: {
          autoStart: false,
          bufferSize: streamingData.bufferLevel || 30
        }
      });

      this.logger.info(`Successfully integrated streaming with audio processing: ${streamingData.url}`);
    } catch (error) {
      this.logger.error(`Error integrating streaming with audio processing: ${streamingData.url}`, { error });
      throw error;
    }
  }

  /**
   * Prepares a URL for streaming
   */
  private async prepareForStreaming(url: string): Promise<void> {
    try {
      this.logger.info(`Preparing URL for streaming: ${url}`);

      // Prepare for streaming
      const streamingResult = await this.urlProcessor.prepareForStreaming(url);

      if (!streamingResult.success) {
        throw streamingResult.error || new Error('Failed to prepare streaming');
      }

      this.logger.info(`Successfully prepared URL for streaming: ${url}`);
    } catch (error) {
      this.logger.error(`Error preparing URL for streaming: ${url}`, { error });
      throw error;
    }
  }
}
