import { ServiceStatus } from './types';

export interface ModelServiceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  resourceUsage: {
    memory: number;
    cpu: number;
  };
}

export interface ModelService {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): ServiceStatus;
  getMetrics(): Promise<ModelServiceMetrics>;
  executeTask<T = any>(task: any): Promise<T>;
}

export class ModelServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ModelServiceError';
  }
}
