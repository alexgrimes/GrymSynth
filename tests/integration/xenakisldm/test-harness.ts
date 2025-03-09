import { AudioLDMService } from '../../../src/services/audio/AudioLDMService';
import { XenakisLDMService } from '../../../src/services/xenakisldm/XenakisLDMService';
import { MetricsCollector } from '../../../src/utils/MetricsCollector';
import { AudioBuffer } from '../../../src/types/audio';
import { AudioAnalyzer, SpectralAnalysis } from './audio-analyzer';
import {
  TestAudioLDMConfig,
  TestXenakisConfig,
  defaultTestAudioLDMConfig,
  createTestXenakisConfig
} from './test-config';
import { BaseServiceError } from '../../../src/services/errors';

export interface SpectralDensity {
  mean?: number;
  variance?: number;
}

export interface FrequencyRange {
  min?: number;
  max?: number;
}

export interface PerformanceMetrics {
  maxGenerationTime?: number;
  maxMemoryUsage?: number;
}

export interface TestExpectations {
  duration?: number;
  spectralProperties?: {
    density?: SpectralDensity;
    frequency?: FrequencyRange;
  };
  metrics?: PerformanceMetrics;
  error?: {
    expected: boolean;
    type?: string;
    message?: string;
  };
}

export interface TestCase {
  name: string;
  parameters: {
    prompt: string;
    duration: number;
    mathematical: {
      stochastic?: any;
      sieve?: any;
      cellular?: any;
      gameTheory?: any;
      setTheory?: any;
    };
    mapping: Array<{
      source: string;
      target: string;
      transform?: (value: number) => number;
    }>;
  };
  expectedResults: TestExpectations;
}

export interface TestEnvironment {
  xenakisLDM: XenakisLDMService;
  audioLDM: AudioLDMService;
  metrics: MetricsCollector;
}

export class TestHarness {
  private env: TestEnvironment | null = null;
  private testCases: Map<string, TestCase>;
  private analyzer: AudioAnalyzer;

  constructor() {
    this.testCases = new Map();
    this.analyzer = new AudioAnalyzer(44100, 2048);
  }

  async setupEnvironment(): Promise<TestEnvironment> {
    if (this.env) {
      return this.env;
    }

    try {
      const audioLDM = await AudioLDMService.initialize(defaultTestAudioLDMConfig);

      const xenakisLDM = await XenakisLDMService.initialize(
        createTestXenakisConfig(audioLDM)
      );

      const metrics = new MetricsCollector();

      this.env = {
        xenakisLDM,
        audioLDM,
        metrics
      };

      return this.env;
    } catch (error) {
      throw new BaseServiceError(
        `Failed to setup test environment: ${error instanceof Error ? error.message : String(error)}`,
        'TEST_SETUP_ERROR'
      );
    }
  }

  async teardown(): Promise<void> {
    if (this.env) {
      try {
        await this.env.xenakisLDM.cleanup();
        await this.env.audioLDM.cleanup();
      } finally {
        this.env = null;
      }
    }
  }

  registerTestCase(testCase: TestCase): void {
    this.testCases.set(testCase.name, testCase);
  }

  async runTestCase(name: string): Promise<boolean> {
    const testCase = this.testCases.get(name);
    if (!testCase) {
      throw new BaseServiceError(
        `Test case ${name} not found`,
        'TEST_CONFIGURATION_ERROR'
      );
    }

    const env = await this.setupEnvironment();
    env.metrics.startRecording();

    try {
      const result = await env.xenakisLDM.generateAudio(testCase.parameters);

      if (testCase.expectedResults.error?.expected) {
        return false;
      }

      if (testCase.expectedResults.duration) {
        if (Math.abs(result.audioBuffer.duration - testCase.expectedResults.duration) > 0.1) {
          throw new BaseServiceError(
            `Duration mismatch: expected ${testCase.expectedResults.duration}s, got ${result.audioBuffer.duration}s`,
            'TEST_VALIDATION_ERROR'
          );
        }
      }

      if (testCase.expectedResults.spectralProperties) {
        const isValid = await this.analyzer.validateSpectralProperties(
          result.audioBuffer,
          testCase.expectedResults.spectralProperties
        );

        if (!isValid) {
          throw new BaseServiceError(
            'Spectral properties validation failed',
            'SPECTRAL_VALIDATION_ERROR'
          );
        }
      }

      if (testCase.expectedResults.metrics) {
        const perfMetrics = env.metrics.getMetrics();

        if (testCase.expectedResults.metrics.maxGenerationTime &&
            perfMetrics.duration.total > testCase.expectedResults.metrics.maxGenerationTime) {
          throw new BaseServiceError(
            `Generation time exceeded limit: ${perfMetrics.duration.total}ms > ${testCase.expectedResults.metrics.maxGenerationTime}ms`,
            'PERFORMANCE_ERROR'
          );
        }

        if (testCase.expectedResults.metrics.maxMemoryUsage &&
            perfMetrics.memory.peak > testCase.expectedResults.metrics.maxMemoryUsage) {
          throw new BaseServiceError(
            `Memory usage exceeded limit: ${perfMetrics.memory.peak} bytes > ${testCase.expectedResults.metrics.maxMemoryUsage} bytes`,
            'PERFORMANCE_ERROR'
          );
        }
      }

      env.metrics.stopRecording();
      return true;

    } catch (error) {
      if (testCase.expectedResults.error?.expected) {
        if (error instanceof Error) {
          if (testCase.expectedResults.error.type &&
              error.constructor.name !== testCase.expectedResults.error.type) {
            return false;
          }
          if (testCase.expectedResults.error.message &&
              !error.message.includes(testCase.expectedResults.error.message)) {
            return false;
          }
          return true;
        }
        return false;
      }
      throw error;
    }
  }
}
