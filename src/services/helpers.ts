import {
  ServiceMemoryUsage,
  ServiceMetrics,
  TaskMetadata,
  TaskResult,
  ContextQuery,
  ModelContextMetadata,
  ServiceError
} from './types';
import { wrapError } from './errors';

export function createServiceMemoryUsage(
  heapUsed: number,
  heapTotal: number,
  external: number
): ServiceMemoryUsage {
  return {
    heapUsed,
    heapTotal,
    external
  };
}

export function createServiceMetrics(
  partialMetrics: Partial<ServiceMetrics> = {}
): ServiceMetrics {
  return {
    requestCount: partialMetrics.requestCount || 0,
    successCount: partialMetrics.successCount || 0,
    errorCount: partialMetrics.errorCount || 0,
    averageResponseTime: partialMetrics.averageResponseTime || 0,
    memoryUsage: partialMetrics.memoryUsage || createServiceMemoryUsage(0, 0, 0),
    resourceUsage: partialMetrics.resourceUsage || { memory: 0, cpu: 0 },
    processingTime: partialMetrics.processingTime,
    lastProcessedAt: partialMetrics.lastProcessedAt
  };
}

export function createTaskMetadata(
  duration: number,
  metrics?: ServiceMetrics,
  status?: string
): TaskMetadata {
  return {
    duration,
    timestamp: Date.now(),
    status,
    metrics
  };
}

export function createTaskResult<T>(
  success: boolean,
  data?: T,
  error?: Error | ServiceError,
  metadata?: Partial<TaskMetadata>,
  id?: string,
  status?: string
): TaskResult<T> {
  // Ensure error is an Error object
  let processedError: Error | undefined = undefined;
  if (error) {
    if (error instanceof Error) {
      processedError = error;
    } else {
      // Convert ServiceError to Error
      processedError = new Error(error.message);
      processedError.name = error.code;
      (processedError as any).details = error.details;
    }
  }

  return {
    success,
    data,
    error: processedError,
    metadata: createTaskMetadata(
      metadata?.duration || 0,
      metadata?.metrics,
      metadata?.status || status
    ),
    id,
    status
  };
}

export function createContextQuery(
  type: string,
  key?: string,
  workflowId?: string,
  options: Partial<Omit<ContextQuery, 'type' | 'key' | 'workflowId'>> = {}
): ContextQuery {
  return {
    type,
    key,
    workflowId,
    ...options
  };
}

export function createModelContextMetadata(
  source: string,
  priority = 0,
  tags: string[] = [],
  timestamp = Date.now(),
  additionalMetadata: Record<string, any> = {}
): ModelContextMetadata {
  return {
    timestamp,
    source,
    priority,
    tags,
    ...additionalMetadata
  };
}

export function ensureNumber(value: string | number): number {
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Invalid number: ${value}`);
    }
    return parsed;
  }
  return value;
}
