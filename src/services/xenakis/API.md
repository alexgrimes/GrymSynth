# XenakisLDM API Documentation

## Core Service

### XenakisLDMService

Main service interface for interacting with the XenakisLDM system.

```typescript
class XenakisLDMService implements ModelService {
  async initialize(): Promise<void>;
  async executeTask(task: Task): Promise<TaskResult>;
  async getStatus(): Promise<ServiceStatus>;
  async getMetrics(): Promise<ServiceMetrics>;
  async shutdown(): Promise<void>;
}
```

### Factory

```typescript
class XenakisLDMServiceFactory {
  static async createService(
    config: XenakisConfig,
    audioLDM?: AudioLDMService
  ): Promise<XenakisLDMService>;

  static async getInstance(): Promise<XenakisLDMService>;
  static async destroyInstance(): Promise<void>;
  static getDefaultConfig(): XenakisConfig;
}
```

## Mathematical Generators

### Base Generator Interface

```typescript
abstract class MathematicalGenerator<T extends GeneratorConfig> {
  abstract generate(startTime?: number): Promise<ParameterStream>;
  abstract visualize(width: number, height: number): Promise<VisualizationData>;
  abstract validate(): ValidationResult;
  abstract mapToAudioParameters(
    params: ParameterStream,
    constraints?: MappingConstraints
  ): Promise<AudioGenerationParameters>;
}
```

### Stochastic Generator

```typescript
interface StochasticConfig extends GeneratorConfig {
  distribution: {
    type: 'gaussian' | 'poisson' | 'exponential';
    parameters: Record<string, number>;
  };
  range: { min: number; max: number };
  timeScale: number;
}

class StochasticGenerator extends MathematicalGenerator<StochasticConfig> {
  // Implementation of base methods
}
```

### Sieve Generator

```typescript
interface SieveConfig extends GeneratorConfig {
  moduli: number[];
  residues: number[];
  operations: ('union' | 'intersection' | 'complement')[];
  period?: number;
}

class SieveGenerator extends MathematicalGenerator<SieveConfig> {
  // Implementation of base methods
}
```

### Cellular Generator

```typescript
interface CellularAutomataConfig extends GeneratorConfig {
  rule: number;
  initialState: number[];
  dimensions: 1 | 2;
  neighborhoodSize: number;
}

class CellularGenerator extends MathematicalGenerator<CellularAutomataConfig> {
  // Implementation of base methods
}
```

### Game Theory Generator

```typescript
interface GameTheoryConfig extends GeneratorConfig {
  players: string[];
  strategies: Map<string, string[]>;
  payoffs: Map<string, Map<string, number>>;
  evolutionStrategy: 'nash' | 'cooperative' | 'competitive';
  steps: number;
}

class GameTheoryGenerator extends MathematicalGenerator<GameTheoryConfig> {
  // Implementation of base methods
}
```

### Set Theory Generator

```typescript
interface SetTheoryConfig extends GeneratorConfig {
  initialSet: number[];
  operations: string[];
  transformationSequence: string[];
}

class SetTheoryGenerator extends MathematicalGenerator<SetTheoryConfig> {
  // Implementation of base methods
}
```

## Types

### Configuration

```typescript
interface XenakisConfig {
  maxMemory: string;
  useWebAssembly: boolean;
  parameterPrecision: number;
  cachingEnabled: boolean;
  maxParallelGenerators: number;
}

interface GeneratorConfig {
  type: GeneratorType;
  duration: number;
  sampleRate: number;
}
```

### Parameters

```typescript
interface XenakisParameters {
  prompt: string;
  mathematical: {
    [key in GeneratorType]?: GeneratorConfig;
  };
  mapping: ParameterMapping[];
  constraints?: MappingConstraints;
}

interface ParameterMapping {
  source: {
    id: string;
    type: string;
    value: number;
    time: number;
  };
  target: string;
}
```

### Results

```typescript
interface GenerationResult {
  audio: Float32Array;
  sampleRate: number;
  duration: number;
  mathematicalStructure: ParameterStream;
  visualizationData: VisualizationData;
}

interface ParameterStream {
  parameters: MathematicalParameter[];
  metadata: {
    generator: string;
    config: GeneratorConfig;
    timestamp: number;
  };
}
```

## Usage Examples

### Basic Service Usage

```typescript
// Create service instance
const service = await XenakisLDMServiceFactory.createService({
  maxMemory: '4GB',
  useWebAssembly: true,
  parameterPrecision: 0.001,
  cachingEnabled: true,
  maxParallelGenerators: 4
});

// Execute generation task
const result = await service.executeTask({
  id: 'example-task',
  type: 'xenakis-generation',
  modelType: 'xenakis',
  priority: 'normal',
  data: {
    parameters: {
      prompt: 'Stochastic texture',
      mathematical: {
        stochastic: {
          type: 'stochastic',
          duration: 5,
          sampleRate: 44100,
          distribution: {
            type: 'gaussian',
            parameters: { mean: 0, stdDev: 1 }
          },
          range: { min: -1, max: 1 },
          timeScale: 1
        }
      },
      mapping: [
        {
          source: {
            id: 'density',
            type: 'stochastic',
            value: 0.5,
            time: 0
          },
          target: 'guidanceScale'
        }
      ]
    }
  }
});
```

### Generator Usage

```typescript
// Create and use a specific generator
const generator = new StochasticGenerator({
  type: 'stochastic',
  duration: 5,
  sampleRate: 44100,
  distribution: {
    type: 'gaussian',
    parameters: { mean: 0, stdDev: 1 }
  },
  range: { min: -1, max: 1 },
  timeScale: 1
});

const stream = await generator.generate();
const visualization = await generator.visualize(800, 400);
const audioParams = await generator.mapToAudioParameters(stream);
