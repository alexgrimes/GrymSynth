import {
  SetTheoryConfig,
  ParameterStream,
  VisualizationData,
  ValidationResult,
  MappingConstraints,
  AudioGenerationParameters,
  SetOperation,
  MathematicalParameter
} from '../types';
import { MathematicalGenerator } from './base';

class PitchClassSet {
  private normalForm: number[];

  constructor(pitchClasses: number[]) {
    // Initialize with normalized pitch classes (mod 12)
    this.normalForm = this.normalize(pitchClasses);
  }

  private normalize(pitchClasses: number[]): number[] {
    // Convert to pitch classes mod 12 and sort
    return [...new Set(pitchClasses.map(pc => ((pc % 12) + 12) % 12))]
      .sort((a, b) => a - b);
  }

  transpose(semitones: number): PitchClassSet {
    const transposed = this.normalForm.map(pc =>
      ((pc + semitones) % 12 + 12) % 12
    );
    return new PitchClassSet(transposed);
  }

  invert(): PitchClassSet {
    const inverted = this.normalForm.map(pc => (12 - pc) % 12);
    return new PitchClassSet(inverted);
  }

  retrograde(): PitchClassSet {
    return new PitchClassSet([...this.normalForm].reverse());
  }

  getPitchClasses(): number[] {
    return [...this.normalForm];
  }

  size(): number {
    return this.normalForm.length;
  }

  equals(other: PitchClassSet): boolean {
    if (this.size() !== other.size()) return false;
    return this.normalForm.every((pc, i) => pc === other.normalForm[i]);
  }
}

export class SetTheoryGenerator extends MathematicalGenerator<SetTheoryConfig> {
  private currentSet: PitchClassSet;
  private transformationHistory: PitchClassSet[] = [];

  constructor(config: SetTheoryConfig) {
    super(config);
    this.currentSet = new PitchClassSet(config.initialSet);
    this.transformationHistory.push(this.currentSet);
  }

  private applyTransformation(set: PitchClassSet, operation: string): PitchClassSet {
    const [op, value] = operation.split(':');
    switch (op as SetOperation) {
      case 'transpose':
        return set.transpose(parseInt(value) || 0);
      case 'invert':
        return set.invert();
      case 'retrograde':
        return set.retrograde();
      default:
        throw new Error(`Unknown set operation: ${op}`);
    }
  }

  private generateTransformations(): void {
    this.transformationHistory = [this.currentSet];

    for (const operation of this.config.transformationSequence) {
      const lastSet = this.transformationHistory[this.transformationHistory.length - 1];
      const transformed = this.applyTransformation(lastSet, operation);
      this.transformationHistory.push(transformed);
    }
  }

  async generate(startTime: number = 0): Promise<ParameterStream> {
    const parameters: MathematicalParameter[] = [];
    this.generateTransformations();

    const timeStep = this.duration / (this.transformationHistory.length - 1);

    this.transformationHistory.forEach((set, index) => {
      const time = startTime + index * timeStep;

      // Convert pitch classes to parameters
      set.getPitchClasses().forEach((pc, pcIndex) => {
        parameters.push({
          id: `set-${index}-${pcIndex}`,
          type: 'set',
          value: pc / 12, // Normalize to [0,1]
          time
        });
      });
    });

    return {
      parameters,
      metadata: {
        generator: 'set',
        config: this.config,
        timestamp: Date.now()
      }
    };
  }

  async visualize(width: number, height: number): Promise<VisualizationData> {
    // Create a pitch class matrix visualization
    const data: number[][] = Array(12).fill(0).map(() => Array(this.transformationHistory.length).fill(0));

    // Fill the matrix with set memberships
    this.transformationHistory.forEach((set, timeIndex) => {
      const pitchClasses = set.getPitchClasses();
      pitchClasses.forEach(pc => {
        data[pc][timeIndex] = 1;
      });
    });

    return {
      type: 'matrix',
      data,
      dimensions: { width, height },
      labels: [
        'Pitch Classes (0-11)',
        'Transformations'
      ],
      metadata: {
        setSize: this.currentSet.size(),
        transformationCount: this.config.transformationSequence.length,
        initialSet: this.config.initialSet
      }
    };
  }

  validate(): ValidationResult {
    const commonValidation = this.validateCommon();
    const errors: string[] = [...(commonValidation.errors || [])];
    const warnings: string[] = [...(commonValidation.warnings || [])];

    if (this.config.initialSet.length === 0) {
      errors.push('Initial set cannot be empty');
    }

    if (this.config.initialSet.some(pc => !Number.isInteger(pc))) {
      errors.push('All pitch classes must be integers');
    }

    if (this.config.transformationSequence.length === 0) {
      errors.push('At least one transformation is required');
    }

    // Validate transformation sequence format
    this.config.transformationSequence.forEach((transform, i) => {
      const [op, value] = transform.split(':');
      if (!['transpose', 'invert', 'retrograde'].includes(op)) {
        errors.push(`Invalid transformation operation at index ${i}: ${op}`);
      }
      if (op === 'transpose' && (isNaN(Number(value)) || !Number.isInteger(Number(value)))) {
        errors.push(`Invalid transposition value at index ${i}: ${value}`);
      }
    });

    // Check for potential redundancy in transformations
    const uniqueSets = new Set(
      this.transformationHistory.map(set =>
        set.getPitchClasses().join(',')
      )
    );
    if (uniqueSets.size < this.transformationHistory.length) {
      warnings.push('Some transformations result in duplicate sets');
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

    // Calculate set-theoretical properties
    const setDensity = this.currentSet.size() / 12; // Normalized cardinality
    const uniqueValues = new Set(filteredParams.map(p => p.value)).size;
    const complexity = uniqueValues / filteredParams.length;

    return {
      prompt: `Generated using set theory operations on pitch class set [${this.config.initialSet.join(',')}]`,
      guidanceScale: this.normalize(setDensity, 1, 7),
      diffusionSteps: Math.round(this.normalize(complexity, 10, 50))
    };
  }

  dispose(): void {
    this.transformationHistory = [];
  }
}
