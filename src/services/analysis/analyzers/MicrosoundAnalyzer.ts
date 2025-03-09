import { AudioPattern, AnalysisConfig } from '../types/audio';
import { PatternRepository } from '../../storage/PatternRepository';
import { HealthMonitor } from '../../monitoring/HealthMonitor';

export enum TimeScale {
  INFINITE = 'infinite',
  SUPRA = 'supra',
  MACRO = 'macro',
  MESO = 'meso',
  SOUND_OBJECT = 'sound_object',
  MICRO = 'micro',
  SAMPLE = 'sample',
  SUBSAMPLE = 'subsample',
  INFINITESIMAL = 'infinitesimal'
}

export interface GrainProperties {
  duration: number;       // in milliseconds
  density: number;        // grains per second
  synchronicity: number;  // 0 = async, 1 = sync
  periodicity: number;    // 0 = aperiodic, 1 = periodic
  frequencySpread: number;
  amplitudeSpread: number;
  spatialSpread: number;
}

export interface GrainCloud {
  startTime: number;
  endTime: number;
  density: number;
  centroid: number;
  spread: number;
  grains: { time: number; frequency: number; amplitude: number; duration: number }[];
}

export interface MicrosoundAnalysisResult {
  dominantTimeScales: TimeScale[];
  grainProperties: GrainProperties;
  clouds: GrainCloud[];
  particleStatistics: {
    count: number;
    meanDuration: number;
    durationalVariance: number;
    meanDensity: number;
    densityEvolution: number[];
  };
  textureType: 'synchronous' | 'asynchronous' | 'quasi-synchronous';
  formantStructure: boolean;
  confidence: number;
}

export class MicrosoundAnalyzer {
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
   * Analyze microsound characteristics of a pattern
   */
  async analyzePattern(
    patternId: string,
    config?: AnalysisConfig
  ): Promise<MicrosoundAnalysisResult> {
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

      // Identify dominant time scales
      const timeScales = await this.identifyTimeScales(augmentedPattern);

      // Analyze grain properties
      const grainProperties = await this.analyzeGrainProperties(augmentedPattern);

      // Detect grain clouds
      const clouds = await this.detectGrainClouds(augmentedPattern);

      // Calculate particle statistics
      const particleStatistics = await this.calculateParticleStatistics(
        augmentedPattern,
        clouds
      );

      // Determine texture type
      const textureType = await this.determineTextureType(
        grainProperties,
        clouds
      );

      // Check for formant structure
      const formantStructure = await this.detectFormantStructure(augmentedPattern);

      // Calculate confidence
      const confidence = this.calculateConfidence(
        augmentedPattern,
        grainProperties,
        clouds
      );

      // Record metrics
      this.healthMonitor.recordMetric('analysis.microsound.complete', {
        patternId,
        timeScales: timeScales.join(','),
        grainCount: particleStatistics.count,
        confidence
      });

      return {
        dominantTimeScales: timeScales,
        grainProperties,
        clouds,
        particleStatistics,
        textureType,
        formantStructure,
        confidence
      };
    } catch (error) {
      this.healthMonitor.recordMetric('analysis.microsound.error', {
        patternId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Identify time scales present in the pattern
   */
  private async identifyTimeScales(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<TimeScale[]> {
    const timeScales: TimeScale[] = [];
    const features = pattern.features;

    // Calculate various temporal statistics
    const microTimePeriods = this.detectMicroTimePeriods(features);
    const mesoTimePeriods = this.detectMesoTimePeriods(features);
    const macroTimePeriods = this.detectMacroTimePeriods(features);

    // Add detected scales based on thresholds
    if (microTimePeriods.length > 0) {
      timeScales.push(TimeScale.MICRO);
    }
    if (mesoTimePeriods.length > 0) {
      timeScales.push(TimeScale.MESO);
    }
    if (macroTimePeriods.length > 0) {
      timeScales.push(TimeScale.MACRO);
    }

    timeScales.push(TimeScale.SOUND_OBJECT); // Always present at analysis level

    return timeScales;
  }

  /**
   * Analyze granular properties of a pattern
   */
  private async analyzeGrainProperties(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<GrainProperties> {
    const grainSegments = this.detectGrainSegments(pattern.features);

    // Calculate grain properties
    const durations = grainSegments.map(g => g.duration);
    const meanDuration = this.calculateMean(durations);

    const density = this.calculateGrainDensity(grainSegments, pattern.endTime - pattern.startTime);
    const synchronicity = this.calculateSynchronicity(grainSegments);
    const periodicity = this.calculatePeriodicity(grainSegments);

    const frequencyAnalysis = this.analyzeGrainFrequencies(grainSegments);
    const amplitudeAnalysis = this.analyzeGrainAmplitudes(grainSegments);
    const spatialAnalysis = this.analyzeGrainSpatialDistribution(grainSegments);

    return {
      duration: meanDuration,
      density,
      synchronicity,
      periodicity,
      frequencySpread: frequencyAnalysis.spread,
      amplitudeSpread: amplitudeAnalysis.spread,
      spatialSpread: spatialAnalysis.spread
    };
  }

  /**
   * Detect grain clouds in a pattern
   */
  private async detectGrainClouds(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<GrainCloud[]> {
    const grainSegments = this.detectGrainSegments(pattern.features);
    const clouds: GrainCloud[] = [];

    // Group grains into clouds based on temporal and spectral proximity
    let currentCloud: GrainCloud | null = null;

    for (const grain of grainSegments) {
      if (!currentCloud) {
        currentCloud = this.initializeCloud(grain);
      } else if (this.belongsToCloud(grain, currentCloud)) {
        this.addGrainToCloud(grain, currentCloud);
      } else {
        clouds.push(currentCloud);
        currentCloud = this.initializeCloud(grain);
      }
    }

    if (currentCloud && currentCloud.grains.length > 0) {
      clouds.push(currentCloud);
    }

    return clouds;
  }

  /**
   * Calculate statistics about microsonic particles
   */
  private async calculateParticleStatistics(
    pattern: AudioPattern & { features: Float32Array },
    clouds: GrainCloud[]
  ): Promise<{
    count: number;
    meanDuration: number;
    durationalVariance: number;
    meanDensity: number;
    densityEvolution: number[];
  }> {
    const grainSegments = this.detectGrainSegments(pattern.features);

    // Calculate basic statistics
    const durations = grainSegments.map(g => g.duration);
    const meanDuration = this.calculateMean(durations);
    const durationalVariance = this.calculateVariance(durations, meanDuration);

    // Calculate density evolution over time
    const densityEvolution = this.calculateDensityEvolution(clouds);
    const meanDensity = this.calculateMean(densityEvolution);

    return {
      count: grainSegments.length,
      meanDuration,
      durationalVariance,
      meanDensity,
      densityEvolution
    };
  }

  /**
   * Determine texture type based on grain synchronicity
   */
  private async determineTextureType(
    grainProperties: GrainProperties,
    clouds: GrainCloud[]
  ): Promise<'synchronous' | 'asynchronous' | 'quasi-synchronous'> {
    if (grainProperties.synchronicity < 0.3) {
      return 'asynchronous';
    } else if (grainProperties.synchronicity > 0.7) {
      return 'synchronous';
    } else {
      return 'quasi-synchronous';
    }
  }

  /**
   * Detect formant structure in granular material
   */
  private async detectFormantStructure(
    pattern: AudioPattern & { features: Float32Array }
  ): Promise<boolean> {
    // Analyze spectral peaks for formant-like structures
    const formantLikelihood = this.analyzeFormantLikelihood(pattern.features);
    return formantLikelihood > 0.7;
  }

  /**
   * Calculate analysis confidence
   */
  private calculateConfidence(
    pattern: AudioPattern & { features: Float32Array },
    grainProperties: GrainProperties,
    clouds: GrainCloud[]
  ): number {
    // Calculate confidence based on multiple factors
    const signalQuality = this.assessSignalQuality(pattern.features);
    const grainClarity = this.assessGrainClarity(grainProperties);
    const cloudCoherence = this.assessCloudCoherence(clouds);

    return (signalQuality + grainClarity + cloudCoherence) / 3;
  }

  // Helper methods for microsound analysis
  private detectGrainSegments(features: Float32Array): Array<{
    startTime: number;
    duration: number;
    amplitude: number;
    frequency: number;
  }> {
    // Placeholder implementation
    // Real implementation would use advanced signal processing to detect grains
    return [
      {
        startTime: 0,
        duration: 10,
        amplitude: 0.8,
        frequency: 440
      }
    ];
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateVariance(values: number[], mean: number): number {
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  }

  private calculateGrainDensity(
    grains: Array<{ startTime: number; duration: number }>,
    totalDuration: number
  ): number {
    return grains.length / totalDuration;
  }

  private calculateSynchronicity(
    grains: Array<{ startTime: number }>
  ): number {
    // Placeholder implementation
    return 0.5;
  }

  private calculatePeriodicity(
    grains: Array<{ startTime: number }>
  ): number {
    // Placeholder implementation
    return 0.5;
  }

  private analyzeGrainFrequencies(
    grains: Array<{ frequency: number }>
  ): { spread: number } {
    // Placeholder implementation
    return { spread: 0.5 };
  }

  private analyzeGrainAmplitudes(
    grains: Array<{ amplitude: number }>
  ): { spread: number } {
    // Placeholder implementation
    return { spread: 0.3 };
  }

  private analyzeGrainSpatialDistribution(
    grains: Array<any>
  ): { spread: number } {
    // Placeholder implementation
    return { spread: 0.2 };
  }

  private initializeCloud(firstGrain: {
    startTime: number;
    duration: number;
    amplitude: number;
    frequency: number;
  }): GrainCloud {
    return {
      startTime: firstGrain.startTime,
      endTime: firstGrain.startTime + firstGrain.duration,
      density: 1,
      centroid: firstGrain.frequency,
      spread: 0,
      grains: [{
        time: firstGrain.startTime,
        frequency: firstGrain.frequency,
        amplitude: firstGrain.amplitude,
        duration: firstGrain.duration
      }]
    };
  }

  private belongsToCloud(
    grain: { startTime: number; frequency: number },
    cloud: GrainCloud
  ): boolean {
    const temporalThreshold = 50; // ms
    const spectralThreshold = 200; // Hz

    return (
      Math.abs(grain.startTime - cloud.endTime) < temporalThreshold &&
      Math.abs(grain.frequency - cloud.centroid) < spectralThreshold
    );
  }

  private addGrainToCloud(
    grain: {
      startTime: number;
      duration: number;
      frequency: number;
      amplitude: number;
    },
    cloud: GrainCloud
  ): void {
    cloud.grains.push({
      time: grain.startTime,
      frequency: grain.frequency,
      amplitude: grain.amplitude,
      duration: grain.duration
    });

    cloud.endTime = Math.max(cloud.endTime, grain.startTime + grain.duration);
    cloud.density = cloud.grains.length / (cloud.endTime - cloud.startTime);

    // Update centroid and spread
    this.updateCloudProperties(cloud);
  }

  private updateCloudProperties(cloud: GrainCloud): void {
    // Update spectral centroid
    const frequencies = cloud.grains.map(g => g.frequency);
    cloud.centroid = this.calculateMean(frequencies);

    // Update spectral spread
    cloud.spread = Math.sqrt(this.calculateVariance(frequencies, cloud.centroid));
  }

  private calculateDensityEvolution(clouds: GrainCloud[]): number[] {
    // Placeholder implementation
    return clouds.map(c => c.density);
  }

  private detectMicroTimePeriods(features: Float32Array): number[] {
    // Placeholder implementation
    return [1, 2, 3];
  }

  private detectMesoTimePeriods(features: Float32Array): number[] {
    // Placeholder implementation
    return [10, 20];
  }

  private detectMacroTimePeriods(features: Float32Array): number[] {
    // Placeholder implementation
    return [100];
  }

  private analyzeFormantLikelihood(features: Float32Array): number {
    // Placeholder implementation
    return 0.8;
  }

  private assessSignalQuality(features: Float32Array): number {
    // Placeholder implementation
    return 0.9;
  }

  private assessGrainClarity(properties: GrainProperties): number {
    // Placeholder implementation
    return 0.85;
  }

  private assessCloudCoherence(clouds: GrainCloud[]): number {
    // Placeholder implementation
    return 0.8;
  }
}
