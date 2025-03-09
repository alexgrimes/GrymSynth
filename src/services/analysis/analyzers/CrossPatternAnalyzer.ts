import { AudioPattern, AnalysisConfig } from '../types/audio';
import { PatternRepository } from '../../storage/PatternRepository';
import { IntegratedPatternAnalyzer } from './IntegratedPatternAnalyzer';
import { HealthMonitor } from '../../monitoring/HealthMonitor';

export interface PatternRelationship {
  sourcePatternId: string;
  targetPatternId: string;
  relationshipType: 'similarity' | 'transformation' | 'contrast' | 'derivative';
  transformationType?: string;
  strength: number;
  description: string;
}

export interface PatternEvolutionChain {
  basePatternId: string;
  evolutionSteps: {
    patternId: string;
    timestamp: Date;
    transformationDescription: string;
    similarityScore: number;
  }[];
  confidence: number;
}

export interface SharedMotif {
  motifId: string;
  patternIds: string[];
  description: string;
  confidence: number;
  features: {
    spectral: number[];
    temporal: number[];
    morphological: number[];
  };
}

export interface CrossPatternAnalysisResult {
  patternRelationships: PatternRelationship[];
  evolutionChains: PatternEvolutionChain[];
  sharedMotifs: SharedMotif[];
  confidence: number;
}

export class CrossPatternAnalyzer {
  constructor(
    private repository: PatternRepository,
    private integratedAnalyzer: IntegratedPatternAnalyzer,
    private healthMonitor: HealthMonitor
  ) {}

  /**
   * Convert input features to Float32Array
   */
  private ensureFloat32Array(features: number[] | Float32Array | undefined): Float32Array {
    if (!features) {
      return new Float32Array();
    }
    if (features instanceof Float32Array) {
      return features;
    }
    return new Float32Array(features);
  }

  /**
   * Analyze relationships between multiple patterns
   */
  async analyzePatternRelationships(
    patternIds: string[],
    config?: AnalysisConfig
  ): Promise<CrossPatternAnalysisResult> {
    try {
      // Load patterns
      const patterns = await this.loadPatterns(patternIds);

      // Get integrated analysis for each pattern
      const analysisResults = await this.getPatternAnalyses(patternIds);

      // Identify pattern relationships
      const relationships = await this.identifyRelationships(
        patterns,
        analysisResults
      );

      // Identify evolution chains
      const evolutionChains = await this.identifyEvolutionChains(
        patterns,
        analysisResults
      );

      // Identify shared motifs
      const sharedMotifs = await this.identifySharedMotifs(
        patterns,
        analysisResults
      );

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(
        relationships,
        evolutionChains,
        sharedMotifs
      );

      // Record metrics
      this.healthMonitor.recordMetric('analysis.cross_pattern.complete', {
        patternCount: patternIds.length,
        relationshipCount: relationships.length,
        evolutionChainCount: evolutionChains.length,
        sharedMotifCount: sharedMotifs.length,
        confidence
      });

      return {
        patternRelationships: relationships,
        evolutionChains,
        sharedMotifs,
        confidence
      };
    } catch (error) {
      this.healthMonitor.recordMetric('analysis.cross_pattern.error', {
        patternCount: patternIds.length,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Load patterns by IDs
   */
  private async loadPatterns(patternIds: string[]): Promise<Map<string, AudioPattern>> {
    const patterns = new Map<string, AudioPattern>();

    for (const id of patternIds) {
      const pattern = await this.repository.getPatternById(id);
      if (pattern) {
        patterns.set(id, {
          ...pattern,
          features: this.ensureFloat32Array(pattern.features)
        });
      }
    }

    return patterns;
  }

  /**
   * Get integrated analysis results for multiple patterns
   */
  private async getPatternAnalyses(
    patternIds: string[]
  ): Promise<Map<string, any>> {
    const analyses = new Map<string, any>();

    for (const id of patternIds) {
      try {
        const analysis = await this.integratedAnalyzer.analyzePattern(id);
        analyses.set(id, analysis);
      } catch (error) {
        this.healthMonitor.recordMetric('analysis.cross_pattern.analysis_error', {
          patternId: id,
          error: String(error)
        });
      }
    }

    return analyses;
  }

  /**
   * Identify relationships between patterns
   */
  private async identifyRelationships(
    patterns: Map<string, AudioPattern>,
    analyses: Map<string, any>
  ): Promise<PatternRelationship[]> {
    const relationships: PatternRelationship[] = [];
    const patternIds = Array.from(patterns.keys());

    // Compare each pattern with every other pattern
    for (let i = 0; i < patternIds.length; i++) {
      for (let j = i + 1; j < patternIds.length; j++) {
        const sourcePattern = patterns.get(patternIds[i]);
        const targetPattern = patterns.get(patternIds[j]);

        if (!sourcePattern || !targetPattern) continue;

        const sourceAnalysis = analyses.get(patternIds[i]);
        const targetAnalysis = analyses.get(patternIds[j]);

        if (!sourceAnalysis || !targetAnalysis) continue;

        // Identify potential relationships
        const relationshipResults = await this.identifyPotentialRelationships(
          sourcePattern,
          targetPattern,
          sourceAnalysis,
          targetAnalysis
        );

        relationships.push(...relationshipResults);
      }
    }

    return relationships;
  }

  /**
   * Identify potential relationships between two patterns
   */
  private async identifyPotentialRelationships(
    sourcePattern: AudioPattern,
    targetPattern: AudioPattern,
    sourceAnalysis: any,
    targetAnalysis: any
  ): Promise<PatternRelationship[]> {
    const relationships: PatternRelationship[] = [];

    // Check similarity relationship
    const similarityScore = await this.calculatePatternSimilarity(
      sourcePattern,
      targetPattern,
      sourceAnalysis,
      targetAnalysis
    );

    if (similarityScore > 0.7) {
      relationships.push({
        sourcePatternId: sourcePattern.id,
        targetPatternId: targetPattern.id,
        relationshipType: 'similarity',
        strength: similarityScore,
        description: `Similar patterns with ${Math.round(similarityScore * 100)}% match`
      });
    }

    // Check transformation relationship
    const transformation = await this.detectTransformation(
      sourcePattern,
      targetPattern,
      sourceAnalysis,
      targetAnalysis
    );

    if (transformation.detected) {
      relationships.push({
        sourcePatternId: sourcePattern.id,
        targetPatternId: targetPattern.id,
        relationshipType: 'transformation',
        transformationType: transformation.type,
        strength: transformation.confidence,
        description: transformation.description
      });
    }

    // Check contrast relationship
    const contrastScore = await this.calculateContrastScore(
      sourcePattern,
      targetPattern,
      sourceAnalysis,
      targetAnalysis
    );

    if (contrastScore > 0.7) {
      relationships.push({
        sourcePatternId: sourcePattern.id,
        targetPatternId: targetPattern.id,
        relationshipType: 'contrast',
        strength: contrastScore,
        description: 'Contrasting patterns with opposite characteristics'
      });
    }

    return relationships;
  }

  /**
   * Calculate similarity between two patterns
   */
  private async calculatePatternSimilarity(
    pattern1: AudioPattern,
    pattern2: AudioPattern,
    analysis1: any,
    analysis2: any
  ): Promise<number> {
    // Compare spectromorphological characteristics
    const spectroSimilarity = this.compareSpectromorphology(
      analysis1.spectromorphology,
      analysis2.spectromorphology
    );

    // Compare microsound characteristics
    const microSimilarity = this.compareMicrosoundCharacteristics(
      analysis1.microsound,
      analysis2.microsound
    );

    // Compare language grid positions
    const gridSimilarity = this.compareLanguageGridPositions(
      analysis1.languageGrid,
      analysis2.languageGrid
    );

    // Weight and combine similarities
    return (
      (spectroSimilarity * 0.4) +
      (microSimilarity * 0.3) +
      (gridSimilarity * 0.3)
    );
  }

  /**
   * Detect transformations between patterns
   */
  private async detectTransformation(
    sourcePattern: AudioPattern,
    targetPattern: AudioPattern,
    sourceAnalysis: any,
    targetAnalysis: any
  ): Promise<{
    detected: boolean;
    type?: string;
    confidence: number;
    description: string;
  }> {
    // Compare temporal characteristics
    const timeScaling = this.detectTimeScaling(sourcePattern, targetPattern);

    // Compare spectral characteristics
    const spectralShift = this.detectSpectralShift(sourcePattern, targetPattern);

    // Compare morphological evolution
    const morphologicalChange = this.detectMorphologicalChange(
      sourcePattern,
      targetPattern
    );

    // Determine most significant transformation
    if (timeScaling.detected && timeScaling.confidence > 0.7) {
      return {
        detected: true,
        type: 'time-scaling',
        confidence: timeScaling.confidence,
        description: `Time-scaled version (${timeScaling.factor.toFixed(2)}x)`
      };
    } else if (spectralShift.detected && spectralShift.confidence > 0.7) {
      return {
        detected: true,
        type: 'spectral-shift',
        confidence: spectralShift.confidence,
        description: `Spectrally shifted version (${spectralShift.shift > 0 ? 'up' : 'down'})`
      };
    } else if (morphologicalChange.detected && morphologicalChange.confidence > 0.7) {
      return {
        detected: true,
        type: 'morphological-transformation',
        confidence: morphologicalChange.confidence,
        description: morphologicalChange.description
      };
    }

    return {
      detected: false,
      confidence: 0,
      description: 'No significant transformation detected'
    };
  }

  /**
   * Calculate contrast score between patterns
   */
  private async calculateContrastScore(
    pattern1: AudioPattern,
    pattern2: AudioPattern,
    analysis1: any,
    analysis2: any
  ): Promise<number> {
    // Compare motion types
    const motionContrast = this.compareMotionTypes(
      analysis1.spectromorphology.motionTypes,
      analysis2.spectromorphology.motionTypes
    );

    // Compare texture types
    const textureContrast = this.compareTextureTypes(
      analysis1.microsound.textureType,
      analysis2.microsound.textureType
    );

    // Compare discourse types
    const discourseContrast = this.compareDiscourseTypes(
      analysis1.languageGrid.gridPosition.discourse,
      analysis2.languageGrid.gridPosition.discourse
    );

    // Weight and combine contrasts
    return (
      (motionContrast * 0.4) +
      (textureContrast * 0.3) +
      (discourseContrast * 0.3)
    );
  }

  /**
   * Identify evolution chains among patterns
   */
  private async identifyEvolutionChains(
    patterns: Map<string, AudioPattern>,
    analyses: Map<string, any>
  ): Promise<PatternEvolutionChain[]> {
    const chains: PatternEvolutionChain[] = [];
    const processed = new Set<string>();

    for (const [patternId, pattern] of patterns) {
      if (processed.has(patternId)) continue;

      // Try to find a chain starting from this pattern
      const chain = await this.buildEvolutionChain(
        patternId,
        patterns,
        analyses,
        processed
      );

      if (chain.evolutionSteps.length > 0) {
        chains.push(chain);
      }
    }

    return chains;
  }

  /**
   * Build evolution chain starting from a pattern
   */
  private async buildEvolutionChain(
    startPatternId: string,
    patterns: Map<string, AudioPattern>,
    analyses: Map<string, any>,
    processed: Set<string>
  ): Promise<PatternEvolutionChain> {
    const chain: PatternEvolutionChain = {
      basePatternId: startPatternId,
      evolutionSteps: [],
      confidence: 0
    };

    let currentPatternId = startPatternId;
    processed.add(currentPatternId);

    while (true) {
      // Find the most likely next pattern in the evolution
      const nextStep = await this.findNextEvolutionStep(
        currentPatternId,
        patterns,
        analyses,
        processed
      );

      if (!nextStep) break;

      chain.evolutionSteps.push({
        patternId: nextStep.patternId,
        timestamp: new Date(),
        transformationDescription: nextStep.transformationDescription,
        similarityScore: nextStep.similarityScore
      });

      processed.add(nextStep.patternId);
      currentPatternId = nextStep.patternId;
    }

    // Calculate chain confidence
    chain.confidence = chain.evolutionSteps.length > 0 ?
      chain.evolutionSteps.reduce((sum, step) => sum + step.similarityScore, 0) / chain.evolutionSteps.length :
      0;

    return chain;
  }

  /**
   * Find the next pattern in an evolution chain
   */
  private async findNextEvolutionStep(
    currentPatternId: string,
    patterns: Map<string, AudioPattern>,
    analyses: Map<string, any>,
    processed: Set<string>
  ): Promise<{
    patternId: string;
    transformationDescription: string;
    similarityScore: number;
  } | null> {
    let bestMatch = null;
    let highestScore = 0;

    const currentPattern = patterns.get(currentPatternId);
    const currentAnalysis = analyses.get(currentPatternId);

    if (!currentPattern || !currentAnalysis) return null;

    for (const [candidateId, candidatePattern] of patterns) {
      if (processed.has(candidateId)) continue;

      const candidateAnalysis = analyses.get(candidateId);
      if (!candidateAnalysis) continue;

      // Calculate evolution score
      const evolutionScore = await this.calculateEvolutionScore(
        currentPattern,
        candidatePattern,
        currentAnalysis,
        candidateAnalysis
      );

      if (evolutionScore.score > highestScore && evolutionScore.score > 0.5) {
        highestScore = evolutionScore.score;
        bestMatch = {
          patternId: candidateId,
          transformationDescription: evolutionScore.description,
          similarityScore: evolutionScore.score
        };
      }
    }

    return bestMatch;
  }

  /**
   * Identify shared motifs across patterns
   */
  private async identifySharedMotifs(
    patterns: Map<string, AudioPattern>,
    analyses: Map<string, any>
  ): Promise<SharedMotif[]> {
    // Extract potential motifs from each pattern
    const patternMotifs = await this.extractPotentialMotifs(patterns, analyses);

    // Group similar motifs
    const motifGroups = await this.groupSimilarMotifs(patternMotifs);

    // Convert groups to shared motifs
    return this.convertMotifGroupsToSharedMotifs(motifGroups);
  }

  // Helper methods for similarity analysis
  private compareSpectromorphology(spec1: any, spec2: any): number {
    // Compare motion types, onset-continuant-termination characteristics
    // Placeholder implementation
    return 0.8;
  }

  private compareMicrosoundCharacteristics(micro1: any, micro2: any): number {
    // Compare grain properties, texture types, etc.
    // Placeholder implementation
    return 0.7;
  }

  private compareLanguageGridPositions(grid1: any, grid2: any): number {
    // Compare discourse and syntax positions
    // Placeholder implementation
    return 0.9;
  }

  private detectTimeScaling(pattern1: AudioPattern, pattern2: AudioPattern): {
    detected: boolean;
    factor: number;
    confidence: number;
  } {
    // Detect temporal scaling transformations
    // Placeholder implementation
    return { detected: true, factor: 1.5, confidence: 0.8 };
  }

  private detectSpectralShift(pattern1: AudioPattern, pattern2: AudioPattern): {
    detected: boolean;
    shift: number;
    confidence: number;
  } {
    // Detect spectral shift transformations
    // Placeholder implementation
    return { detected: true, shift: 200, confidence: 0.7 };
  }

  private detectMorphologicalChange(pattern1: AudioPattern, pattern2: AudioPattern): {
    detected: boolean;
    description: string;
    confidence: number;
  } {
    // Detect morphological transformations
    // Placeholder implementation
    return {
      detected: true,
      description: 'Increased granular density',
      confidence: 0.85
    };
  }

  private compareMotionTypes(motions1: any[], motions2: any[]): number {
    // Compare motion characteristics
    // Placeholder implementation
    return 0.7;
  }

  private compareTextureTypes(texture1: string, texture2: string): number {
    // Compare texture characteristics
    // Placeholder implementation
    return 0.8;
  }

  private compareDiscourseTypes(discourse1: string, discourse2: string): number {
    // Compare discourse positions
    // Placeholder implementation
    return 0.9;
  }

  private async calculateEvolutionScore(
    pattern1: AudioPattern,
    pattern2: AudioPattern,
    analysis1: any,
    analysis2: any
  ): Promise<{
    score: number;
    description: string;
  }> {
    // Calculate evolution likelihood and describe transformation
    // Placeholder implementation
    return {
      score: 0.75,
      description: 'Gradual increase in spectral complexity'
    };
  }

  private async extractPotentialMotifs(
    patterns: Map<string, AudioPattern>,
    analyses: Map<string, any>
  ): Promise<Array<{
    patternId: string;
    motif: Float32Array;
    features: any;
  }>> {
    // Extract characteristic motifs from patterns
    // Placeholder implementation
    return [];
  }

  private async groupSimilarMotifs(
    motifs: Array<{
      patternId: string;
      motif: Float32Array;
      features: any;
    }>
  ): Promise<Array<{
    motifs: Float32Array[];
    patternIds: string[];
    features: any;
  }>> {
    // Group similar motifs together
    // Placeholder implementation
    return [];
  }

  private convertMotifGroupsToSharedMotifs(
    groups: Array<{
      motifs: Float32Array[];
      patternIds: string[];
      features: any;
    }>
  ): SharedMotif[] {
    // Convert motif groups to shared motif format
    // Placeholder implementation
    return [];
  }

  private calculateOverallConfidence(
    relationships: PatternRelationship[],
    chains: PatternEvolutionChain[],
    motifs: SharedMotif[]
  ): number {
    // Calculate average confidence from all components
    const relationshipConfidence = relationships.length > 0 ?
      relationships.reduce((sum, r) => sum + r.strength, 0) / relationships.length : 0;

    const chainConfidence = chains.length > 0 ?
      chains.reduce((sum, c) => sum + c.confidence, 0) / chains.length : 0;

    const motifConfidence = motifs.length > 0 ?
      motifs.reduce((sum, m) => sum + m.confidence, 0) / motifs.length : 0;

    return (
      (relationshipConfidence * 0.4) +
      (chainConfidence * 0.4) +
      (motifConfidence * 0.2)
    );
  }
}
