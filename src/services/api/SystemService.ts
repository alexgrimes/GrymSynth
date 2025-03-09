import { apiRequest } from "./api-client";

export interface SystemMetrics {
  cpu: {
    usage: number; // Percentage (0-100)
    temperature: number; // Celsius
    cores: number;
    load: number[]; // 1, 5, and 15 minute load averages
  };
  memory: {
    total: number; // Bytes
    used: number; // Bytes
    free: number; // Bytes
    percentage: number; // Percentage used (0-100)
  };
  gpu: {
    usage: number; // Percentage (0-100)
    memory: {
      total: number; // Bytes
      used: number; // Bytes
      percentage: number; // Percentage used (0-100)
    };
    temperature: number; // Celsius
  };
  storage: {
    total: number; // Bytes
    used: number; // Bytes
    free: number; // Bytes
    percentage: number; // Percentage used (0-100)
  };
  network: {
    bytesIn: number; // Bytes per second
    bytesOut: number; // Bytes per second
    packetsIn: number; // Packets per second
    packetsOut: number; // Packets per second
  };
}

export interface ModelMetrics {
  inferenceLatency: number; // Milliseconds
  requestsPerMinute: number;
  errorRate: number; // Percentage (0-100)
  activeModels: number;
  queuedRequests: number;
  memoryUsage: number; // Bytes
  gpuMemoryUsage: number; // Bytes
}

export interface JobMetrics {
  queuedJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number; // Milliseconds
  totalJobsProcessed: number;
}

export interface Alert {
  id: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  source: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

export class SystemService {
  private static instance: SystemService;

  private constructor() {}

  public static getInstance(): SystemService {
    if (!SystemService.instance) {
      SystemService.instance = new SystemService();
    }
    return SystemService.instance;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return apiRequest.get<SystemMetrics>("/system/metrics");
  }

  async getModelMetrics(): Promise<ModelMetrics> {
    return apiRequest.get<ModelMetrics>("/system/model-metrics");
  }

  async getJobMetrics(): Promise<JobMetrics> {
    return apiRequest.get<JobMetrics>("/system/job-metrics");
  }

  async getAlerts(params?: {
    severity?: Alert["severity"];
    resolved?: boolean;
    startTime?: string;
    endTime?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: Alert[]; total: number }> {
    return apiRequest.get<{ items: Alert[]; total: number }>("/system/alerts", {
      params,
    });
  }

  async resolveAlert(
    alertId: string,
    resolution?: { comment?: string }
  ): Promise<Alert> {
    return apiRequest.post<Alert>(
      `/system/alerts/${alertId}/resolve`,
      resolution
    );
  }

  async getSystemHealth(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    components: Record<
      string,
      {
        status: "healthy" | "degraded" | "unhealthy";
        message?: string;
        lastChecked: string;
      }
    >;
  }> {
    return apiRequest.get<{
      status: "healthy" | "degraded" | "unhealthy";
      components: Record<
        string,
        {
          status: "healthy" | "degraded" | "unhealthy";
          message?: string;
          lastChecked: string;
        }
      >;
    }>("/system/health");
  }

  async getPerformanceHistory(params: {
    metric: "cpu" | "memory" | "gpu" | "inference" | "jobs";
    startTime: string;
    endTime: string;
    interval: "1m" | "5m" | "15m" | "1h" | "1d";
  }): Promise<
    Array<{
      timestamp: string;
      value: number;
    }>
  > {
    return apiRequest.get<
      Array<{
        timestamp: string;
        value: number;
      }>
    >("/system/performance-history", { params });
  }

  async getResourceUtilization(): Promise<{
    resources: Record<
      string,
      {
        allocated: number;
        available: number;
        reserved: number;
        unit: string;
      }
    >;
  }> {
    return apiRequest.get<{
      resources: Record<
        string,
        {
          allocated: number;
          available: number;
          reserved: number;
          unit: string;
        }
      >;
    }>("/system/resource-utilization");
  }
}

export default SystemService.getInstance();
