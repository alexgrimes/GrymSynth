import { AudioPattern, AnalysisConfig } from '../types/audio';
import { PatternRepository } from '../../storage/PatternRepository';
import { HealthMonitor } from '../../monitoring/HealthMonitor';

export enum MotionType {
  // [Previous enum definitions remain the same...]
  ASCENT = 'ascent',
  DESCENT = 'descent',
  PLANE = 'plane',
  PARABOLA = 'parabola',
  OSCILLATION = 'oscillation',
  UNDULATION = 'undulation',
  ROTATION = 'rotation',
  SPIRAL = 'spiral',
  SPIN = 'spin',
  VORTEX = 'vortex',
  PERICENTRICITY = 'pericentricity',
  CENTRIFUGAL = 'centrifugal_motion',
  AGGLOMERATION = 'agglomeration',
  DISSIPATION = 'dissipation',
  DILATION = 'dilation',
  CONTRACTION = 'contraction',
  DIVERGENCE = 'divergence',
  CONVERGENCE = 'convergence'
}

// [Previous enum definitions remain the same...]
export enum OnsetType {
  ATTACK = 'attack',
  EMERGENCE = 'emergence',
  ANACRUSIS = 'anacrusis',
  UPBEAT = 'upbeat',
  DOWNBEAT = 'downbeat'
}

export enum ContinuantType {
  MAINTENANCE = 'maintenance',
  PROLONGATION = 'prolongation',
  STATEMENT = 'statement',
  PASSAGE = 'passage',
  TRANSITION = 'transition'
}

export enum TerminationType {
  RELEASE = 'release',
  RESOLUTION = 'resolution',
  CLOSURE = 'closure',
  DISAPPEARANCE = 'disappearance',
  PLANE = 'plane'
}

export interface SpectromorphologicalAnalysisResult {
  onset: {
    type: OnsetType;
    confidence: number;
  };
  continuant: {
    type: ContinuantType;
    confidence: number;
  };
  termination: {
    type: TerminationType;
    confidence: number;
  };
  motionTypes: {
    type: MotionType;
    confidence: number;
  }[];
  spectrumType: string;
  gestureTextureBalance: number;
  energyProfile: number[];
  confidence: number;
}

export class SpectromorphologicalAnalyzer {
  constructor(
    private repository: PatternRepository,
    private healthMonitor: HealthMonitor
  ) {}

  /**
   * Convert input features to Float32Array
   */
  private ensureFloat32Array(features: number[] | Float32Array): Float32Array {
    if (features instanceof Float32Array) {
      return features;
    }
    return new Float32Array(features);
  }

  /**
   * Analyze spectromorphological characteristics of a pattern
   */
  async analyzePattern(
    patternId: string,
    config?: AnalysisConfig
  ): Promise<SpectromorphologicalAnalysisResult> {
    try {
      // Load pattern
      const pattern = await this.repository.getPatternById(patternId);
      if (!pattern) {
        throw new Error(`Pattern not found: ${patternId}`);
      }

      if (!pattern.features) {
        throw new Error(`Pattern ${patternId} has no features`);
      }

      // Convert features to Float32Array
      const features = this.ensureFloat32Array(pattern.features);
      const augmentedPattern = { ...pattern, features };

      // Analyze onset type
      const onsetAnalysis = await this.analyzeOnset(augmentedPattern);

      // Analyze continuant type
      const continuantAnalysis = await this.analyzeContinuant(augmentedPattern);

      // Analyze termination type
      const terminationAnalysis = await this.analyzeTermination(augmentedPattern);

      // Analyze motion types
      const motionAnalysis = await this.analyzeMotion(augmentedPattern);

      // Analyze spectrum type
      const spectrumType = await this.analyzeSpectrumType(augmentedPattern);

      // Analyze gesture-texture balance
      const gestureTextureBalance = await this.analyzeGestureTextureBalance(augmentedPattern);

      // Generate energy profile
      const energyProfile = await this.generateEnergyProfile(augmentedPattern);

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(
        onsetAnalysis.confidence,
        continuantAnalysis.confidence,
        terminationAnalysis.confidence,
        motionAnalysis.map(m => m.confidence)
      );

      // Record metrics
      this.healthMonitor.recordMetric('analysis.spectromorphological.complete', {
        patternId,
        onset: onsetAnalysis.type,
        continuant: continuantAnalysis.type,
        termination: terminationAnalysis.type,
        confidence
      });

      return {
        onset: onsetAnalysis,
        continuant: continuantAnalysis,
        termination: terminationAnalysis,
        motionTypes: motionAnalysis,
        spectrumType,
        gestureTextureBalance,
        energyProfile,
        confidence
      };
    } catch (error) {
      this.healthMonitor.recordMetric('analysis.spectromorphological.error', {
        patternId,
        error: String(error)
      });
      throw error;
    }
  }

  // [Previous private analysis methods remain the same...]
  private async analyzeOnset(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<{ type: OnsetType; confidence: number }> {
    const onsetSegment = this.extractOnsetSegment(pattern.features);
    const spectralFlux = this.calculateSpectralFlux(onsetSegment);
    const amplitudeEnvelope = this.calculateAmplitudeEnvelope(onsetSegment);

    if (spectralFlux > 0.8) {
      return { type: OnsetType.ATTACK, confidence: 0.9 };
    } else if (spectralFlux > 0.5) {
      return { type: OnsetType.EMERGENCE, confidence: 0.8 };
    } else {
      return { type: OnsetType.ANACRUSIS, confidence: 0.7 };
    }
  }

  private async analyzeContinuant(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<{ type: ContinuantType; confidence: number }> {
    const continuantSegment = this.extractContinuantSegment(pattern.features);
    const stability = this.calculateSpectralStability(continuantSegment);
    const variation = this.calculateSpectralVariation(continuantSegment);

    if (stability > 0.8) {
      return { type: ContinuantType.MAINTENANCE, confidence: 0.85 };
    } else if (variation > 0.6) {
      return { type: ContinuantType.TRANSITION, confidence: 0.75 };
    } else {
      return { type: ContinuantType.PROLONGATION, confidence: 0.7 };
    }
  }

  private async analyzeTermination(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<{ type: TerminationType; confidence: number }> {
    const terminationSegment = this.extractTerminationSegment(pattern.features);
    const decay = this.calculateEnergyDecay(terminationSegment);
    const spectralChange = this.calculateSpectralChange(terminationSegment);

    if (decay > 0.8) {
      return { type: TerminationType.RELEASE, confidence: 0.85 };
    } else if (spectralChange > 0.6) {
      return { type: TerminationType.RESOLUTION, confidence: 0.8 };
    } else {
      return { type: TerminationType.DISAPPEARANCE, confidence: 0.75 };
    }
  }

  private async analyzeMotion(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<{ type: MotionType; confidence: number }[]> {
    const centroidTrajectory = this.calculateSpectralCentroidTrajectory(pattern.features);
    const energyFlow = this.calculateEnergyFlow(pattern.features);

    const motionTypes: { type: MotionType; confidence: number }[] = [];

    if (this.detectAscending(centroidTrajectory)) {
      motionTypes.push({ type: MotionType.ASCENT, confidence: 0.85 });
    }

    if (this.detectOscillating(centroidTrajectory)) {
      motionTypes.push({ type: MotionType.OSCILLATION, confidence: 0.8 });
    }

    return motionTypes;
  }

  // [Previous helper methods remain the same...]
  private async analyzeSpectrumType(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<string> {
    const harmonicContent = this.calculateHarmonicContent(pattern.features);
    const noiseContent = this.calculateNoiseContent(pattern.features);

    if (harmonicContent > 0.7) {
      return 'harmonic';
    } else if (noiseContent > 0.7) {
      return 'noise';
    } else {
      return 'inharmonic';
    }
  }

  private async analyzeGestureTextureBalance(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<number> {
    const temporalEvolution = this.calculateTemporalEvolution(pattern.features);
    const spectralStability = this.calculateSpectralStability(pattern.features);
    const morphologicalPredictability = this.calculateMorphologicalPredictability(pattern.features);

    return (temporalEvolution + spectralStability + morphologicalPredictability) / 3;
  }

  private async generateEnergyProfile(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<number[]> {
    return this.calculateRMSEnergyProfile(pattern.features);
  }

  // [Rest of the helper methods remain the same...]
  private calculateOverallConfidence(
    onsetConfidence: number,
    continuantConfidence: number,
    terminationConfidence: number,
    motionConfidences: number[]
  ): number {
    const avgMotionConfidence = motionConfidences.length > 0 ?
      motionConfidences.reduce((sum, c) => sum + c, 0) / motionConfidences.length : 0;

    return (
      (onsetConfidence * 0.25) +
      (continuantConfidence * 0.25) +
      (terminationConfidence * 0.25) +
      (avgMotionConfidence * 0.25)
    );
  }

  // [Previous feature extraction and analysis helper methods remain the same...]
  private extractOnsetSegment(features: Float32Array): Float32Array {
    const onsetLength = Math.floor(features.length * 0.15);
    return features.slice(0, onsetLength);
  }

  private extractContinuantSegment(features: Float32Array): Float32Array {
    const start = Math.floor(features.length * 0.2);
    const end = Math.floor(features.length * 0.8);
    return features.slice(start, end);
  }

  private extractTerminationSegment(features: Float32Array): Float32Array {
    const terminationStart = Math.floor(features.length * 0.8);
    return features.slice(terminationStart);
  }

  private calculateSpectralFlux(features: Float32Array): number {
    let flux = 0;
    for (let i = 1; i < features.length; i++) {
      flux += Math.abs(features[i] - features[i - 1]);
    }
    return flux / features.length;
  }

  private calculateAmplitudeEnvelope(features: Float32Array): number[] {
    const windowSize = 32;
    const envelope: number[] = [];

    for (let i = 0; i < features.length; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize && (i + j) < features.length; j++) {
        sum += features[i + j] * features[i + j];
      }
      envelope.push(Math.sqrt(sum / windowSize));
    }

    return envelope;
  }

  private calculateSpectralStability(features: Float32Array): number {
    let stability = 0;
    for (let i = 1; i < features.length; i++) {
      stability += 1 - Math.abs(features[i] - features[i - 1]);
    }
    return stability / (features.length - 1);
  }

  private calculateSpectralVariation(features: Float32Array): number {
    const mean = features.reduce((a, b) => a + b) / features.length;
    const variance = features.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / features.length;
    return Math.sqrt(variance);
  }

  private calculateSpectralCentroidTrajectory(features: Float32Array): number[] {
    const windowSize = 32;
    const trajectory: number[] = [];

    for (let i = 0; i < features.length; i += windowSize) {
      const window = features.slice(i, i + windowSize);
      const centroid = this.calculateSpectralCentroid(window);
      trajectory.push(centroid);
    }

    return trajectory;
  }

  private calculateSpectralCentroid(window: Float32Array): number {
    let weightedSum = 0;
    let sum = 0;

    for (let i = 0; i < window.length; i++) {
      weightedSum += window[i] * i;
      sum += window[i];
    }

    return sum !== 0 ? weightedSum / sum : 0;
  }

  private calculateEnergyFlow(features: Float32Array): number[] {
    return this.calculateAmplitudeEnvelope(features);
  }

  private detectAscending(trajectory: number[]): boolean {
    let ascending = 0;
    for (let i = 1; i < trajectory.length; i++) {
      if (trajectory[i] > trajectory[i - 1]) ascending++;
    }
    return ascending / (trajectory.length - 1) > 0.6;
  }

  private detectOscillating(trajectory: number[]): boolean {
    let changes = 0;
    let increasing = trajectory[1] > trajectory[0];

    for (let i = 2; i < trajectory.length; i++) {
      const currentlyIncreasing = trajectory[i] > trajectory[i - 1];
      if (currentlyIncreasing !== increasing) {
        changes++;
        increasing = currentlyIncreasing;
      }
    }

    return changes > trajectory.length * 0.2;
  }

  private calculateEnergyDecay(features: Float32Array): number {
    const envelope = this.calculateAmplitudeEnvelope(features);
    let decay = 0;

    for (let i = 1; i < envelope.length; i++) {
      decay += envelope[i - 1] - envelope[i];
    }

    return decay / envelope.length;
  }

  private calculateSpectralChange(features: Float32Array): number {
    return this.calculateSpectralFlux(features);
  }

  private calculateHarmonicContent(features: Float32Array): number {
    return Math.random(); // Placeholder implementation
  }

  private calculateNoiseContent(features: Float32Array): number {
    return 1 - this.calculateHarmonicContent(features);
  }

  private calculateTemporalEvolution(features: Float32Array): number {
    return this.calculateSpectralFlux(features);
  }

  private calculateMorphologicalPredictability(features: Float32Array): number {
    return this.calculateSpectralStability(features);
  }

  private calculateRMSEnergyProfile(features: Float32Array): number[] {
    return this.calculateAmplitudeEnvelope(features);
  }
}
