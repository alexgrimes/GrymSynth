import { ServiceConfig, ServiceStatus } from '../../types';
import { Logger } from '../../../utils/logger';

// Import the Stagehand config types
interface SelectorConfig {
  title: string;
  content: string;
  [key: string]: string;
}

interface StagehandConfig {
  env: {
    browserbaseApiKey: string;
  };
  selectors: {
    article: SelectorConfig;
    tutorial: SelectorConfig;
    documentation: SelectorConfig;
  };
  extraction: {
    removeSelectors: string[];
    includeHtml: boolean;
    timeout: number;
  };
}

export interface StagehandConfigurationConfig extends ServiceConfig {
  configPath?: string;
  reloadIntervalMs?: number;
}

export class StagehandConfiguration {
  private config: StagehandConfigurationConfig;
  private logger: Logger;
  private stagehandConfig: StagehandConfig | null = null;
  private reloadTimer: NodeJS.Timeout | null = null;
  private status: ServiceStatus = {
    state: 'initializing',
    timestamp: Date.now()
  };

  constructor(config: StagehandConfigurationConfig) {
    this.config = {
      ...config,
      configPath: config.configPath || 'stagehand.config.js',
      reloadIntervalMs: config.reloadIntervalMs || 3600000 // 1 hour
    };

    this.logger = new Logger({ namespace: 'stagehand-configuration' });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Stagehand configuration');

      // Load configuration
      await this.loadConfiguration();

      // Set up configuration reload timer
      this.setupConfigReload();

      this.status = {
        state: 'ready',
        timestamp: Date.now()
      };

      this.logger.info('Stagehand configuration initialized successfully');
    } catch (error) {
      this.status = {
        state: 'error',
        message: 'Failed to initialize Stagehand configuration',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now()
      };

      this.logger.error('Failed to initialize Stagehand configuration', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Stagehand configuration');

      // Clear configuration reload timer
      if (this.reloadTimer) {
        clearInterval(this.reloadTimer);
        this.reloadTimer = null;
      }

      this.status = {
        state: 'shutdown',
        timestamp: Date.now()
      };

      this.logger.info('Stagehand configuration shut down successfully');
    } catch (error) {
      this.logger.error('Error shutting down Stagehand configuration', { error });
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
   * Gets the current Stagehand configuration
   */
  async getConfiguration(): Promise<StagehandConfig> {
    if (!this.stagehandConfig) {
      await this.loadConfiguration();
    }

    return this.stagehandConfig!;
  }

  /**
   * Gets the extraction configuration
   */
  async getExtractionConfig(): Promise<{
    selectors: {
      article: SelectorConfig;
      tutorial: SelectorConfig;
      documentation: SelectorConfig;
    };
    extraction: {
      removeSelectors: string[];
      includeHtml: boolean;
      timeout: number;
    };
  }> {
    const config = await this.getConfiguration();

    return {
      selectors: config.selectors,
      extraction: config.extraction
    };
  }

  /**
   * Loads the Stagehand configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      this.logger.info('Loading Stagehand configuration');

      // In a real implementation, this would load the configuration from a file or API
      // For this example, we'll use a hardcoded configuration based on the stagehand.config.ts file

      this.stagehandConfig = {
        env: {
          browserbaseApiKey: process.env.BROWSERBASE_API_KEY || '',
        },
        selectors: {
          article: {
            title: 'h1, .article-title, .post-title',
            content: 'article, .article-content, .post-content, main',
            date: 'time, .published-date, .post-date',
            author: '.author-name, .post-author',
          },
          tutorial: {
            title: 'h1, .tutorial-title',
            content: '.tutorial-content, .lesson-content, main',
            difficulty: '.difficulty, .level',
            duration: '.duration, .time-estimate',
          },
          documentation: {
            title: 'h1, .doc-title',
            content: '.doc-content, main',
            version: '.version-info, .doc-version',
            api: '.api-section, .reference',
          },
        },
        extraction: {
          removeSelectors: [
            'script',
            'style',
            'iframe',
            'nav',
            'footer',
            'header',
            'aside',
            '.ad',
            '.advertisement',
            '.popup',
            '.modal',
            '.cookie-notice',
            '.newsletter-signup',
            '#comments',
          ],
          includeHtml: true,
          timeout: 30000,
        },
      };

      this.logger.info('Successfully loaded Stagehand configuration');
    } catch (error) {
      this.logger.error('Error loading Stagehand configuration', { error });
      throw error;
    }
  }

  /**
   * Sets up the configuration reload timer
   */
  private setupConfigReload(): void {
    // Clear existing timer if any
    if (this.reloadTimer) {
      clearInterval(this.reloadTimer);
    }

    // Set up new timer
    this.reloadTimer = setInterval(async () => {
      try {
        await this.loadConfiguration();
        this.logger.info('Reloaded Stagehand configuration');
      } catch (error) {
        this.logger.error('Error in automatic configuration reload', { error });
      }
    }, this.config.reloadIntervalMs);

    // Ensure the timer doesn't prevent the process from exiting
    if (this.reloadTimer.unref) {
      this.reloadTimer.unref();
    }
  }
}
