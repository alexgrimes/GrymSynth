import { AdaptiveConfidenceModeler } from '../AdaptiveConfidenceModeler';
import { PatternRepository } from '../../storage/PatternRepository';
import { FeatureVectorDatabase, VectorDatabaseConfig } from '../../storage/FeatureVectorDatabase';
import { HealthMonitor } from '../../monitoring/HealthMonitor';

// Mock dependencies
jest.mock('../../storage/PatternRepository');
jest.mock('../../storage/FeatureVectorDatabase');
jest.mock('../../monitoring/HealthMonitor');

describe('AdaptiveConfidenceModeler', () => {
  let confidenceModeler: AdaptiveConfidenceModeler;
  let mockRepository: jest.Mocked<PatternRepository>;
  let mockVectorDb: jest.Mocked<FeatureVectorDatabase>;
  let mockHealthMonitor: jest.Mocked<HealthMonitor>;

  beforeEach(() => {
    // Create mocks
    mockHealthMonitor = new HealthMonitor() as jest.Mocked<HealthMonitor>;

    const vectorDbConfig: VectorDatabaseConfig = {
      indexPath: 'test/index',
      dimensions: 10,
      distanceMetric: 'cosine',
      persistIndexOnDisk: false
    };

    mockVectorDb = new FeatureVectorDatabase(
      vectorDbConfig,
      mockHealthMonitor
    ) as jest.Mocked<FeatureVectorDatabase>;

    mockRepository = new PatternRepository(
      mockVectorDb,
      mockHealthMonitor,
      {
        vectorDimensions: 10,
        similarityThreshold: 0.8,
        maxQueryResults: 100
      }
    ) as jest.Mocked<PatternRepository>;

    confidenceModeler = new AdaptiveConfidenceModeler(
      mockRepository,
      mockVectorDb,
      mockHealthMonitor
    );
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence for a pattern with features', async () => {
      const pattern = {
        id: '123',
        type: 'test',
        startTime: 0,
        endTime: 1,
        confidence: 0.5,
        frequencyRange: { low: 20, high: 20000 },
        features: [1, 2, 3]
      };

      const similarPatterns = [
        { ...pattern, id: '456', confidence: 0.8 },
        { ...pattern, id: '789', confidence: 0.7 }
      ];

      mockRepository.findSimilarPatterns.mockResolvedValue(similarPatterns);
      mockVectorDb.calculateSimilarity.mockResolvedValue(0.9);

      const confidence = await confidenceModeler.calculateConfidence(pattern);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
      expect(mockRepository.findSimilarPatterns).toHaveBeenCalled();
      expect(mockVectorDb.calculateSimilarity).toHaveBeenCalled();
    });

    it('should use minimum confidence for pattern without features', async () => {
      const pattern = {
        id: '123',
        type: 'test',
        startTime: 0,
        endTime: 1,
        confidence: 0.5,
        frequencyRange: { low: 20, high: 20000 }
      };

      const confidence = await confidenceModeler.calculateConfidence(pattern);

      expect(confidence).toBe(0.1); // Default minimum confidence
      expect(mockRepository.findSimilarPatterns).not.toHaveBeenCalled();
    });
  });

  describe('updateModelParameters', () => {
    it('should update learning rate within valid range', async () => {
      await expect(
        confidenceModeler.updateModelParameters({ learningRate: 0.3 })
      ).resolves.not.toThrow();

      await expect(
        confidenceModeler.updateModelParameters({ learningRate: 1.5 })
      ).rejects.toThrow('Learning rate must be between 0 and 1');
    });

    it('should normalize feature weights', async () => {
      await confidenceModeler.updateModelParameters({
        featureWeights: [2, 3, 5]
      });

      // Test normalized weights through another operation
      const pattern = {
        id: '123',
        type: 'test',
        startTime: 0,
        endTime: 1,
        confidence: 0.5,
        frequencyRange: { low: 20, high: 20000 },
        features: [1, 1, 1]
      };

      const confidence = await confidenceModeler.calculateConfidence(pattern);
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('learnFromHistory', () => {
    it('should learn from historical patterns', async () => {
      const patterns = [
        {
          id: '1',
          type: 'test',
          startTime: 0,
          endTime: 1,
          confidence: 0.8,
          frequencyRange: { low: 20, high: 20000 },
          features: [1, 2, 3]
        },
        {
          id: '2',
          type: 'test',
          startTime: 1,
          endTime: 2,
          confidence: 0.7,
          frequencyRange: { low: 20, high: 20000 },
          features: [2, 3, 4]
        }
      ];

      mockRepository.queryPatterns.mockResolvedValue(patterns);
      mockVectorDb.calculateSimilarity.mockResolvedValue(0.85);

      await expect(confidenceModeler.learnFromHistory()).resolves.not.toThrow();
      expect(mockHealthMonitor.recordMetric).toHaveBeenCalledWith(
        'confidence.model.learned',
        expect.any(Object)
      );
    });

    it('should handle empty pattern history', async () => {
      mockRepository.queryPatterns.mockResolvedValue([]);

      await expect(confidenceModeler.learnFromHistory()).resolves.not.toThrow();
      expect(mockHealthMonitor.recordMetric).not.toHaveBeenCalledWith(
        'confidence.model.learned',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should handle repository errors', async () => {
      const pattern = {
        id: '123',
        type: 'test',
        startTime: 0,
        endTime: 1,
        confidence: 0.5,
        frequencyRange: { low: 20, high: 20000 },
        features: [1, 2, 3]
      };

      mockRepository.findSimilarPatterns.mockRejectedValue(new Error('DB Error'));

      await expect(confidenceModeler.calculateConfidence(pattern)).rejects.toThrow();
      expect(mockHealthMonitor.recordMetric).toHaveBeenCalledWith(
        'confidence.calculation.error',
        expect.any(Object)
      );
    });

    it('should handle vector database errors', async () => {
      const pattern = {
        id: '123',
        type: 'test',
        startTime: 0,
        endTime: 1,
        confidence: 0.5,
        frequencyRange: { low: 20, high: 20000 },
        features: [1, 2, 3]
      };

      mockRepository.findSimilarPatterns.mockResolvedValue([pattern]);
      mockVectorDb.calculateSimilarity.mockRejectedValue(new Error('Vector DB Error'));

      await expect(confidenceModeler.calculateConfidence(pattern)).rejects.toThrow();
      expect(mockHealthMonitor.recordMetric).toHaveBeenCalledWith(
        'confidence.calculation.error',
        expect.any(Object)
      );
    });
  });
});
