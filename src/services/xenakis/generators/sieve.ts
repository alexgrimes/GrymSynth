import {
  SieveConfig,
  ParameterStream,
  VisualizationData,
  ValidationResult,
  MappingConstraints,
  AudioGenerationParameters,
  SieveOperation,
  MathematicalParameter
} from '../types';
import { MathematicalGenerator } from './base';

interface SievePoint {
  value: number;
  modulus: number;
  residue: number;
}

class Sieve {
  private points: Set<number>;

  constructor(modulus: number, residue: number, max: number) {
    this.points = new Set();
    for (let i = residue; i <= max; i += modulus) {
      this.points.add(i);
    }
  }

  static union(s1: Sieve, s2: Sieve): Sieve {
    const result = new Sieve(1, 0, 0); // dummy initialization
    result.points = new Set([...s1.points, ...s2.points]);
    return result;
  }

  static intersection(s1: Sieve, s2: Sieve): Sieve {
    const result = new Sieve(1, 0, 0); // dummy initialization
    result.points = new Set([...s1.points].filter(x => s2.points.has(x)));
    return result;
  }

  static complement(s: Sieve, max: number): Sieve {
    const result = new Sieve(1, 0, 0); // dummy initialization
    result.points = new Set();
    for (let i = 0; i <= max; i++) {
      if (!s.points.has(i)) {
        result.points.add(i);
      }
    }
    return result;
  }

  getPoints(): number[] {
    return Array.from(this.points).sort((a, b) => a - b);
  }

  contains(point: number): boolean {
    return this.points.has(point);
  }
}

export class SieveGenerator extends MathematicalGenerator<SieveConfig> {
  private sieve: Sieve;
  private maxValue: number;

  constructor(config: SieveConfig) {
    super(config);
    this.maxValue = this.calculateMaxValue();
    this.sieve = this.createSieve();
  }

  private calculateMaxValue(): number {
    const period = this.config.period || Math.max(...this.config.moduli);
    return Math.ceil(this.duration * this.sampleRate / period) * period;
  }

  private createSieve(): Sieve {
    // Create initial sieves
    const sieves = this.config.moduli.map((modulus, i) =>
      new Sieve(modulus, this.config.residues[i], this.maxValue)
    );

    // Apply operations in sequence
    return this.config.operations.reduce((result, operation, i) => {
      if (i === 0) return sieves[0];

      switch (operation) {
        case 'union':
          return Sieve.union(result, sieves[i]);
        case 'intersection':
          return Sieve.intersection(result, sieves[i]);
        case 'complement':
          return Sieve.complement(result, this.maxValue);
        default:
          throw new Error(`Unknown sieve operation: ${operation}`);
      }
    }, sieves[0]);
  }

  async generate(startTime: number = 0): Promise<ParameterStream> {
    const parameters: MathematicalParameter[] = [];
    const points = this.sieve.getPoints();
    const timeStep = 1 / this.sampleRate;

    for (let i = 0; i < points.length; i++) {
      const time = startTime + points[i] * timeStep;
      if (time > this.duration) break;

      parameters.push({
        id: `sieve-${i}`,
        type: 'sieve',
        value: 1, // Binary sieve: point exists or doesn't
        time
      });
    }

    return {
      parameters,
      metadata: {
        generator: 'sieve',
        config: this.config,
        timestamp: Date.now()
      }
    };
  }

  async visualize(width: number, height: number): Promise<VisualizationData> {
    const points = this.sieve.getPoints();
    const maxPoint = points[points.length - 1];
    const data: number[][] = [new Array(width).fill(0)];

    // Map points to visualization width
    points.forEach(point => {
      const x = Math.floor((point / maxPoint) * (width - 1));
      data[0][x] = 1;
    });

    // Add period markers if period is specified
    if (this.config.period) {
      const periodMarkers = new Array(width).fill(0);
      for (let i = 0; i * this.config.period <= maxPoint; i++) {
        const x = Math.floor((i * this.config.period / maxPoint) * (width - 1));
        periodMarkers[x] = 0.5;
      }
      data.push(periodMarkers);
    }

    return {
      type: 'graph',
      data,
      dimensions: { width, height },
      labels: ['Sieve Points', 'Period Markers'],
      metadata: {
        pointCount: points.length,
        period: this.config.period,
        moduli: this.config.moduli,
        residues: this.config.residues
      }
    };
  }

  validate(): ValidationResult {
    const commonValidation = this.validateCommon();
    const errors: string[] = [...(commonValidation.errors || [])];
    const warnings: string[] = [...(commonValidation.warnings || [])];

    // Validate moduli and residues
    if (this.config.moduli.length !== this.config.residues.length) {
      errors.push('Number of moduli must match number of residues');
    }

    if (this.config.moduli.some(m => m <= 0)) {
      errors.push('All moduli must be positive');
    }

    if (this.config.residues.some(r => r < 0)) {
      errors.push('All residues must be non-negative');
    }

    // Check that residues are less than their corresponding moduli
    for (let i = 0; i < this.config.moduli.length; i++) {
      if (this.config.residues[i] >= this.config.moduli[i]) {
        errors.push(`Residue ${this.config.residues[i]} must be less than modulus ${this.config.moduli[i]}`);
      }
    }

    // Validate period if specified
    if (this.config.period !== undefined && this.config.period <= 0) {
      errors.push('Period must be positive');
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

    // Calculate density of points
    const density = filteredParams.length / (this.duration * this.sampleRate);

    // Map density to audio parameters
    return {
      prompt: `Generated using sieve theory with moduli ${this.config.moduli.join(',')}`,
      guidanceScale: this.normalize(density, 1, 7),
      diffusionSteps: Math.round(this.normalize(density, 10, 50))
    };
  }

  dispose(): void {
    // No resources to clean up
  }
}
