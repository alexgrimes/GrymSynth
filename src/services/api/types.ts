import {
  SpectralRegion,
  AudioMetadata,
} from "../../components/visualization/types";

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface AudioFile extends AudioMetadata {
  url: string;
  size: number;
  metadata?: Record<string, any>;
}

export interface AudioPatternBase extends Omit<SpectralRegion, "patternId"> {
  audioFileId: string;
  metadata?: Record<string, any>;
}

export interface AudioPattern extends SpectralRegion {
  id: string;
  audioFileId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface AudioProcessingOptions {
  detectPatterns?: boolean;
  analyzePitch?: boolean;
  analyzeRhythm?: boolean;
  extractFeatures?: boolean;
  customParameters?: Record<string, any>;
}

export interface AudioAnalysisResult {
  patterns: AudioPattern[];
  metadata: Record<string, any>;
}

export interface ProcessingProgress {
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  currentStep?: string;
  error?: string;
}

export interface SystemMetricsBase {
  timestamp: string;
  value: number;
  unit: string;
}

export interface ResourceMetrics extends SystemMetricsBase {
  total: number;
  used: number;
  free: number;
  percentage: number;
}

export interface PerformanceMetrics extends SystemMetricsBase {
  averageLatency: number;
  requestsPerMinute: number;
  errorRate: number;
}

export interface SystemHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  lastChecked: string;
  metrics: {
    cpu: ResourceMetrics;
    memory: ResourceMetrics;
    storage: ResourceMetrics;
    network: {
      bytesIn: number;
      bytesOut: number;
      latency: number;
    };
    processing: {
      queueLength: number;
      activeJobs: number;
      completedJobs: number;
      failedJobs: number;
    };
  };
}
