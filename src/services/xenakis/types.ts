import { AudioGenerationResult } from '../audio/AudioLDMService';

export interface AudioGenerationParameters {
  prompt: string;
  diffusionSteps?: number;
  guidanceScale?: number;
  batchSize?: number;
  sampleRate?: number;
  duration?: number;
  [key: string]: any;
}

export type GeneratorType = 'stochastic' | 'sieve' | 'cellular' | 'game' | 'set';

export type DistributionType = 'gaussian' | 'poisson' | 'exponential' | 'custom';
export type SieveOperation = 'union' | 'intersection' | 'complement';
export type SetOperation = 'transpose' | 'invert' | 'retrograde';
export type EvolutionStrategy = 'nash' | 'cooperative' | 'competitive';

export interface XenakisConfig {
  maxMemory: string;
  useWebAssembly?: boolean;
  parameterPrecision?: number;
  cachingEnabled?: boolean;
  maxParallelGenerators?: number;
}

export interface GeneratorConfig {
  type: GeneratorType;
  duration: number;
  sampleRate: number;
}

export interface StochasticConfig extends GeneratorConfig {
  type: 'stochastic';
  distribution: {
    type: DistributionType;
    parameters: Record<string, number>;
  };
  range: {
    min: number;
    max: number;
  };
  timeScale: number;
}

export interface SieveConfig extends GeneratorConfig {
  type: 'sieve';
  moduli: number[];
  residues: number[];
  operations: SieveOperation[];
  period?: number;
}

export interface CellularAutomataConfig extends GeneratorConfig {
  type: 'cellular';
  rule: number;
  initialState: number[];
  dimensions: 1 | 2;
  neighborhoodSize: number;
}

export interface GameTheoryConfig extends GeneratorConfig {
  type: 'game';
  players: string[];
  strategies: Map<string, string[]>;
  payoffs: Map<string, Map<string, number>>;
  evolutionStrategy: EvolutionStrategy;
  steps: number;
}

export interface SetTheoryConfig extends GeneratorConfig {
  type: 'set';
  initialSet: number[];
  operations: SetOperation[];
  transformationSequence: string[];
}

export interface MathematicalParameter {
  id: string;
  type: string;
  value: number;
  time: number;
  metadata?: Record<string, any>;
}

export interface ParameterMapping {
  source: MathematicalParameter;
  target: keyof AudioGenerationParameters;
  transform?: (value: number) => number;
  constraints?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

export interface MappingConstraints {
  timeRange?: {
    min: number;
    max: number;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  forbidden?: number[];
}

export interface XenakisParameters extends AudioGenerationParameters {
  mathematical: {
    stochastic?: StochasticConfig;
    sieve?: SieveConfig;
    cellular?: CellularAutomataConfig;
    gameTheory?: GameTheoryConfig;
    setTheory?: SetTheoryConfig;
  };
  mapping: ParameterMapping[];
  constraints?: MappingConstraints;
}

export interface ParameterStream {
  parameters: MathematicalParameter[];
  metadata: {
    generator: GeneratorType;
    config: GeneratorConfig;
    timestamp: number;
  };
}

export interface GenerationResult extends AudioGenerationResult {
  mathematicalStructure: ParameterStream;
  visualizationData?: VisualizationData;
}

export interface VisualizationData {
  type: 'graph' | 'matrix' | 'waveform' | 'spectrum';
  data: number[][];
  labels?: string[];
  dimensions: {
    width: number;
    height: number;
  };
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export class XenakisError extends Error {
  constructor(
    public type: string,
    public details: Record<string, any>,
    public recovery?: () => Promise<void>
  ) {
    super(`XenakisLDM Error [${type}]: ${JSON.stringify(details)}`);
    this.name = 'XenakisError';
  }
}
