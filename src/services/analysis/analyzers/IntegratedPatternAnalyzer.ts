import { AudioPattern, AnalysisConfig } from '../types/audio';
import { SpectromorphologicalAnalyzer, SpectromorphologicalAnalysisResult } from './SpectromorphologicalAnalyzer';
import { MicrosoundAnalyzer, MicrosoundAnalysisResult, TimeScale } from './MicrosoundAnalyzer';
import { LanguageGridAnalyzer, LanguageGridAnalysisResult } from './LanguageGridAnalyzer';
import { PatternRepository } from '../../storage/PatternRepository';
import { HealthMonitor } from '../../monitoring/HealthMonitor';

export interface IntegratedAnalysisResult {
  patternId: string;
  spectromorphology: SpectromorphologicalAnalysisResult;
  microsound: MicrosoundAnalysisResult;
  languageGrid: LanguageGridAnalysisResult;
  combinedDescription: string;
  confidence: number;
}

export class IntegratedPatternAnalyzer {
  private spectromorphologicalAnalyzer: SpectromorphologicalAnalyzer;
  private microsoundAnalyzer: MicrosoundAnalyzer;
  private languageGridAnalyzer: LanguageGridAnalyzer;

  constructor(
    private repository: PatternRepository,
    private healthMonitor: HealthMonitor
  ) {
    this.spectromorphologicalAnalyzer = new SpectromorphologicalAnalyzer(repository, healthMonitor);
    this.microsoundAnalyzer = new MicrosoundAnalyzer(repository, healthMonitor);
    this.languageGridAnalyzer = new LanguageGridAnalyzer(repository, healthMonitor);
  }

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
   * Perform integrated analysis using all three theoretical frameworks
   */
  async analyzePattern(
    patternId: string,
    config?: AnalysisConfig
  ): Promise<IntegratedAnalysisResult> {
    try {
      // Verify pattern exists
      const pattern = await this.repository.getPatternById(patternId);
      if (!pattern) {
        throw new Error(`Pattern not found: ${patternId}`);
      }

      // Convert pattern to expected format
      const analyzablePattern: AudioPattern = {
        ...pattern,
        features: this.ensureFloat32Array(pattern.features)
      };

      // Perform concurrent analysis using all three frameworks
      const [spectromorphology, microsound, languageGrid] = await Promise.all([
        this.spectromorphologicalAnalyzer.analyzePattern(patternId, config),
        this.microsoundAnalyzer.analyzePattern(patternId, config),
        this.languageGridAnalyzer.analyzePattern(patternId, config)
      ]);

      // Generate combined description
      const combinedDescription = this.generateCombinedDescription(
        analyzablePattern,
        spectromorphology,
        microsound,
        languageGrid
      );

      // Calculate combined confidence
      const confidence = this.calculateCombinedConfidence(
        spectromorphology.confidence,
        microsound.confidence,
        languageGrid.confidence
      );

      // Record metrics
      this.healthMonitor.recordMetric('analysis.integrated.complete', {
        patternId,
        spectromorphologyConfidence: spectromorphology.confidence,
        microsoundConfidence: microsound.confidence,
        languageGridConfidence: languageGrid.confidence,
        combinedConfidence: confidence
      });

      return {
        patternId,
        spectromorphology,
        microsound,
        languageGrid,
        combinedDescription,
        confidence
      };
    } catch (error) {
      this.healthMonitor.recordMetric('analysis.integrated.error', {
        patternId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Generate a combined description from all analysis results
   */
  private generateCombinedDescription(
    pattern: AudioPattern,
    spectromorphology: SpectromorphologicalAnalysisResult,
    microsound: MicrosoundAnalysisResult,
    languageGrid: LanguageGridAnalysisResult
  ): string {
    let description = '';

    // Add spectromorphological description
    description += this.generateSpectromorphologyDescription(spectromorphology);

    // Add microsound description if relevant
    if (microsound.dominantTimeScales.includes(TimeScale.MICRO)) {
      description += this.generateMicrosoundDescription(microsound);
    }

    // Add language-grid description
    description += this.generateLanguageGridDescription(languageGrid);

    // Add listening suggestions
    description += this.generateListeningSuggestions(
      spectromorphology,
      microsound,
      languageGrid
    );

    return description;
  }

  /**
   * Generate spectromorphological part of description
   */
  private generateSpectromorphologyDescription(
    analysis: SpectromorphologicalAnalysisResult
  ): string {
    let desc = `A ${analysis.onset.type} sound with `;

    if (analysis.motionTypes.length > 0) {
      desc += `${analysis.motionTypes[0].type} motion`;
      if (analysis.motionTypes.length > 1) {
        desc += ` and ${analysis.motionTypes[1].type} characteristics`;
      }
    }

    desc += `, characterized by ${analysis.continuant.type} continuation `;
    desc += `and ending with a ${analysis.termination.type} termination. `;

    return desc;
  }

  /**
   * Generate microsound part of description
   */
  private generateMicrosoundDescription(
    analysis: MicrosoundAnalysisResult
  ): string {
    let desc = `At the microsound level, it consists of `;
    desc += `approximately ${analysis.particleStatistics.count} grains `;
    desc += `with an average duration of ${analysis.particleStatistics.meanDuration}ms, `;
    desc += `forming a ${analysis.textureType} texture. `;

    if (analysis.clouds.length > 0) {
      desc += `The sound exhibits ${analysis.clouds.length} distinct grain clouds `;
      desc += `with varying densities and spectral distributions. `;
    }

    if (analysis.formantStructure) {
      desc += `Formant-like structures emerge from the granular organization. `;
    }

    return desc;
  }

  /**
   * Generate language-grid part of description
   */
  private generateLanguageGridDescription(
    analysis: LanguageGridAnalysisResult
  ): string {
    let desc = '';

    if (analysis.gridPosition.discourse === 'mimetic') {
      desc += `The sound strongly resembles ${analysis.referentialQualities[0]?.source} sounds, `;
    } else if (analysis.gridPosition.discourse === 'aural_mimetic') {
      desc += `The sound combines abstract qualities with references to ${analysis.referentialQualities[0]?.source}, `;
    } else {
      desc += `The sound is primarily abstract with no clear real-world references. `;
    }

    desc += `Its organization follows ${analysis.gridPosition.syntax} principles. `;

    if (analysis.abstractProperties.length > 0) {
      desc += `Key sonic properties include ${analysis.abstractProperties.slice(0, 2).join(' and ')}. `;
    }

    return desc;
  }

  /**
   * Generate listening suggestions based on all analyses
   */
  private generateListeningSuggestions(
    spectromorphology: SpectromorphologicalAnalysisResult,
    microsound: MicrosoundAnalysisResult,
    languageGrid: LanguageGridAnalysisResult
  ): string {
    let suggestions = '\nListening focus: ';

    // Add primary focus based on language grid position
    suggestions += `${languageGrid.listeningFocus}. `;

    // Add spectromorphological focus if confidence is high
    if (spectromorphology.confidence > 0.8) {
      suggestions += `Pay attention to the ${spectromorphology.motionTypes[0]?.type} motion `;
      suggestions += `and its relationship to the overall gesture. `;
    }

    // Add microsound focus if relevant
    if (microsound.dominantTimeScales.includes(TimeScale.MICRO) && microsound.confidence > 0.8) {
      suggestions += `Consider how the granular texture contributes to the overall sound character. `;
    }

    return suggestions;
  }

  /**
   * Calculate combined confidence score
   */
  private calculateCombinedConfidence(
    spectromorphologyConfidence: number,
    microsoundConfidence: number,
    languageGridConfidence: number
  ): number {
    // Weight confidences based on framework relevance
    const weights = {
      spectromorphology: 0.4, // Most fundamental
      microsound: 0.3,        // Important for texture
      languageGrid: 0.3       // Important for context
    };

    return (
      (spectromorphologyConfidence * weights.spectromorphology) +
      (microsoundConfidence * weights.microsound) +
      (languageGridConfidence * weights.languageGrid)
    );
  }
}
