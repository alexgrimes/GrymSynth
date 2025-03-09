import {
  TaskResult,
  RoutedTaskResult,
  ServiceMetrics,
  createTaskMetadata,
  createTaskResult
} from '../services/types';
import { BaseServiceError } from '../services/errors';

export interface RoutingMetrics {
  routingTime: number;
  contextFetchTime: number;
  executionTime: number;
  totalTime: number;
}

export function createRoutedTaskResult<T>(
  success: boolean,
  data: T | null,
  error?: Error,
  metrics?: ServiceMetrics,
  routingMetrics?: RoutingMetrics,
  status: string = error ? 'error' : 'completed'
): RoutedTaskResult {
  const taskResult = createTaskResult(
    success,
    data,
    error instanceof BaseServiceError ? error : undefined,
    {
      duration: routingMetrics?.totalTime || 0,
      metrics: metrics,
      status
    }
  );

  return {
    ...taskResult,
    status,
    metrics: metrics || {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      },
      resourceUsage: {
        memory: 0,
        cpu: 0
      }
    }
  };
}

export function wrapTaskResult<T>(
  result: TaskResult<T>,
  routingMetrics?: RoutingMetrics
): RoutedTaskResult {
  return {
    ...result,
    status: result.status || (result.error ? 'error' : 'completed'),
    metrics: result.metrics || {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      },
      resourceUsage: {
        memory: 0,
        cpu: 0
      }
    }
  };
}

export function createRoutingError(
  error: Error,
  routingMetrics: RoutingMetrics
): RoutedTaskResult {
  return createRoutedTaskResult(
    false,
    null,
    error,
    {
      requestCount: 1,
      successCount: 0,
      errorCount: 1,
      averageResponseTime: routingMetrics.totalTime,
      memoryUsage: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0
      },
      resourceUsage: {
        memory: 0,
        cpu: 0
      }
    },
    routingMetrics,
    'error'
  );
}
