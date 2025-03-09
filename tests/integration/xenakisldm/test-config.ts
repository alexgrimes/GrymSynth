import { ServiceConfig } from '../../../src/services/types';
import { AudioLDMService } from '../../../src/services/audio/AudioLDMService';

export interface TestServiceConfig extends ServiceConfig {
  id: string;
}

export interface TestAudioLDMConfig extends TestServiceConfig {
  model: string;
  maxDuration: number;
  sampleRate: number;
  deviceType?: 'cpu' | 'cuda';
  batchSize?: number;
}

export interface TestXenakisConfig extends TestServiceConfig {
  audioLDM: AudioLDMService;
  maxGenerators: number;
  defaultDuration: number;
}

export interface TestMetricsConfig {
  collectInterval: number;
  memoryThreshold: number;
  cpuThreshold: number;
}

export const defaultTestAudioLDMConfig: TestAudioLDMConfig = {
  id: 'test-audio-ldm',
  model: 'test-model',
  maxDuration: 300,
  sampleRate: 44100,
  deviceType: 'cpu',
  batchSize: 1
};

export const defaultTestMetricsConfig: TestMetricsConfig = {
  collectInterval: 1000,
  memoryThreshold: 1024 * 1024 * 1024, // 1GB
  cpuThreshold: 80
};

export function createTestXenakisConfig(
  audioLDM: AudioLDMService,
  customConfig: Partial<TestXenakisConfig> = {}
): TestXenakisConfig {
  return {
    id: 'test-xenakis-ldm',
    audioLDM,
    maxGenerators: 5,
    defaultDuration: 60,
    ...customConfig
  };
}

export function createCustomAudioLDMConfig(
  overrides: Partial<TestAudioLDMConfig> = {}
): TestAudioLDMConfig {
  return {
    ...defaultTestAudioLDMConfig,
    ...overrides
  };
}

export function createCustomMetricsConfig(
  overrides: Partial<TestMetricsConfig> = {}
): TestMetricsConfig {
  return {
    ...defaultTestMetricsConfig,
    ...overrides
  };
}
