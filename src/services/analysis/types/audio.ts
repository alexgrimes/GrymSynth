import { SimpleAudioBuffer } from '../../../interfaces/audio';

export interface AudioPattern {
  id: string;
  type: string;
  features: number[] | Float32Array;  // Updated to support both number[] and Float32Array
  startTime: number;
  endTime: number;
  frequencyRange: {
    low: number;
    high: number;
  };
  confidence: number;
  metadata?: Record<string, any>;
}

export interface AnalysisConfig {
  detailLevel?: 'basic' | 'detailed';
  includeConfidenceScores?: boolean;
  timeRange?: {
    start: number;
    end: number;
  };
  frequencyRange?: {
    low: number;
    high: number;
  };
  customParams?: Record<string, any>;
}

export interface AnalysisError extends Error {
  code: string;
  details?: Record<string, any>;
}

export interface AnalysisResult {
  patternId: string;
  timestamp: Date;
  confidence: number;
  duration: number;
  features: Record<string, any>;
  metadata?: Record<string, any>;
}
