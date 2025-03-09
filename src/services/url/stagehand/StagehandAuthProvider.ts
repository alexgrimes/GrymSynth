import { ServiceConfig, ServiceStatus } from '../../types';
import { Logger } from '../../../utils/logger';

export interface StagehandAuthProviderConfig extends ServiceConfig {
  browserbaseApiKey: string;
  tokenRefreshIntervalMs?: number;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}

export class StagehandAuthProvider {
  private config: StagehandAuthProviderConfig;
  private logger: Logger;
  private currentToken: AuthToken | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private status: ServiceStatus = {
    state: 'initializing',
    timestamp: Date.now()
  };

  constructor(config: StagehandAuthProviderConfig) {
    this.config = {
      ...config,
      tokenRefreshIntervalMs: config.tokenRefreshIntervalMs || 3600000 // 1 hour
    };

    this.logger = new Logger({ namespace: 'stagehand-auth-provider' });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Stagehand auth provider');

      // Validate API key
      if (!this.config.browserbaseApiKey) {
        throw new Error('Browserbase API key is required');
      }

      // Get initial token
      await this.refreshToken();

      // Set up token refresh timer
      this.setupTokenRefresh();

      this.status = {
        state: 'ready',
        timestamp: Date.now()
      };

      this.logger.info('Stagehand auth provider initialized successfully');
    } catch (error) {
      this.status = {
        state: 'error',
        message: 'Failed to initialize Stagehand auth provider',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now()
      };

      this.logger.error('Failed to initialize Stagehand auth provider', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Stagehand auth provider');

      // Clear token refresh timer
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }

      this.status = {
        state: 'shutdown',
        timestamp: Date.now()
      };

      this.logger.info('Stagehand auth provider shut down successfully');
    } catch (error) {
      this.logger.error('Error shutting down Stagehand auth provider', { error });
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
   * Gets the current auth token, refreshing if necessary
   */
  async getAuthToken(): Promise<string> {
    try {
      // Check if token exists and is valid
      if (!this.currentToken || this.isTokenExpired()) {
        await this.refreshToken();
      }

      return this.currentToken!.token;
    } catch (error) {
      this.logger.error('Error getting auth token', { error });
      throw error;
    }
  }

  /**
   * Refreshes the auth token
   */
  private async refreshToken(): Promise<void> {
    try {
      this.logger.info('Refreshing Stagehand auth token');

      // In a real implementation, this would make an API call to get a new token
      // For this example, we'll simulate a token

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a simulated token that expires in 1 hour
      const expiresAt = Date.now() + this.config.tokenRefreshIntervalMs!;

      this.currentToken = {
        token: `simulated-token-${Date.now()}`,
        expiresAt
      };

      this.logger.info('Successfully refreshed Stagehand auth token');
    } catch (error) {
      this.logger.error('Error refreshing auth token', { error });
      throw error;
    }
  }

  /**
   * Sets up the token refresh timer
   */
  private setupTokenRefresh(): void {
    // Clear existing timer if any
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Set up new timer
    this.refreshTimer = setInterval(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        this.logger.error('Error in automatic token refresh', { error });
      }
    }, this.config.tokenRefreshIntervalMs);

    // Ensure the timer doesn't prevent the process from exiting
    if (this.refreshTimer.unref) {
      this.refreshTimer.unref();
    }
  }

  /**
   * Checks if the current token is expired or about to expire
   */
  private isTokenExpired(): boolean {
    if (!this.currentToken) {
      return true;
    }

    // Consider token expired if it expires in less than 5 minutes
    const expirationBuffer = 5 * 60 * 1000; // 5 minutes
    return Date.now() > (this.currentToken.expiresAt - expirationBuffer);
  }
}
