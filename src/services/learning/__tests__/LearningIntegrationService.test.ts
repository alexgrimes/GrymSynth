import { LearningIntegrationService } from '../LearningIntegrationService';
import { PatternRepository } from '../../storage/PatternRepository';
import { PatternLearningService } from '../PatternLearningService';
import { PatternRelationshipTracker } from '../PatternRelationshipTracker';
import { ContextualMemorySystem } from '../../memory/ContextualMemorySystem';
import { AdaptiveConfidenceModeler } from '../AdaptiveConfidenceModeler';
import { HealthMonitor } from '../../monitoring/HealthMonitor';
import { FeatureVectorDatabase, VectorDatabaseConfig } from '../../storage/FeatureVectorDatabase';
import { PatternFeedbackService } from '../../feedback/PatternFeedbackService';
import { AudioPattern, PatternContext, RelationshipType } from '../../../types/audio';

jest.mock('../../storage/PatternRepository');
jest.mock('../PatternLearningService');
jest.mock('../PatternRelationshipTracker');
jest.mock('../../memory/ContextualMemorySystem');
jest.mock('../AdaptiveConfidenceModeler');
jest.mock('../../monitoring/HealthMonitor');
jest.mock('../../storage/FeatureVectorDatabase');
jest.mock('../../feedback/PatternFeedbackService');

describe('LearningIntegrationService', () => {
  let learningIntegration: LearningIntegrationService;
  let mockRepository: jest.Mocked<PatternRepository>;
  let mockLearningService: jest.Mocked<PatternLearningService>;
  let mockRelationshipTracker: jest.Mocked<PatternRelationshipTracker>;
  let mockMemorySystem: jest.Mocked<ContextualMemorySystem>;
  let mockConfidenceModeler: jest.Mocked<AdaptiveConfidenceModeler>;
  let mockHealthMonitor: jest.Mocked<HealthMonitor>;
  let mockVectorDb: jest.Mocked<FeatureVectorDatabase>;
  let mockFeedbackService: jest.Mocked<PatternFeedbackService>;

  beforeEach(() => {
    // Create base mocks first
    mockHealthMonitor = {
      recordMetric: jest.fn(),
      startTimer: jest.fn(),
      endTimer: jest.fn(),
      recordError: jest.fn(),
      recordStateChange: jest.fn()
    } as jest.Mocked<HealthMonitor>;

    mockVectorDb = {
      initialize: jest.fn(),
      calculateSimilarity: jest.fn(),
      upsertVector: jest.fn(),
      findSimilarVectors: jest.fn(),
      config: {
        dimensions: 10,
        indexPath: 'test/index',
        distanceMetric: 'cosine',
        persistIndexOnDisk: false
      }
    } as unknown as jest.Mocked<FeatureVectorDatabase>;

    mockRepository = {
      initialize: jest.fn(),
      storePattern: jest.fn(),
      getPatternById: jest.fn(),
      getPatternMetadata: jest.fn(),
      updatePattern: jest.fn(),
      findSimilarPatterns: jest.fn(),
      queryPatterns: jest.fn(),
      deletePattern: jest.fn()
    } as unknown as jest.Mocked<PatternRepository>;

    mockFeedbackService = {
      healthMonitor: mockHealthMonitor,
      submitFeedback: jest.fn(),
      getFeedbackStats: jest.fn(),
      getPatternTypeStats: jest.fn(),
      getPatternFeedbackHistory: jest.fn(),
      deleteFeedback: jest.fn()
    } as unknown as jest.Mocked<PatternFeedbackService>;

    mockLearningService = {
      processFeedback: jest.fn(),
      updatePattern: jest.fn(),
      getFeedbackStats: jest.fn()
    } as unknown as jest.Mocked<PatternLearningService>;

    mockRelationshipTracker = {
      createRelationship: jest.fn(),
      discoverRelationships: jest.fn(),
      getRelationshipsForPattern: jest.fn(),
      findRelatedPatterns: jest.fn()
    } as unknown as jest.Mocked<PatternRelationshipTracker>;

    mockMemorySystem = {
      addToMemory: jest.fn(),
      accessPattern: jest.fn(),
      findPatternsByContext: jest.fn(),
      findSimilarPatterns: jest.fn()
    } as unknown as jest.Mocked<ContextualMemorySystem>;

    mockConfidenceModeler = {
      calculateConfidence: jest.fn(),
      updateModelParameters: jest.fn(),
      learnFromHistory: jest.fn()
    } as unknown as jest.Mocked<AdaptiveConfidenceModeler>;

    // Initialize the service under test
    learningIntegration = new LearningIntegrationService(
      mockRepository,
      mockLearningService,
      mockRelationshipTracker,
      mockMemorySystem,
      mockConfidenceModeler,
      mockHealthMonitor
    );
  });

  describe('processNewPattern', () => {
    const testPattern: AudioPattern = {
      id: 'test1',
      type: 'test',
      startTime: 0,
      endTime: 1,
      confidence: 0.5,
      frequencyRange: { low: 20, high: 20000 },
      features: [1, 2, 3]
    };

    const testContext: PatternContext = {
      sourceId: 'test-source',
      sessionId: 'test-session',
      userId: 'test-user',
      tags: ['test'],
      timestamp: new Date(),
      environmentInfo: {
        noiseLevel: 0.1,
        recordingQuality: 0.9
      }
    };

    it('should process a new pattern successfully', async () => {
      mockConfidenceModeler.calculateConfidence.mockResolvedValue(0.8);
      mockMemorySystem.addToMemory.mockResolvedValue();
      mockRelationshipTracker.discoverRelationships.mockResolvedValue([]);

      const result = await learningIntegration.processNewPattern(testPattern, testContext);

      expect(result.confidence).toBe(0.8);
      expect(mockMemorySystem.addToMemory).toHaveBeenCalledWith(testPattern, testContext);
      expect(mockHealthMonitor.recordMetric).toHaveBeenCalledWith(
        'learning.pattern.processed',
        expect.any(Object)
      );
    });

    it('should handle batch processing when enabled', async () => {
      const batchPattern = { ...testPattern, id: 'batch1' };
      const batchContext = { ...testContext, sessionId: 'batch-session' };

      mockConfidenceModeler.calculateConfidence.mockResolvedValue(0.7);

      const result = await learningIntegration.processNewPattern(batchPattern, batchContext);

      expect(result).toEqual(batchPattern);
      expect(mockMemorySystem.addToMemory).not.toHaveBeenCalled();
    });
  });

  describe('processFeedback', () => {
    const testFeedback = {
      isCorrect: true,
      correctedType: 'corrected',
      userConfidence: 0.9,
      affectSimilarPatterns: true
    };

    it('should process feedback and update related patterns', async () => {
      const testPattern = {
        id: 'test1',
        type: 'test',
        confidence: 0.5,
        startTime: 0,
        endTime: 1,
        frequencyRange: { low: 20, high: 20000 }
      };

      mockMemorySystem.accessPattern.mockResolvedValue(testPattern);
      mockConfidenceModeler.calculateConfidence.mockResolvedValue(0.8);
      mockRelationshipTracker.getRelationshipsForPattern.mockResolvedValue([]);

      await learningIntegration.processFeedback('test1', testFeedback);

      expect(mockLearningService.processFeedback).toHaveBeenCalledWith(
        'test1',
        testFeedback
      );
      expect(mockHealthMonitor.recordMetric).toHaveBeenCalledWith(
        'learning.feedback.processed',
        expect.any(Object)
      );
    });

    it('should handle non-existent patterns gracefully', async () => {
      mockMemorySystem.accessPattern.mockResolvedValue(null);

      await learningIntegration.processFeedback('nonexistent', testFeedback);

      expect(mockLearningService.processFeedback).toHaveBeenCalled();
      expect(mockConfidenceModeler.calculateConfidence).not.toHaveBeenCalled();
    });
  });

  describe('findContextuallyRelevantPatterns', () => {
    const testContext: Partial<PatternContext> = {
      sessionId: 'test-session',
      userId: 'test-user',
      tags: ['test']
    };

    it('should find patterns by context', async () => {
      const testPatterns = [
        {
          id: 'test1',
          type: 'test',
          confidence: 0.8,
          startTime: 0,
          endTime: 1,
          frequencyRange: { low: 20, high: 20000 }
        },
        {
          id: 'test2',
          type: 'test',
          confidence: 0.6,
          startTime: 1,
          endTime: 2,
          frequencyRange: { low: 20, high: 20000 }
        }
      ];

      mockMemorySystem.findPatternsByContext.mockResolvedValue(testPatterns);

      const results = await learningIntegration.findContextuallyRelevantPatterns(testContext);

      expect(results).toEqual(testPatterns);
      expect(mockMemorySystem.findPatternsByContext).toHaveBeenCalledWith(
        testContext,
        expect.any(Object)
      );
    });

    it('should find similar patterns when prototype is provided', async () => {
      const prototypePattern: Partial<AudioPattern> = {
        type: 'test',
        features: [1, 2, 3]
      };

      const similarPatterns = [
        {
          id: 'similar1',
          type: 'test',
          confidence: 0.9,
          startTime: 0,
          endTime: 1,
          frequencyRange: { low: 20, high: 20000 }
        }
      ];

      mockMemorySystem.findSimilarPatterns.mockResolvedValue(similarPatterns);

      const results = await learningIntegration.findContextuallyRelevantPatterns(
        testContext,
        prototypePattern
      );

      expect(results).toEqual(similarPatterns);
      expect(mockMemorySystem.findSimilarPatterns).toHaveBeenCalledWith(
        prototypePattern,
        20
      );
    });
  });

  describe('error handling', () => {
    it('should handle memory system errors', async () => {
      const testPattern = {
        id: 'test1',
        type: 'test',
        startTime: 0,
        endTime: 1,
        confidence: 0.5,
        frequencyRange: { low: 20, high: 20000 }
      };

      mockMemorySystem.addToMemory.mockRejectedValue(new Error('Memory error'));

      await expect(
        learningIntegration.processNewPattern(testPattern, {} as PatternContext)
      ).rejects.toThrow();

      expect(mockHealthMonitor.recordMetric).toHaveBeenCalledWith(
        'learning.pattern.process_error',
        expect.any(Object)
      );
    });

    it('should handle confidence modeler errors', async () => {
      mockConfidenceModeler.calculateConfidence.mockRejectedValue(
        new Error('Confidence error')
      );

      await expect(
        learningIntegration.processNewPattern({} as AudioPattern, {} as PatternContext)
      ).rejects.toThrow();

      expect(mockHealthMonitor.recordMetric).toHaveBeenCalledWith(
        'learning.pattern.process_error',
        expect.any(Object)
      );
    });
  });
});
