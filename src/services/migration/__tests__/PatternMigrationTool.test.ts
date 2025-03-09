import { PatternMigrationTool, PatternMigrationOptions } from '../PatternMigrationTool';
import { Pattern, FeatureMap } from '../../../lib/feature-memory/interfaces';
import * as fs from 'fs';
import * as path from 'path';

// Mock the fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

describe('PatternMigrationTool', () => {
  // Create a mock Pattern for testing
  const createMockPattern = (id: string = `pattern_${Date.now()}`): Pattern => {
    // Create feature data
    const featureCount = 10;
    const featureLength = 768;
    const featureData: number[] = [];

    for (let i = 0; i < featureCount; i++) {
      for (let j = 0; j < featureLength; j++) {
        // Generate deterministic test values
        featureData.push(Math.sin(i * 0.1 + j * 0.01));
      }
    }

    // Create feature entries
    const featureEntries: [string, number[]][] = [
      ["featureData", featureData],
      ["dimensions", [featureCount, featureLength]],
      ["timeSteps", [featureCount]],
      ["sampleRate", [16000]],
      ["duration", [5.0]],
      ["channels", [1]]
    ];

    return {
      id,
      features: new FeatureMap(featureEntries),
      confidence: 0.85,
      timestamp: new Date(),
      metadata: {
        source: "wav2vec2",
        category: "audio_test",
        frequency: 1,
        lastUpdated: new Date()
      }
    };
  };

  // Create a batch of mock patterns
  const createMockPatterns = (count: number): Pattern[] => {
    const patterns: Pattern[] = [];
    for (let i = 0; i < count; i++) {
      patterns.push(createMockPattern(`pattern_${i}`));
    }
    return patterns;
  };

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const migrationTool = new PatternMigrationTool();
      expect(migrationTool).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const options: PatternMigrationOptions = {
        translationOptions: {
          targetDimension: 256,
          dimensionalityReductionMethod: 'max-pooling'
        },
        batchSize: 20,
        validateMigration: true,
        validationThreshold: 0.8,
        logDirectory: './custom-logs',
        preserveIds: false
      };

      const migrationTool = new PatternMigrationTool(options);
      expect(migrationTool).toBeDefined();

      // Should create log directory
      expect(fs.mkdirSync).toHaveBeenCalledWith('./custom-logs', { recursive: true });
    });
  });

  describe('migratePattern', () => {
    it('should migrate a single pattern successfully', async () => {
      const migrationTool = new PatternMigrationTool({
        translationOptions: {
          targetDimension: 512
        }
      });

      const pattern = createMockPattern();
      const { migratedPattern, result } = await migrationTool.migratePattern(pattern);

      // Check result
      expect(result.success).toBe(true);
      expect(result.originalId).toBe(pattern.id);
      expect(result.migratedId).toBe(pattern.id); // preserveIds is true by default
      expect(result.processingTimeMs).toBeGreaterThan(0);
      expect(result.quality).toBeDefined();

      // Check migrated pattern
      expect(migratedPattern).toBeDefined();
      expect(migratedPattern.id).toBe(pattern.id);
      expect(migratedPattern.metadata.source).toBe('gama');
      expect(migratedPattern.metadata.category).toBe(pattern.metadata.category);

      // Check feature dimensions
      const dimensions = migratedPattern.features.get('dimensions') as number[];
      expect(dimensions[0]).toBe(512); // Target dimension

      // Check feature data
      const featureData = migratedPattern.features.get('featureData') as number[];
      expect(featureData).toBeDefined();
      expect(featureData.length).toBeGreaterThan(0);
    });

    it('should generate new IDs when preserveIds is false', async () => {
      const migrationTool = new PatternMigrationTool({
        preserveIds: false
      });

      const pattern = createMockPattern();
      const { migratedPattern, result } = await migrationTool.migratePattern(pattern);

      expect(result.originalId).toBe(pattern.id);
      expect(result.migratedId).not.toBe(pattern.id);
      expect(result.migratedId).toContain('gama_');
      expect(migratedPattern.id).toBe(result.migratedId);
    });

    it('should handle invalid patterns gracefully', async () => {
      const migrationTool = new PatternMigrationTool();

      // Create an invalid pattern (missing required feature data)
      const invalidPattern: Pattern = {
        id: 'invalid_pattern',
        features: new FeatureMap(),
        confidence: 0.5,
        timestamp: new Date(),
        metadata: {
          source: 'wav2vec2',
          category: 'test',
          frequency: 1,
          lastUpdated: new Date()
        }
      };

      const { migratedPattern, result } = await migrationTool.migratePattern(invalidPattern);

      // Check result
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);

      // Check error pattern
      expect(migratedPattern).toBeDefined();
      expect(migratedPattern.metadata.source).toBe('gama_migration_error');
      expect(migratedPattern.confidence).toBe(0);
    });

    it('should validate migration quality when required', async () => {
      const migrationTool = new PatternMigrationTool({
        validateMigration: true,
        validationThreshold: 0.9 // High threshold
      });

      // Create a pattern that might not meet the high threshold
      const pattern = createMockPattern();

      // Mock the validation to fail
      const originalValidateMigration = (migrationTool as any).validateMigration;
      (migrationTool as any).validateMigration = jest.fn().mockReturnValue({
        valid: false,
        quality: {
          informationPreservation: 0.7,
          structuralSimilarity: 0.6,
          confidence: 0.65
        }
      });

      const { result } = await migrationTool.migratePattern(pattern);

      // Should fail validation
      expect(result.success).toBe(false);
      expect(result.error).toContain('Migration validation failed');

      // Restore original method
      (migrationTool as any).validateMigration = originalValidateMigration;
    });
  });

  describe('migratePatterns', () => {
    it('should migrate a batch of patterns', async () => {
      const migrationTool = new PatternMigrationTool({
        batchSize: 5
      });

      const patterns = createMockPatterns(12); // 12 patterns, should be processed in 3 batches
      const { migratedPatterns, result } = await migrationTool.migratePatterns(patterns);

      // Check results
      expect(result.totalPatterns).toBe(12);
      expect(result.successCount).toBe(12);
      expect(result.failureCount).toBe(0);
      expect(result.averageQuality).toBeGreaterThan(0);
      expect(result.totalProcessingTimeMs).toBeGreaterThan(0);
      expect(result.results.length).toBe(12);

      // Check migrated patterns
      expect(migratedPatterns.length).toBe(12);
      expect(migratedPatterns[0].metadata.source).toBe('gama');

      // Check that log files were created
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle mixed success/failure in batch migration', async () => {
      const migrationTool = new PatternMigrationTool();

      // Create some valid and some invalid patterns
      const validPatterns = createMockPatterns(3);
      const invalidPatterns: Pattern[] = [
        {
          id: 'invalid_1',
          features: new FeatureMap(),
          confidence: 0.5,
          timestamp: new Date(),
          metadata: {
            source: 'wav2vec2',
            category: 'test',
            frequency: 1,
            lastUpdated: new Date()
          }
        },
        {
          id: 'invalid_2',
          features: new FeatureMap(),
          confidence: 0.5,
          timestamp: new Date(),
          metadata: {
            source: 'wav2vec2',
            category: 'test',
            frequency: 1,
            lastUpdated: new Date()
          }
        }
      ];

      const mixedPatterns = [...validPatterns, ...invalidPatterns];
      const { migratedPatterns, result } = await migrationTool.migratePatterns(mixedPatterns);

      // Check results
      expect(result.totalPatterns).toBe(5);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(2);
      expect(result.results.length).toBe(5);

      // Check migrated patterns
      expect(migratedPatterns.length).toBe(5);

      // Check that error patterns were created for invalid patterns
      const errorPatterns = migratedPatterns.filter(p => p.metadata.source === 'gama_migration_error');
      expect(errorPatterns.length).toBe(2);
    });

    it('should respect batch size setting', async () => {
      const batchSize = 2;
      const migrationTool = new PatternMigrationTool({
        batchSize
      });

      // Mock the migratePattern method to track calls
      const originalMigratePattern = migrationTool.migratePattern;
      migrationTool.migratePattern = jest.fn().mockImplementation(
        (pattern: Pattern) => originalMigratePattern.call(migrationTool, pattern)
      );

      const patterns = createMockPatterns(5);
      await migrationTool.migratePatterns(patterns);

      // Should have processed in 3 batches (2, 2, 1)
      expect(fs.writeFileSync).toHaveBeenCalledTimes(4); // 3 batch logs + 1 final log
    });
  });

  describe('logging', () => {
    it('should log migration results', async () => {
      const logDirectory = './test-logs';
      const migrationTool = new PatternMigrationTool({
        logDirectory
      });

      const patterns = createMockPatterns(3);
      await migrationTool.migratePatterns(patterns);

      // Should create log directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(logDirectory, { recursive: true });

      // Should write batch logs and final log
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // 1 batch log + 1 final log
    });

    it('should skip logging if logDirectory is not provided', async () => {
      const migrationTool = new PatternMigrationTool({
        logDirectory: undefined
      });

      const patterns = createMockPatterns(3);
      await migrationTool.migratePatterns(patterns);

      // Should not create log directory or write logs
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});
