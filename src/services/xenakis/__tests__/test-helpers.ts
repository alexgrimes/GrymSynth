import {
  ParameterStream,
  MathematicalParameter,
  VisualizationData,
  StochasticConfig,
  SieveConfig,
  CellularAutomataConfig,
  GameTheoryConfig,
  SetTheoryConfig
} from '../types';

/**
 * Common test configurations for each generator type
 */
export const testConfigs = {
  stochastic: {
    type: 'stochastic',
    duration: 1,
    sampleRate: 44100,
    distribution: {
      type: 'gaussian' as const,
      parameters: {
        mean: 0,
        stdDev: 1
      }
    },
    range: {
      min: -1,
      max: 1
    },
    timeScale: 1
  } satisfies StochasticConfig,

  sieve: {
    type: 'sieve',
    duration: 1,
    sampleRate: 44100,
    moduli: [2, 3, 5],
    residues: [0, 1, 2],
    operations: ['union' as const],
    period: 30
  } satisfies SieveConfig,

  cellular: {
    type: 'cellular',
    duration: 1,
    sampleRate: 44100,
    rule: 30,
    initialState: [0, 0, 1, 0, 0],
    dimensions: 1,
    neighborhoodSize: 1
  } satisfies CellularAutomataConfig,

  game: {
    type: 'game',
    duration: 1,
    sampleRate: 44100,
    players: ['player1', 'player2'],
    strategies: new Map([
      ['player1', ['cooperate', 'defect']],
      ['player2', ['cooperate', 'defect']]
    ]),
    payoffs: new Map([
      ['player1', new Map([
        ['cooperate', 3],
        ['defect', 5]
      ])],
      ['player2', new Map([
        ['cooperate', 3],
        ['defect', 5]
      ])]
    ]),
    evolutionStrategy: 'nash',
    steps: 10
  } satisfies GameTheoryConfig,

  set: {
    type: 'set',
    duration: 1,
    sampleRate: 44100,
    initialSet: [0, 4, 7],
    operations: ['transpose', 'invert'],
    transformationSequence: ['transpose:5', 'invert']
  } satisfies SetTheoryConfig
};

/**
 * Validates a parameter stream's basic properties
 */
export function validateParameterStream(
  stream: ParameterStream,
  duration: number,
  sampleRate: number
): void {
  expect(stream).toBeDefined();
  expect(stream.parameters).toBeInstanceOf(Array);
  expect(stream.parameters.length).toBeGreaterThan(0);

  // Validate time range
  const times = stream.parameters.map(p => p.time);
  expect(Math.min(...times)).toBeCloseTo(0);
  expect(Math.max(...times)).toBeLessThanOrEqual(duration);

  // Validate parameter structure
  stream.parameters.forEach(validateParameter);

  // Validate metadata
  expect(stream.metadata).toBeDefined();
  expect(stream.metadata.timestamp).toBeDefined();
  expect(typeof stream.metadata.timestamp).toBe('number');
}

/**
 * Validates a single parameter's structure
 */
export function validateParameter(param: MathematicalParameter): void {
  expect(param.id).toBeDefined();
  expect(typeof param.id).toBe('string');
  expect(param.type).toBeDefined();
  expect(typeof param.type).toBe('string');
  expect(param.value).toBeDefined();
  expect(typeof param.value).toBe('number');
  expect(param.time).toBeDefined();
  expect(typeof param.time).toBe('number');
}

/**
 * Validates visualization data structure
 */
export function validateVisualization(
  viz: VisualizationData,
  width: number,
  height: number
): void {
  expect(viz).toBeDefined();
  expect(viz.type).toBeDefined();
  expect(['graph', 'matrix', 'waveform', 'spectrum']).toContain(viz.type);
  expect(viz.data).toBeInstanceOf(Array);
  expect(viz.dimensions).toEqual({ width, height });

  if (viz.labels) {
    expect(viz.labels).toBeInstanceOf(Array);
    expect(viz.labels.every(l => typeof l === 'string')).toBe(true);
  }

  if (viz.metadata) {
    expect(typeof viz.metadata).toBe('object');
  }
}

/**
 * Creates a sequence of evenly spaced time points
 */
export function createTimeSequence(
  duration: number,
  steps: number
): number[] {
  const timeStep = duration / (steps - 1);
  return Array.from({ length: steps }, (_, i) => i * timeStep);
}

/**
 * Validates that parameter values fall within expected ranges
 */
export function validateParameterRanges(
  params: MathematicalParameter[],
  min: number,
  max: number
): void {
  params.forEach(param => {
    expect(param.value).toBeGreaterThanOrEqual(min);
    expect(param.value).toBeLessThanOrEqual(max);
  });
}

/**
 * Calculates basic statistics for a parameter stream
 */
export function calculateStreamStatistics(stream: ParameterStream): {
  mean: number;
  variance: number;
  min: number;
  max: number;
} {
  const values = stream.parameters.map(p => p.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

  return {
    mean,
    variance,
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Checks for parameter continuity (no sudden jumps)
 */
export function checkParameterContinuity(
  params: MathematicalParameter[],
  maxJump: number
): boolean {
  for (let i = 1; i < params.length; i++) {
    const jump = Math.abs(params[i].value - params[i-1].value);
    if (jump > maxJump) {
      return false;
    }
  }
  return true;
}

/**
 * Validates consistent time step intervals
 */
export function validateTimeSteps(
  params: MathematicalParameter[],
  expectedStep: number,
  tolerance: number = 1e-6
): void {
  for (let i = 1; i < params.length; i++) {
    const step = params[i].time - params[i-1].time;
    expect(Math.abs(step - expectedStep)).toBeLessThan(tolerance);
  }
}
