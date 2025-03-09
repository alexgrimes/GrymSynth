import { AdvancedPatternAnalysisService } from '../AdvancedPatternAnalysisService';
import { PatternRepository } from '../../storage/PatternRepository';
import { HealthMonitor } from '../../monitoring/HealthMonitor';
import { TimeScale } from '../analyzers/MicrosoundAnalyzer';
import { MotionType } from '../analyzers/SpectromorphologicalAnalyzer';
import { DiscourseType, SyntaxType } from '../analyzers/LanguageGridAnalyzer';

describe('AdvancedPatternAnalysisService', () => {
  let service: AdvancedPatternAnalysisService;
  let repository: jest.Mocked<PatternRepository>;
  let healthMonitor: jest.Mocked<HealthMonitor>;

  const mockPattern = {
    id: 'test-pattern-1',
    type: 'harmonic',
    features: [0.1, 0.2, 0.3, 0.4, 0.5],
    startTime: 0,
    endTime: 1.0,
    frequencyRange: {
      low: 200,
      high: 2000
    },
    confidence: 0.9
  };

  beforeEach(() => {
    // Create mocks
    repository = {
      getPatternById: jest.fn(),
      queryPatterns: jest.fn()
    } as any;

    healthMonitor = {
      recordMetric: jest.fn(),
      recordError: jest.fn()
    } as any;

    // Setup mocked responses
    repository.getPatternById.mockResolvedValue(mockPattern);
    repository.queryPatterns.mockResolvedValue([mockPattern]);

    // Create service
    service = new AdvancedPatternAnalysisService(repository, healthMonitor);
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith(
        'service.advanced_pattern_analysis.initialized',
        expect.any(Object)
      );
    });
  });

  describe('Single Pattern Analysis', () => {
    it('should analyze a single pattern using integrated analysis', async () => {
      const result = await service.analyzePattern('test-pattern-1');

      // Verify basic structure
      expect(result).toBeDefined();
      expect(result.patternId).toBe('test-pattern-1');
      expect(result.confidence).toBeGreaterThan(0);

      // Verify spectromorphological analysis
      expect(result.spectromorphology).toBeDefined();
      expect(result.spectromorphology.motionTypes).toBeInstanceOf(Array);
      expect(result.spectromorphology.onset).toBeDefined();
      expect(result.spectromorphology.termination).toBeDefined();

      // Verify microsound analysis
      expect(result.microsound).toBeDefined();
      expect(result.microsound.dominantTimeScales).toContain(TimeScale.SOUND_OBJECT);
      expect(result.microsound.textureType).toBeDefined();

      // Verify language grid analysis
      expect(result.languageGrid).toBeDefined();
      expect(result.languageGrid.gridPosition).toBeDefined();
      expect(result.languageGrid.referentialQualities).toBeInstanceOf(Array);
    });

    it('should handle errors gracefully', async () => {
      repository.getPatternById.mockRejectedValueOnce(new Error('Pattern not found'));

      await expect(service.analyzePattern('non-existent')).rejects.toThrow();
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith(
        'service.pattern_analysis.error',
        expect.any(Object)
      );
    });
  });

  describe('Cross-Pattern Analysis', () => {
    const mockPatterns = [
      mockPattern,
      {
        ...mockPattern,
        id: 'test-pattern-2',
        features: [0.2, 0.3, 0.4, 0.5, 0.6]
      }
    ];

    beforeEach(() => {
      repository.queryPatterns.mockResolvedValue(mockPatterns);
    });

    it('should analyze relationships between multiple patterns', async () => {
      const result = await service.analyzePatternRelationships([
        'test-pattern-1',
        'test-pattern-2'
      ]);

      // Verify relationships
      expect(result.patternRelationships).toBeInstanceOf(Array);
      expect(result.evolutionChains).toBeInstanceOf(Array);
      expect(result.sharedMotifs).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);

      // Verify specific relationship types
      const relationships = result.patternRelationships;
      expect(relationships.some(r => r.relationshipType === 'similarity')).toBe(true);
    });

    it('should handle errors in cross-pattern analysis', async () => {
      repository.queryPatterns.mockRejectedValueOnce(new Error('Query failed'));

      await expect(service.analyzePatternRelationships(['test-1', 'test-2']))
        .rejects.toThrow();

      expect(healthMonitor.recordMetric).toHaveBeenCalledWith(
        'service.relationship_analysis.error',
        expect.any(Object)
      );
    });
  });

  describe('Individual Analysis Types', () => {
    it('should provide spectromorphological analysis', async () => {
      const result = await service.getSpectromorphologicalAnalysis('test-pattern-1');

      expect(result.motionTypes[0]).toBeDefined();
      expect(result.onset.type).toBeDefined();
      expect(result.gestureTextureBalance).toBeGreaterThanOrEqual(0);
      expect(result.gestureTextureBalance).toBeLessThanOrEqual(1);
    });

    it('should provide microsound analysis', async () => {
      const result = await service.getMicrosoundAnalysis('test-pattern-1');

      expect(result.dominantTimeScales).toContain(TimeScale.SOUND_OBJECT);
      expect(result.grainProperties).toBeDefined();
      expect(result.textureType).toBeDefined();
      expect(result.formantStructure).toBeDefined();
    });

    it('should provide language-grid analysis', async () => {
      const result = await service.getLanguageGridAnalysis('test-pattern-1');

      expect(result.gridPosition.discourse).toBeDefined();
      expect(result.gridPosition.syntax).toBeDefined();
      expect(result.referentialQualities).toBeInstanceOf(Array);
      expect(result.compositionalStrategy).toBeDefined();
    });
  });

  describe('Service Setup', () => {
    it('should setup service using static method', async () => {
      const newService = await AdvancedPatternAnalysisService.setup(
        repository,
        healthMonitor
      );

      expect(newService).toBeInstanceOf(AdvancedPatternAnalysisService);
      expect(healthMonitor.recordMetric).toHaveBeenCalledWith(
        'service.registration',
        expect.any(Object)
      );
    });
  });
});
