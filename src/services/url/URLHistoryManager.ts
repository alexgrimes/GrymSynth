import { ServiceConfig, ServiceStatus } from '../types';
import { Logger } from '../../utils/logger';

export interface URLHistoryEntry {
  url: string;
  timestamp: number;
  metadata: Record<string, any>;
  status?: 'success' | 'error';
  error?: string;
}

export interface URLHistoryManagerConfig extends ServiceConfig {
  maxHistorySize?: number;
  storageKey?: string;
  persistHistory?: boolean;
}

export class URLHistoryManager {
  private config: URLHistoryManagerConfig;
  private logger: Logger;
  private history: URLHistoryEntry[] = [];
  private status: ServiceStatus = {
    state: 'initializing',
    timestamp: Date.now()
  };

  constructor(config: URLHistoryManagerConfig) {
    this.config = {
      ...config,
      maxHistorySize: config.maxHistorySize || 100,
      storageKey: config.storageKey || 'url-history',
      persistHistory: config.persistHistory !== false
    };

    this.logger = new Logger({ namespace: 'url-history-manager' });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing URL history manager service');

      // Load history from storage if persistence is enabled
      if (this.config.persistHistory) {
        await this.loadHistory();
      }

      this.status = {
        state: 'ready',
        timestamp: Date.now()
      };

      this.logger.info('URL history manager service initialized successfully');
    } catch (error) {
      this.status = {
        state: 'error',
        message: 'Failed to initialize URL history manager service',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: Date.now()
      };

      this.logger.error('Failed to initialize URL history manager service', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down URL history manager service');

      // Save history to storage if persistence is enabled
      if (this.config.persistHistory) {
        await this.saveHistory();
      }

      this.status = {
        state: 'shutdown',
        timestamp: Date.now()
      };

      this.logger.info('URL history manager service shut down successfully');
    } catch (error) {
      this.logger.error('Error shutting down URL history manager service', { error });
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
   * Adds a URL to the history
   */
  async addToHistory(entry: URLHistoryEntry): Promise<void> {
    try {
      this.logger.info(`Adding URL to history: ${entry.url}`);

      // Add to in-memory history
      this.history.unshift(entry);

      // Trim history if it exceeds the maximum size
      if (this.history.length > this.config.maxHistorySize!) {
        this.history = this.history.slice(0, this.config.maxHistorySize);
      }

      // Save to persistent storage if enabled
      if (this.config.persistHistory) {
        await this.saveHistory();
      }
    } catch (error) {
      this.logger.error(`Error adding URL to history: ${entry.url}`, { error });
      throw error;
    }
  }

  /**
   * Retrieves URL history
   */
  async getHistory(limit: number = 10): Promise<URLHistoryEntry[]> {
    try {
      this.logger.info(`Retrieving URL history (limit: ${limit})`);
      return this.history.slice(0, limit);
    } catch (error) {
      this.logger.error('Error retrieving URL history', { error });
      throw error;
    }
  }

  /**
   * Clears URL history
   */
  async clearHistory(): Promise<void> {
    try {
      this.logger.info('Clearing URL history');

      this.history = [];

      // Update persistent storage if enabled
      if (this.config.persistHistory) {
        await this.saveHistory();
      }
    } catch (error) {
      this.logger.error('Error clearing URL history', { error });
      throw error;
    }
  }

  /**
   * Searches URL history
   */
  async searchHistory(query: string): Promise<URLHistoryEntry[]> {
    try {
      this.logger.info(`Searching URL history: ${query}`);

      const queryLower = query.toLowerCase();

      return this.history.filter(entry =>
        entry.url.toLowerCase().includes(queryLower) ||
        JSON.stringify(entry.metadata).toLowerCase().includes(queryLower)
      );
    } catch (error) {
      this.logger.error(`Error searching URL history: ${query}`, { error });
      throw error;
    }
  }

  /**
   * Loads history from persistent storage
   */
  private async loadHistory(): Promise<void> {
    try {
      this.logger.debug('Loading URL history from storage');

      // In a real implementation, this would load from a database or file
      // For this example, we'll use localStorage in the browser environment
      // or a simple in-memory cache in Node.js

      if (typeof window !== 'undefined' && window.localStorage) {
        const storedHistory = localStorage.getItem(this.config.storageKey!);
        if (storedHistory) {
          this.history = JSON.parse(storedHistory);
        }
      } else {
        // In Node.js, we would typically use a database or file system
        // For this example, we'll just initialize with an empty history
        this.history = [];
      }
    } catch (error) {
      this.logger.warn('Error loading URL history from storage', { error });
      // Initialize with empty history on error
      this.history = [];
    }
  }

  /**
   * Saves history to persistent storage
   */
  private async saveHistory(): Promise<void> {
    try {
      this.logger.debug('Saving URL history to storage');

      // In a real implementation, this would save to a database or file
      // For this example, we'll use localStorage in the browser environment

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.config.storageKey!, JSON.stringify(this.history));
      } else {
        // In Node.js, we would typically use a database or file system
        // For this example, we'll just log that we would save the history
        this.logger.debug('Would save history to persistent storage in Node.js environment');
      }
    } catch (error) {
      this.logger.warn('Error saving URL history to storage', { error });
      // Continue without throwing to avoid disrupting the application
    }
  }
}
