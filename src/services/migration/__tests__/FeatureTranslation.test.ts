import { FeatureTranslation, FeatureTranslationOptions } from '../FeatureTranslation';
import { AudioFeatureVector } from '../../../lib/feature-memory/interfaces';

describe('FeatureTranslation', () => {
  // Create a mock AudioFeatureVector for testing
  const createMockFeatureVector = (
    dimensions: [number, number] = [10, 768],
    sampleRate: number = 16000
  ): AudioFeatureVector => {
    const [featureCount, featureLength] = dimensions;
    const features: Float32Array[] = [];

    // Create feature frames with test data
    for (let i = 0; i < featureCount; i++) {
      const frame = new Float32Array(featureLength);
      for (let j = 0; j < featureLength; j++) {
        // Generate deterministic test values
        frame[j] = Math.sin(i * 0.1 + j * 0.01);
      }
      features.push(frame);
    }

    return {
      features,
      featureCount,
      timestamp: new Date(),
      metadata: {
        type: 'wav2vec2_features',
        dimensions,
        sampleRate,
        duration: 5.0,
        channels: 1,
        timeSteps: featureCount
      }
    };
  };

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const translator = new FeatureTranslation();
      expect(translator).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const options: FeatureTranslationOptions = {
        targetDimension: 256,
        dimensionalityReductionMethod: 'max-pooling',
        normalizeOutput: false
      };

      const translator = new FeatureTranslation(options);
      expect(translator).toBeDefined();
    });
  });

  describe('translateFeatures', () => {
    it('should translate features from wav2vec2 to GAMA format', async () => {
      const translator = new FeatureTranslation({
        targetDimension: 512
      });

      const sourceFeatures = createMockFeatureVector([10, 768]);
      const result = await translator.translateFeatures(sourceFeatures);

      // Check result structure
      expect(result).toBeDefined();
      expect(result.features).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.quality).toBeDefined();
      expect(result.stats).toBeDefined();

      // Check feature dimensions
      expect(result.features.length).toBe(sourceFeatures.featureCount);
      expect(result.features[0].length).toBe(512); // Target dimension

      // Check metadata
      expect(result.metadata.type).toBe('gama_features');
      expect(result.metadata.dimensions).toEqual([512]);
      expect(result.metadata.sampleRate).toBe(sourceFeatures.metadata.sampleRate);

      // Check quality metrics
      expect(result.quality.informationPreservation).toBeGreaterThan(0);
      expect(result.quality.informationPreservation).toBeLessThanOrEqual(1);
      expect(result.quality.structuralSimilarity).toBeGreaterThan(0);
      expect(result.quality.structuralSimilarity).toBeLessThanOrEqual(1);
      expect(result.quality.confidence).toBeGreaterThan(0);
      expect(result.quality.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different dimensionality reduction methods', async () => {
      const methods: FeatureTranslationOptions['dimensionalityReductionMethod'][] = [
        'average-pooling',
        'max-pooling',
        'linear-projection'
      ];

      const sourceFeatures = createMockFeatureVector([5, 768]);

      for (const method of methods) {
        const translator = new FeatureTranslation({
          targetDimension: 512,
          dimensionalityReductionMethod: method
        });

        const result = await translator.translateFeatures(sourceFeatures);

        // Check basic expectations for each method
        expect(result.features.length).toBe(sourceFeatures.featureCount);
        expect(result.features[0].length).toBe(512);
        expect(result.metadata.type).toBe('gama_features');
        expect(result.quality.confidence).toBeGreaterThan(0);
      }
    });

    it('should handle upsampling when target dimension is larger', async () => {
      const translator = new FeatureTranslation({
        targetDimension: 1024 // Larger than source
      });

      const sourceFeatures = createMockFeatureVector([5, 512]);
      const result = await translator.translateFeatures(sourceFeatures);

      // Check dimensions
      expect(result.features[0].length).toBe(1024);
      expect(result.metadata.dimensions).toEqual([1024]);
    });

    it('should normalize output when specified', async () => {
      const translator = new FeatureTranslation({
        targetDimension: 512,
        normalizeOutput: true
      });

      const sourceFeatures = createMockFeatureVector([5, 768]);
      const result = await translator.translateFeatures(sourceFeatures);

      // Check normalization (mean should be close to 0, std dev close to 1)
      const firstFrame = result.features[0];
      let sum = 0;
      let sumSquared = 0;

      for (let i = 0; i < firstFrame.length; i++) {
        sum += firstFrame[i];
        sumSquared += firstFrame[i] * firstFrame[i];
      }

      const mean = sum / firstFrame.length;
      const variance = sumSquared / firstFrame.length - mean * mean;
      const stdDev = Math.sqrt(variance);

      // Normalized data should have mean close to 0 and std dev close to 1
      expect(Math.abs(mean)).toBeLessThan(0.1);
      expect(Math.abs(stdDev - 1.0)).toBeLessThan(0.1);
    });

    it('should throw error for invalid input', async () => {
      const translator = new FeatureTranslation();

      // Create invalid feature vector (empty features)
      const invalidFeatures: AudioFeatureVector = {
        features: [],
        featureCount: 0,
        timestamp: new Date(),
        metadata: {
          type: 'wav2vec2_features',
          dimensions: [0, 0],
          sampleRate: 16000,
          duration: 0,
          channels: 1
        }
      };

      await expect(translator.translateFeatures(invalidFeatures)).rejects.toThrow();
    });
  });

  describe('validation', () => {
    it('should calculate quality metrics correctly', async () => {
      const translator = new FeatureTranslation();
      const sourceFeatures = createMockFeatureVector([10, 768]);
      const result = await translator.translateFeatures(sourceFeatures);

      // Quality metrics should be defined and within range
      expect(result.quality.informationPreservation).toBeGreaterThanOrEqual(0);
      expect(result.quality.informationPreservation).toBeLessThanOrEqual(1);
      expect(result.quality.structuralSimilarity).toBeGreaterThanOrEqual(0);
      expect(result.quality.structuralSimilarity).toBeLessThanOrEqual(1);
      expect(result.quality.confidence).toBeGreaterThanOrEqual(0);
      expect(result.quality.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('performance', () => {
    it('should process features within reasonable time', async () => {
      const translator = new FeatureTranslation();
      const sourceFeatures = createMockFeatureVector([20, 768]); // Larger feature set

      const startTime = performance.now();
      const result = await translator.translateFeatures(sourceFeatures);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      // Processing should complete in a reasonable time (adjust as needed)
      expect(processingTime).toBeLessThan(5000); // 5 seconds max

      // Stats should include processing time
      expect(result.stats.processingTimeMs).toBeGreaterThan(0);
      expect(result.stats.processingTimeMs).toBeLessThanOrEqual(processingTime);
    });
  });
});
