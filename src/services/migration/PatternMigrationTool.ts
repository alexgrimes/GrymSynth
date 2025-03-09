import { Pattern, FeatureMap, AudioFeatureVector } from "../../lib/feature-memory/interfaces";
import { FeatureTranslation, FeatureTranslationOptions, TranslationResult } from "./FeatureTranslation";
import { Logger } from "../../utils/logger";
import { performance } from "perf_hooks";
import * as fs from "fs";
import * as path from "path";

/**
 * Configuration options for pattern migration
 */
export interface PatternMigrationOptions {
  /**
   * Options for feature translation
   */
  translationOptions?: FeatureTranslationOptions;

  /**
   * Batch size for processing patterns
   */
  batchSize?: number;

  /**
   * Whether to validate migrated patterns
   */
  validateMigration?: boolean;

  /**
   * Minimum validation score to consider migration successful
   */
  validationThreshold?: number;

  /**
   * Directory to save migration logs
   */
  logDirectory?: string;

  /**
   * Whether to preserve original pattern IDs
   */
  preserveIds?: boolean;
}

/**
 * Result of a single pattern migration
 */
export interface PatternMigrationResult {
  /**
   * Original pattern ID
   */
  originalId: string;

  /**
   * Migrated pattern ID
   */
  migratedId: string;

  /**
   * Whether the migration was successful
   */
  success: boolean;

  /**
   * Migration quality metrics
   */
  quality?: {
    /**
     * Information preservation score (0-1)
     */
    informationPreservation: number;

    /**
     * Structural similarity score (0-1)
     */
    structuralSimilarity: number;

    /**
     * Overall confidence in the migration (0-1)
     */
    confidence: number;
  };

  /**
   * Error message if migration failed
   */
  error?: string;

  /**
   * Processing time in milliseconds
   */
  processingTimeMs: number;
}

/**
 * Result of a batch migration
 */
export interface BatchMigrationResult {
  /**
   * Total number of patterns processed
   */
  totalPatterns: number;

  /**
   * Number of successfully migrated patterns
   */
  successCount: number;

  /**
   * Number of failed migrations
   */
  failureCount: number;

  /**
   * Average quality score for successful migrations
   */
  averageQuality: number;

  /**
   * Individual migration results
   */
  results: PatternMigrationResult[];

  /**
   * Total processing time in milliseconds
   */
  totalProcessingTimeMs: number;
}

/**
 * Tool for migrating patterns from wav2vec2 format to GAMA format
 */
export class PatternMigrationTool {
  private featureTranslation: FeatureTranslation;
  private logger: Logger;
  private options: Required<PatternMigrationOptions>;

  /**
   * Default options for pattern migration
   */
  private static readonly DEFAULT_OPTIONS: Required<PatternMigrationOptions> = {
    translationOptions: {},
    batchSize: 50,
    validateMigration: true,
    validationThreshold: 0.7,
    logDirectory: "./logs/migration",
    preserveIds: true
  };

  constructor(options?: PatternMigrationOptions) {
    this.options = { ...PatternMigrationTool.DEFAULT_OPTIONS, ...options };
    this.featureTranslation = new FeatureTranslation(this.options.translationOptions);
    this.logger = new Logger({ namespace: "pattern-migration" });

    // Ensure log directory exists
    if (this.options.logDirectory) {
      fs.mkdirSync(this.options.logDirectory, { recursive: true });
    }
  }

  /**
   * Migrates a single pattern from wav2vec2 format to GAMA format
   *
   * @param pattern The pattern to migrate
   * @returns The migrated pattern and migration result
   */
  public async migratePattern(pattern: Pattern): Promise<{
    migratedPattern: Pattern;
    result: PatternMigrationResult;
  }> {
    const startTime = performance.now();

    const result: PatternMigrationResult = {
      originalId: pattern.id,
      migratedId: this.options.preserveIds ? pattern.id : `gama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      success: false,
      processingTimeMs: 0
    };

    try {
      // Extract wav2vec2 features from pattern
      const featureVector = this.extractFeatureVectorFromPattern(pattern);

      // Translate features to GAMA format
      const translationResult = await this.featureTranslation.translateFeatures(featureVector);

      // Create migrated pattern
      const migratedPattern = this.createMigratedPattern(pattern, translationResult, result.migratedId);

      // Validate migration if required
      if (this.options.validateMigration) {
        const validationResult = this.validateMigration(featureVector, translationResult);
        result.quality = validationResult.quality;

        if (!validationResult.valid) {
          throw new Error(`Migration validation failed: confidence ${validationResult.quality.confidence} below threshold ${this.options.validationThreshold}`);
        }
      } else {
        result.quality = translationResult.quality;
      }

      result.success = true;

      const processingTime = performance.now() - startTime;
      result.processingTimeMs = processingTime;

      this.logger.info("Pattern migration successful", {
        originalId: pattern.id,
        migratedId: result.migratedId,
        quality: result.quality,
        processingTimeMs: processingTime
      });

      return { migratedPattern, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.error = errorMessage;
      result.processingTimeMs = performance.now() - startTime;

      this.logger.error("Pattern migration failed", {
        originalId: pattern.id,
        error: errorMessage
      });

      // Create an empty pattern with error metadata
      const errorPattern: Pattern = {
        id: result.migratedId,
        features: new FeatureMap(),
        confidence: 0,
        timestamp: new Date(),
        metadata: {
          source: "gama_migration_error",
          category: "audio",
          frequency: 0,
          lastUpdated: new Date()
        }
      };

      return { migratedPattern: errorPattern, result };
    }
  }

  /**
   * Migrates a batch of patterns from wav2vec2 format to GAMA format
   *
   * @param patterns The patterns to migrate
   * @returns The migrated patterns and batch migration result
   */
  public async migratePatterns(patterns: Pattern[]): Promise<{
    migratedPatterns: Pattern[];
    result: BatchMigrationResult;
  }> {
    const startTime = performance.now();

    this.logger.info(`Starting batch migration of ${patterns.length} patterns`);

    const batchSize = this.options.batchSize;
    const results: PatternMigrationResult[] = [];
    const migratedPatterns: Pattern[] = [];

    // Process patterns in batches
    for (let i = 0; i < patterns.length; i += batchSize) {
      const batchStartTime = performance.now();
      const batch = patterns.slice(i, i + batchSize);

      this.logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(patterns.length / batchSize)}`, {
        batchSize: batch.length,
        totalProcessed: i,
        totalPatterns: patterns.length
      });

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(pattern => this.migratePattern(pattern))
      );

      // Collect results
      for (const { migratedPattern, result } of batchResults) {
        results.push(result);
        migratedPatterns.push(migratedPattern);
      }

      const batchProcessingTime = performance.now() - batchStartTime;

      this.logger.info(`Batch processed`, {
        batchSize: batch.length,
        successCount: batchResults.filter(r => r.result.success).length,
        failureCount: batchResults.filter(r => !r.result.success).length,
        processingTimeMs: batchProcessingTime
      });

      // Log batch results
      this.logBatchResults(results, i / batchSize);
    }

    // Calculate batch statistics
    const successResults = results.filter(r => r.success);
    const totalProcessingTime = performance.now() - startTime;

    const batchResult: BatchMigrationResult = {
      totalPatterns: patterns.length,
      successCount: successResults.length,
      failureCount: results.length - successResults.length,
      averageQuality: successResults.length > 0
        ? successResults.reduce((sum, r) => sum + (r.quality?.confidence || 0), 0) / successResults.length
        : 0,
      results,
      totalProcessingTimeMs: totalProcessingTime
    };

    this.logger.info("Batch migration completed", {
      totalPatterns: batchResult.totalPatterns,
      successCount: batchResult.successCount,
      failureCount: batchResult.failureCount,
      averageQuality: batchResult.averageQuality,
      totalProcessingTimeMs: batchResult.totalProcessingTimeMs
    });

    // Log final results
    this.logFinalResults(batchResult);

    return { migratedPatterns, result: batchResult };
  }

  /**
   * Extracts a feature vector from a pattern
   *
   * @param pattern The pattern to extract features from
   * @returns The extracted feature vector
   */
  private extractFeatureVectorFromPattern(pattern: Pattern): AudioFeatureVector {
    // Get feature data from pattern
    const featureData = pattern.features.get("featureData") as number[];
    if (!featureData) {
      throw new Error(`Pattern ${pattern.id} does not contain featureData`);
    }

    // Get dimensions from pattern
    const dimensions = pattern.features.get("dimensions") as number[];
    if (!dimensions || dimensions.length !== 2) {
      throw new Error(`Pattern ${pattern.id} has invalid dimensions`);
    }

    // Get timeSteps from pattern
    const timeSteps = pattern.features.get("timeSteps") as number[];
    if (!timeSteps || timeSteps.length !== 1) {
      throw new Error(`Pattern ${pattern.id} has invalid timeSteps`);
    }

    // Get sampleRate from pattern
    const sampleRate = pattern.features.get("sampleRate") as number[];
    if (!sampleRate || sampleRate.length !== 1) {
      throw new Error(`Pattern ${pattern.id} has invalid sampleRate`);
    }

    // Get duration from pattern
    const duration = pattern.features.get("duration") as number[];
    if (!duration || duration.length !== 1) {
      throw new Error(`Pattern ${pattern.id} has invalid duration`);
    }

    // Get channels from pattern
    const channels = pattern.features.get("channels") as number[];
    if (!channels || channels.length !== 1) {
      throw new Error(`Pattern ${pattern.id} has invalid channels`);
    }

    // Reconstruct feature frames
    const [featureCount, featureLength] = dimensions;
    const features: Float32Array[] = [];

    for (let i = 0; i < featureCount; i++) {
      const frameStart = i * featureLength;
      const frame = new Float32Array(featureLength);

      for (let j = 0; j < featureLength; j++) {
        frame[j] = featureData[frameStart + j];
      }

      features.push(frame);
    }

    // Create feature vector
    return {
      features,
      featureCount,
      timestamp: pattern.timestamp,
      metadata: {
        type: "wav2vec2_features",
        dimensions,
        sampleRate: sampleRate[0],
        duration: duration[0],
        channels: channels[0],
        timeSteps: timeSteps[0]
      }
    };
  }

  /**
   * Creates a migrated pattern from translation results
   *
   * @param originalPattern The original pattern
   * @param translationResult The translation result
   * @param migratedId The ID for the migrated pattern
   * @returns The migrated pattern
   */
  private createMigratedPattern(
    originalPattern: Pattern,
    translationResult: TranslationResult,
    migratedId: string
  ): Pattern {
    // Serialize features
    const serializedFeatures = translationResult.features.map(frame => Array.from(frame));
    const dimensions = translationResult.metadata.dimensions;
    const timeSteps = translationResult.metadata.timeSteps || translationResult.features.length;

    // Create feature entries
    const featureEntries: [string, number[]][] = [
      ["featureData", serializedFeatures.flat()],
      ["dimensions", dimensions],
      ["timeSteps", [timeSteps]],
      ["sampleRate", [translationResult.metadata.sampleRate]],
      // Preserve original metadata where possible
      ["duration", originalPattern.features.get("duration") as number[] || [0]],
      ["channels", originalPattern.features.get("channels") as number[] || [1]]
    ];

    // Create migrated pattern
    return {
      id: migratedId,
      features: new FeatureMap(featureEntries),
      confidence: translationResult.quality.confidence,
      timestamp: new Date(),
      metadata: {
        source: "gama",
        category: originalPattern.metadata.category,
        frequency: originalPattern.metadata.frequency,
        lastUpdated: new Date()
      }
    };
  }

  /**
   * Validates migration quality
   *
   * @param sourceFeatures The source feature vector
   * @param translationResult The translation result
   * @returns Validation result
   */
  private validateMigration(
    sourceFeatures: AudioFeatureVector,
    translationResult: TranslationResult
  ): {
    valid: boolean;
    quality: {
      informationPreservation: number;
      structuralSimilarity: number;
      confidence: number;
    };
  } {
    const { quality } = translationResult;

    // Check if confidence is above threshold
    const valid = quality.confidence >= this.options.validationThreshold;

    return { valid, quality };
  }

  /**
   * Logs batch results to file
   *
   * @param results The migration results
   * @param batchIndex The batch index
   */
  private logBatchResults(results: PatternMigrationResult[], batchIndex: number): void {
    if (!this.options.logDirectory) return;

    const logFile = path.join(this.options.logDirectory, `batch_${batchIndex}_results.json`);

    try {
      fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
    } catch (error) {
      this.logger.error("Failed to write batch log", {
        error: error instanceof Error ? error.message : String(error),
        logFile
      });
    }
  }

  /**
   * Logs final migration results to file
   *
   * @param result The batch migration result
   */
  private logFinalResults(result: BatchMigrationResult): void {
    if (!this.options.logDirectory) return;

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const logFile = path.join(this.options.logDirectory, `migration_summary_${timestamp}.json`);

    try {
      // Create a summary without the full results array to keep the log file small
      const summary = {
        totalPatterns: result.totalPatterns,
        successCount: result.successCount,
        failureCount: result.failureCount,
        averageQuality: result.averageQuality,
        totalProcessingTimeMs: result.totalProcessingTimeMs,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(logFile, JSON.stringify(summary, null, 2));

      // Create a CSV file with pattern-level results
      const csvFile = path.join(this.options.logDirectory, `migration_details_${timestamp}.csv`);
      const csvHeader = "originalId,migratedId,success,informationPreservation,structuralSimilarity,confidence,processingTimeMs,error\n";
      const csvRows = result.results.map(r => {
        return [
          r.originalId,
          r.migratedId,
          r.success,
          r.quality?.informationPreservation || 0,
          r.quality?.structuralSimilarity || 0,
          r.quality?.confidence || 0,
          r.processingTimeMs,
          r.error ? `"${r.error.replace(/"/g, '""')}"` : ""
        ].join(",");
      }).join("\n");

      fs.writeFileSync(csvFile, csvHeader + csvRows);
    } catch (error) {
      this.logger.error("Failed to write final log", {
        error: error instanceof Error ? error.message : String(error),
        logFile
      });
    }
  }
}
