import {
  StochasticConfig,
  ParameterStream,
  VisualizationData,
  ValidationResult,
  MappingConstraints,
  AudioGenerationParameters,
  DistributionType,
  MathematicalParameter
} from '../types';
import { MathematicalGenerator } from './base';

interface Distribution {
  generate(x: number): number;
  sample(): number;
  getMean(): number;
  getVariance(): number;
}

class GaussianDistribution implements Distribution {
  constructor(
    private readonly mu: number,
    private readonly sigma: number
  ) {}

  generate(x: number): number {
    return (1 / (this.sigma * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - this.mu) / this.sigma, 2));
  }

  sample(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return this.mu + this.sigma * z;
  }

  getMean(): number {
    return this.mu;
  }

  getVariance(): number {
    return this.sigma * this.sigma;
  }
}

class PoissonDistribution implements Distribution {
  constructor(private readonly lambda: number) {}

  generate(k: number): number {
    return (Math.pow(this.lambda, k) * Math.exp(-this.lambda)) /
           this.factorial(Math.floor(k));
  }

  sample(): number {
    const L = Math.exp(-this.lambda);
    let k = 0;
    let p = 1;

    do {
      k++;
      p *= Math.random();
    } while (p > L);

    return k - 1;
  }

  getMean(): number {
    return this.lambda;
  }

  getVariance(): number {
    return this.lambda;
  }

  private factorial(n: number): number {
    if (n === 0) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }
}

class ExponentialDistribution implements Distribution {
  constructor(private readonly rate: number) {}

  generate(x: number): number {
    return this.rate * Math.exp(-this.rate * x);
  }

  sample(): number {
    return -Math.log(Math.random()) / this.rate;
  }

  getMean(): number {
    return 1 / this.rate;
  }

  getVariance(): number {
    return 1 / (this.rate * this.rate);
  }
}

export class StochasticGenerator extends MathematicalGenerator<StochasticConfig> {
  private distribution: Distribution;
  private parameterCache: Map<number, number> = new Map();

  constructor(config: StochasticConfig) {
    super(config);
    this.distribution = this.createDistribution(
      config.distribution.type,
      config.distribution.parameters
    );
  }

  private createDistribution(type: DistributionType, params: Record<string, number>): Distribution {
    switch (type) {
      case 'gaussian':
        return new GaussianDistribution(
          params.mean || 0,
          params.stdDev || 1
        );
      case 'poisson':
        return new PoissonDistribution(
          params.lambda || 1
        );
      case 'exponential':
        return new ExponentialDistribution(
          params.rate || 1
        );
      case 'custom':
        throw new Error('Custom distributions not yet implemented');
      default:
        throw new Error(`Unknown distribution type: ${type}`);
    }
  }

  async generate(startTime: number = 0): Promise<ParameterStream> {
    const parameters: MathematicalParameter[] = [];
    const sampleCount = this.calculateSampleCount();
    const timeStep = this.duration / sampleCount;

    for (let i = 0; i < sampleCount; i++) {
      const time = startTime + i * timeStep;
      let value: number;

      // Check cache first
      if (this.parameterCache.has(i)) {
        value = this.parameterCache.get(i)!;
      } else {
        value = this.distribution.sample();
        // Normalize to configured range
        value = this.normalize(
          value,
          this.config.range.min,
          this.config.range.max
        );
        this.parameterCache.set(i, value);
      }

      parameters.push({
        id: `stochastic-${i}`,
        type: this.config.distribution.type,
        value,
        time
      });
    }

    return {
      parameters,
      metadata: {
        generator: 'stochastic',
        config: this.config,
        timestamp: Date.now()
      }
    };
  }

  async visualize(width: number, height: number): Promise<VisualizationData> {
    const data: number[][] = [];
    const resolution = width;
    const range = this.config.range;
    const step = (range.max - range.min) / resolution;

    // Generate distribution curve
    const curve: number[] = [];
    for (let i = 0; i < resolution; i++) {
      const x = range.min + i * step;
      curve.push(this.distribution.generate(x));
    }

    // Generate histogram of actual values
    const histogramBins = 50;
    const histogram = new Array(histogramBins).fill(0);
    const values = Array.from(this.parameterCache.values());
    const binSize = (range.max - range.min) / histogramBins;

    values.forEach(value => {
      const binIndex = Math.floor((value - range.min) / binSize);
      if (binIndex >= 0 && binIndex < histogramBins) {
        histogram[binIndex]++;
      }
    });

    data.push(curve);
    data.push(histogram);

    return {
      type: 'graph',
      data,
      dimensions: { width, height },
      labels: ['Distribution', 'Histogram'],
      metadata: {
        mean: this.distribution.getMean(),
        variance: this.distribution.getVariance(),
        range: this.config.range
      }
    };
  }

  validate(): ValidationResult {
    const commonValidation = this.validateCommon();
    const errors: string[] = [...(commonValidation.errors || [])];
    const warnings: string[] = [...(commonValidation.warnings || [])];

    if (this.config.range.min >= this.config.range.max) {
      errors.push('Range minimum must be less than maximum');
    }

    if (this.config.timeScale <= 0) {
      errors.push('Time scale must be positive');
    }

    const params = this.config.distribution.parameters;
    switch (this.config.distribution.type) {
      case 'gaussian':
        if (params.stdDev && params.stdDev <= 0) {
          errors.push('Standard deviation must be positive');
        }
        break;
      case 'poisson':
        if (params.lambda && params.lambda <= 0) {
          errors.push('Lambda must be positive');
        }
        break;
      case 'exponential':
        if (params.rate && params.rate <= 0) {
          errors.push('Rate must be positive');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async mapToAudioParameters(
    params: ParameterStream,
    constraints?: MappingConstraints
  ): Promise<AudioGenerationParameters> {
    // Filter parameters based on time constraints if provided
    let filteredParams = params.parameters;
    if (constraints?.timeRange) {
      filteredParams = filteredParams.filter(
        p => p.time >= constraints.timeRange!.min &&
            p.time <= constraints.timeRange!.max
      );
    }

    // Apply value constraints
    if (constraints?.valueRange) {
      filteredParams = filteredParams.map(p => ({
        ...p,
        value: Math.max(
          constraints.valueRange!.min,
          Math.min(constraints.valueRange!.max, p.value)
        )
      }));
    }

    // Remove forbidden values if specified
    if (constraints?.forbidden) {
      filteredParams = filteredParams.filter(
        p => !constraints.forbidden!.includes(p.value)
      );
    }

    // Calculate average values for AudioLDM parameters
    const avgValue = filteredParams.reduce((sum, p) => sum + p.value, 0) /
                    filteredParams.length;

    return {
      prompt: `Generated using ${this.config.distribution.type} distribution`,
      guidanceScale: this.normalize(avgValue, 1, 7),
      diffusionSteps: Math.round(this.normalize(avgValue, 10, 50))
    };
  }

  dispose(): void {
    this.parameterCache.clear();
  }
}
