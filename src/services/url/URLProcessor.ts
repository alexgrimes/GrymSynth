import { ServiceConfig, ServiceStatus, TaskResult } from '../types';
import { Logger } from '../../utils/logger';
import { StagehandClient } from './stagehand/StagehandClient';
import { URLMetadataExtractor } from './URLMetadataExtractor';
import { URLHistoryManager } from './URLHistoryManager';
import { URLStreamingManager } from './URLStreamingManager';

export interface URLProcessorConfig extends ServiceConfig {
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
  securityCheckEnabled: boolean;
  allowedDomains?: string[];
  blockedDomains?: string[];
}

export interface URLValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
  securityStatus?: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  securityDetails?: Record<string, any>;
}

export interface URLProcessingResult {
  url: string;
  normalizedUrl: string;
  isStreaming: boolean;
  metadata: Record<string, any>;
  securityStatus: 'safe' | 'suspicious' | 'malicious' | 'unknown';
  processingTime: number;
  error?: string;
}

export class URLProcessor {
  private config: URLProcessorConfig;
  private logger: Logger;
  private stagehandClient: StagehandClient;
  private metadataExtractor: URLMetadataExtractor;
  private historyManager: URLHistoryManager;
  private streamingManager: URLStreamingManager;
  private status: ServiceStatus = {
    state: 'initializing',
    timestamp: Date.now()
  };

  constructor(config: URLProcessorConfig) {
    this.config = {
      ...config,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      timeoutMs: config.timeoutMs || 30000,
      securityCheckEnabled: config.securityCheckEnabled !== false
    };

    this.logger = new Logger({ namespace: 'url-processor' });
    this.stagehandClient = new StagehandClient({
      id: `${config.id}-stagehand-client`,
      browserbaseApiKey: process.env.BROWSERBASE_API_KEY || ''
    });

    this.metadataExtractor = new URLMetadataExtractor({
      id: `${config.id}-metadata-extractor`
    });

    this.historyManager = new URLHistoryManager({
      id: `${config.id}-history-manager`
    });

    this.streamingManager = new URLStreamingManager({
      id: `${config.id}-streaming-manager`
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing URL processor service');

      await Promise.all([
        this.stagehandClient.initialize(),
        this.metadataExtractor.initialize(),
        this.historyManager.initialize(),
        this.streamingManager.initialize()
      ]);

      this.status = {
        state: 'ready',
        timestamp: Date.now()
      };

      this.logger.info('URL processor service initialized successfully');
    } catch (error) {
      this.status = {
        state: 'error',
        message: 'Failed to initialize URL processor service',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now()
      };

      this.logger.error('Failed to initialize URL processor service', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down URL processor service');

      await Promise.all([
        this.stagehandClient.shutdown(),
        this.metadataExtractor.shutdown(),
        this.historyManager.shutdown(),
        this.streamingManager.shutdown()
      ]);

      this.status = {
        state: 'shutdown',
        timestamp: Date.now()
      };

      this.logger.info('URL processor service shut down successfully');
    } catch (error) {
      this.logger.error('Error shutting down URL processor service', { error });
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
   * Validates a URL and performs security checks if enabled
   */
  async validateURL(url: string): Promise<URLValidationResult> {
    try {
      this.logger.info(`Validating URL: ${url}`);

      // Basic URL validation
      let normalizedUrl = url.trim();

      // Add protocol if missing
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Validate URL format
      try {
        new URL(normalizedUrl);
      } catch (error) {
        return {
          isValid: false,
          normalizedUrl,
          error: 'Invalid URL format'
        };
      }

      // Domain validation if configured
      const urlObj = new URL(normalizedUrl);
      const domain = urlObj.hostname;

      if (this.config.blockedDomains?.includes(domain)) {
        return {
          isValid: false,
          normalizedUrl,
          error: 'Domain is blocked'
        };
      }

      if (this.config.allowedDomains?.length && !this.config.allowedDomains.includes(domain)) {
        return {
          isValid: false,
          normalizedUrl,
          error: 'Domain is not in the allowed list'
        };
      }

      // Security check if enabled
      if (this.config.securityCheckEnabled) {
        const securityResult = await this.stagehandClient.checkURLSecurity(normalizedUrl);

        if (securityResult.status === 'malicious') {
          return {
            isValid: false,
            normalizedUrl,
            securityStatus: securityResult.status,
            securityDetails: securityResult.details,
            error: 'URL is flagged as malicious'
          };
        }

        return {
          isValid: true,
          normalizedUrl,
          securityStatus: securityResult.status,
          securityDetails: securityResult.details
        };
      }

      return {
        isValid: true,
        normalizedUrl
      };
    } catch (error) {
      this.logger.error(`Error validating URL: ${url}`, { error });
      return {
        isValid: false,
        normalizedUrl: url,
        error: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Processes a URL with retry logic
   */
  async processURL(url: string): Promise<TaskResult<URLProcessingResult>> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < this.config.maxRetries) {
      try {
        attempts++;
        this.logger.info(`Processing URL (attempt ${attempts}): ${url}`);

        // Validate URL
        const validationResult = await this.validateURL(url);
        if (!validationResult.isValid) {
          throw new Error(validationResult.error || 'URL validation failed');
        }

        // Determine if URL is for streaming or download
        const isStreaming = await this.streamingManager.isStreamingURL(validationResult.normalizedUrl);

        // Extract metadata
        const metadata = await this.metadataExtractor.extractMetadata(validationResult.normalizedUrl);

        // Add to history
        await this.historyManager.addToHistory({
          url: validationResult.normalizedUrl,
          timestamp: Date.now(),
          metadata
        });

        // Prepare result
        const result: URLProcessingResult = {
          url,
          normalizedUrl: validationResult.normalizedUrl,
          isStreaming,
          metadata,
          securityStatus: validationResult.securityStatus || 'unknown',
          processingTime: Date.now() - startTime
        };

        return {
          success: true,
          data: result,
          metadata: {
            duration: Date.now() - startTime,
            timestamp: Date.now()
          }
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Error processing URL (attempt ${attempts}): ${url}`, { error });

        if (attempts < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    this.logger.error(`Failed to process URL after ${attempts} attempts: ${url}`, { error: lastError });

    return {
      success: false,
      error: lastError,
      metadata: {
        duration: Date.now() - startTime,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Prepares a URL for streaming
   */
  async prepareForStreaming(url: string): Promise<TaskResult<any>> {
    try {
      this.logger.info(`Preparing URL for streaming: ${url}`);

      // Validate URL first
      const validationResult = await this.validateURL(url);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || 'URL validation failed');
      }

      // Check if URL is suitable for streaming
      const isStreaming = await this.streamingManager.isStreamingURL(validationResult.normalizedUrl);
      if (!isStreaming) {
        throw new Error('URL is not suitable for streaming');
      }

      // Prepare streaming
      const streamingResult = await this.streamingManager.prepareStreaming(validationResult.normalizedUrl);

      return {
        success: true,
        data: streamingResult,
        metadata: {
          duration: 0,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      this.logger.error(`Error preparing URL for streaming: ${url}`, { error });

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
   * Retrieves URL processing history
   */
  async getURLHistory(limit: number = 10): Promise<TaskResult<any>> {
    try {
      const history = await this.historyManager.getHistory(limit);

      return {
        success: true,
        data: history,
        metadata: {
          duration: 0,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      this.logger.error('Error retrieving URL history', { error });

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
}
