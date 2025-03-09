import { PatternRepository } from '../storage/PatternRepository';
import { HealthMonitor } from '../monitoring/HealthMonitor';
import { SpectromorphologicalAnalyzer } from './analyzers/SpectromorphologicalAnalyzer';
import { MicrosoundAnalyzer } from './analyzers/MicrosoundAnalyzer';
import { LanguageGridAnalyzer } from './analyzers/LanguageGridAnalyzer';
import { IntegratedPatternAnalyzer } from './analyzers/IntegratedPatternAnalyzer';
import { CrossPatternAnalyzer } from './analyzers/CrossPatternAnalyzer';
import { AudioPattern, AnalysisConfig } from './types/audio';

export class AdvancedPatternAnalysisService {
  private spectromorphologicalAnalyzer: SpectromorphologicalAnalyzer;
  private microsoundAnalyzer: MicrosoundAnalyzer;
  private languageGridAnalyzer: LanguageGridAnalyzer;
  private integratedAnalyzer: IntegratedPatternAnalyzer;
  private crossAnalyzer: CrossPatternAnalyzer;

  constructor(
    private repository: PatternRepository,
    private healthMonitor: HealthMonitor
  ) {
    // Initialize analyzers
    this.spectromorphologicalAnalyzer = new SpectromorphologicalAnalyzer(
      repository,
      healthMonitor
    );

    this.microsoundAnalyzer = new MicrosoundAnalyzer(
      repository,
      healthMonitor
    );

    this.languageGridAnalyzer = new LanguageGridAnalyzer(
      repository,
      healthMonitor
    );

    this.integratedAnalyzer = new IntegratedPatternAnalyzer(
      repository,
      healthMonitor
    );

    this.crossAnalyzer = new CrossPatternAnalyzer(
      repository,
      this.integratedAnalyzer,
      healthMonitor
    );

    // Record initialization metrics
    healthMonitor.recordMetric('service.advanced_pattern_analysis.initialized', {
      analyzers: [
        'spectromorphological',
        'microsound',
        'language_grid',
        'integrated',
        'cross_pattern'
      ],
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Analyze a single pattern using all available frameworks
   */
  async analyzePattern(
    patternId: string,
    config?: AnalysisConfig
  ) {
    try {
      return await this.integratedAnalyzer.analyzePattern(patternId, config);
    } catch (error) {
      this.healthMonitor.recordMetric('service.pattern_analysis.error', {
        patternId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Analyze relationships between multiple patterns
   */
  async analyzePatternRelationships(
    patternIds: string[],
    config?: AnalysisConfig
  ) {
    try {
      return await this.crossAnalyzer.analyzePatternRelationships(patternIds, config);
    } catch (error) {
      this.healthMonitor.recordMetric('service.relationship_analysis.error', {
        patternCount: patternIds.length,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Get specific spectromorphological analysis
   */
  async getSpectromorphologicalAnalysis(
    patternId: string,
    config?: AnalysisConfig
  ) {
    try {
      return await this.spectromorphologicalAnalyzer.analyzePattern(patternId, config);
    } catch (error) {
      this.healthMonitor.recordMetric('service.spectromorphological_analysis.error', {
        patternId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Get specific microsound analysis
   */
  async getMicrosoundAnalysis(
    patternId: string,
    config?: AnalysisConfig
  ) {
    try {
      return await this.microsoundAnalyzer.analyzePattern(patternId, config);
    } catch (error) {
      this.healthMonitor.recordMetric('service.microsound_analysis.error', {
        patternId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Get specific language-grid analysis
   */
  async getLanguageGridAnalysis(
    patternId: string,
    config?: AnalysisConfig
  ) {
    try {
      return await this.languageGridAnalyzer.analyzePattern(patternId, config);
    } catch (error) {
      this.healthMonitor.recordMetric('service.language_grid_analysis.error', {
        patternId,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Service setup helper
   */
  static async setup(
    patternRepository: PatternRepository,
    healthMonitor: HealthMonitor
  ): Promise<AdvancedPatternAnalysisService> {
    const service = new AdvancedPatternAnalysisService(
      patternRepository,
      healthMonitor
    );

    // Record service registration
    healthMonitor.recordMetric('service.registration', {
      name: 'Advanced Pattern Analysis Service',
      version: '1.0.0',
      capabilities: [
        'spectromorphological_analysis',
        'microsound_analysis',
        'language_grid_analysis',
        'integrated_analysis',
        'cross_pattern_analysis'
      ]
    });

    return service;
  }
}
