export { ServiceError, BaseServiceError, ServiceNotFoundError, AudioLDMServiceError } from './errors';

// Define the ServiceStatus enum
export enum ServiceStatus {
  OFFLINE = "offline",
  ONLINE = "online",
  ERROR = "error",
  INITIALIZING = "initializing"
}

// Define the ServiceStatusInfo type for detailed status information
export type ServiceStatusInfo = {
  state: ServiceStatus;
  message?: string;
  error?: Error;
  timestamp: number;
};

// Define the ServiceHealth interface
export interface ServiceHealth {
  status: ServiceStatus;
  metrics: ServiceMetrics;
  lastChecked: Date;
}

// Define the ModelService interface for service implementations
export interface ModelService {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): ServiceStatus;
  getMetrics(): Promise<ServiceMetrics> | ServiceMetrics;
  executeTask(task: Task): Promise<TaskResult>;
  isInitialized(): boolean;
}

export interface ServiceConfig {
  readonly id: string;
  [key: string]: any;
}

export interface ServiceMemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export interface ServiceResourceUsage {
  memory: number;
  cpu: number;
}

export interface ServiceMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: ServiceMemoryUsage;
  resourceUsage: ServiceResourceUsage;
  processingTime?: number;
  lastProcessedAt?: number;
}

export interface TaskMetadata {
  duration: number;
  timestamp: number;
  status?: string;
  metrics?: ServiceMetrics;
}

export interface BaseTaskResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata: TaskMetadata;
  id?: string;
  status?: string;
  metrics?: ServiceMetrics;
}

export type TaskResult<T = any> = BaseTaskResult<T>;

export interface Task<T = any> {
  id: string;
  type: string;
  data: T;
  priority?: number;
  timeout?: number;
  retries?: number;
  metadata?: Record<string, any>;
  modelType?: string;
  context?: any;
  storeResults?: boolean;
}

export interface ContextQuery {
  type: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  key?: string;
  workflowId?: string;
}

export interface BaseMetadata {
  timestamp: number;
  source: string;
  [key: string]: any;
}

export interface ModelContextMetadata extends BaseMetadata {
  priority: number;
  tags: string[];
}

export interface BaseContextItem {
  id: string;
  type: string;
  key?: string;
  workflowId?: string;
  metadata: ModelContextMetadata;
}

export interface ContextItem extends BaseContextItem {
  data: any;
  content: any;
  timestamp: number;
}

export interface RoutingInfo {
  service: string;
  priority: number;
  timestamp: number;
}

export interface RoutedTaskResult extends TaskResult {
  routingInfo?: RoutingInfo;
  status: string;
  metrics: ServiceMetrics;
}

export interface Wav2Vec2ServiceConfig extends ServiceConfig {
  modelPath: string;
  batchSize: number;
  deviceType: 'cpu' | 'cuda';
  maxAudioLength: number;
  maxMemory?: string;
}

export interface AudioLDMServiceConfig extends ServiceConfig {
  model: string;
  maxDuration: number;
  sampleRate: number;
  deviceType?: 'cpu' | 'cuda';
  batchSize?: number;
}

// Re-export helpers
export {
  createServiceMemoryUsage,
  createServiceMetrics,
  createTaskMetadata,
  createTaskResult,
  createContextQuery,
  createModelContextMetadata,
  ensureNumber
} from './helpers';

// Utility functions for timestamp handling
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

export function dateToTimestamp(date: Date | number): number {
  return typeof date === 'number' ? date : date.getTime();
}

export function ensureTimestamp(value: Date | number): number {
  return typeof value === 'number' ? value : value.getTime();
}
