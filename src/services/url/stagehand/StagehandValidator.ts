import { ServiceConfig, ServiceStatus } from '../../types';
import { Logger } from '../../../utils/logger';

export interface StagehandValidatorConfig extends ServiceConfig {
  allowedProtocols?: string[];
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxUrlLength?: number;
}

export class StagehandValidator {
  private config: StagehandValidatorConfig;
  private logger: Logger;
  private status: ServiceStatus = {
    state: 'initializing',
    timestamp: Date.now()
  };

  constructor(config: StagehandValidatorConfig) {
    this.config = {
      ...config,
      allowedProtocols: config.allowedProtocols || ['http:', 'https:'],
      maxUrlLength: config.maxUrlLength || 2048
    };

    this.logger = new Logger({ namespace: 'stagehand-validator' });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Stagehand validator');

      // Initialization logic here

      this.status = {
        state: 'ready',
        timestamp: Date.now()
      };

      this.logger.info('Stagehand validator initialized successfully');
    } catch (error) {
      this.status = {
        state: 'error',
        message: 'Failed to initialize Stagehand validator',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now()
      };

      this.logger.error('Failed to initialize Stagehand validator', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Stagehand validator');

      // Shutdown logic here

      this.status = {
        state: 'shutdown',
        timestamp: Date.now()
      };

      this.logger.info('Stagehand validator shut down successfully');
    } catch (error) {
      this.logger.error('Error shutting down Stagehand validator', { error });
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
   * Validates a URL against security and format rules
   */
  async validateURL(url: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      this.logger.info(`Validating URL: ${url}`);

      // Basic URL validation
      let normalizedUrl = url.trim();

      // Add protocol if missing
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      // Check URL length
      if (normalizedUrl.length > this.config.maxUrlLength!) {
        return {
          isValid: false,
          error: `URL exceeds maximum length of ${this.config.maxUrlLength} characters`
        };
      }

      // Validate URL format
      let urlObj: URL;
      try {
        urlObj = new URL(normalizedUrl);
      } catch (error) {
        return {
          isValid: false,
          error: 'Invalid URL format'
        };
      }

      // Check protocol
      if (!this.config.allowedProtocols!.includes(urlObj.protocol)) {
        return {
          isValid: false,
          error: `Protocol ${urlObj.protocol} is not allowed. Allowed protocols: ${this.config.allowedProtocols!.join(', ')}`
        };
      }

      // Check domain
      const domain = urlObj.hostname;

      if (this.config.blockedDomains?.includes(domain)) {
        return {
          isValid: false,
          error: 'Domain is blocked'
        };
      }

      if (this.config.allowedDomains?.length && !this.config.allowedDomains.includes(domain)) {
        return {
          isValid: false,
          error: 'Domain is not in the allowed list'
        };
      }

      // Check for suspicious patterns
      if (this.hasSuspiciousPatterns(normalizedUrl)) {
        return {
          isValid: false,
          error: 'URL contains suspicious patterns'
        };
      }

      return {
        isValid: true
      };
    } catch (error) {
      this.logger.error(`Error validating URL: ${url}`, { error });
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Checks if a URL contains suspicious patterns
   */
  private hasSuspiciousPatterns(url: string): boolean {
    // Check for common phishing indicators
    const suspiciousPatterns = [
      /\.(tk|ml|ga|cf|gq)\//, // Suspicious TLDs often used in phishing
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /[a-zA-Z0-9]{30,}/, // Very long random strings
      /\.(php|aspx|jsp)\?/, // Suspicious query parameters
      /login|signin|account|password|credential|bank|paypal|verify|secure|update|confirm/i // Suspicious keywords
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
}
