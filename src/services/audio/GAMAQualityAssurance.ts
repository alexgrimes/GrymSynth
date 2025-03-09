import { Logger } from "../../utils/logger";
import { BasicFeatures, ProcessedAudio } from "../../interfaces/audio";

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface ValidationResult {
  valid: boolean;
  checks: ValidationCheck[];
  timestamp: Date;
  error?: Error;
}

export interface QualityReport {
  timeRange?: TimeRange;
  overallMetrics: {
    totalCount: number;
    validCount: number;
    validPercentage: number;
    trend: Trend;
  };
  typeMetrics: TypeMetrics[];
  timestamp: Date;
}

export interface TypeMetrics {
  type: string;
  totalCount: number;
  validCount: number;
  validPercentage: number;
  commonIssues: CommonIssue[];
}

export interface CommonIssue {
  name: string;
  count: number;
  percentage: number;
}

export interface Trend {
  direction: 'improving' | 'degrading' | 'stable';
  change: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface QualityMetricsConfig {
  storageConfig: any;
  thresholds?: {
    [key: string]: number;
  };
}

export interface AudioFeaturesValidatorConfig {
  expectedDimensions: number;
  minValue: number;
  maxValue: number;
  nanThreshold?: number;
  zeroThreshold?: number;
}

export interface PatternValidatorConfig {
  minPatternLength: number;
  maxPatternLength: number;
  minConfidence: number;
}

export interface ResponseTimeValidatorConfig {
  maxResponseTime: number;
  warningThreshold: number;
}

export interface QAConfig {
  audioFeaturesConfig: AudioFeaturesValidatorConfig;
  patternConfig: PatternValidatorConfig;
  responseTimeConfig: ResponseTimeValidatorConfig;
  metricsConfig: QualityMetricsConfig;
  logConfig?: any;
}

/**
 * Interface for validators
 */
export interface Validator {
  validate(output: any, context?: any): Promise<ValidationResult>;
}

/**
 * Validator for audio features
 */
export class AudioFeaturesValidator implements Validator {
  private config: AudioFeaturesValidatorConfig;
  private logger: Logger;

  constructor(config: AudioFeaturesValidatorConfig) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-qa-audio-features" });
  }

  async validate(features: BasicFeatures, context?: any): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];

    try {
      // Check if features exist
      if (!features || !features.features || !Array.isArray(features.features)) {
        return {
          valid: false,
          checks: [{
            name: 'features-exist',
            passed: false,
            details: 'Features array is missing or invalid'
          }],
          timestamp: new Date()
        };
      }

      // Check feature count
      checks.push({
        name: 'feature-count',
        passed: features.features.length > 0,
        details: features.features.length > 0
          ? `Found ${features.features.length} feature vectors`
          : 'No feature vectors found'
      });

      if (features.features.length === 0) {
        return {
          valid: false,
          checks,
          timestamp: new Date()
        };
      }

      // Check first feature vector dimensions
      const firstFeature = features.features[0];
      const dimensions = firstFeature.length;

      checks.push({
        name: 'dimensions',
        passed: dimensions === this.config.expectedDimensions,
        details: `Expected ${this.config.expectedDimensions} dimensions, got ${dimensions}`
      });

      // Check for NaN values
      let nanCount = 0;
      let outOfRangeCount = 0;
      let zeroCount = 0;

      for (const feature of features.features) {
        for (const value of feature) {
          if (isNaN(value)) {
            nanCount++;
          } else if (value < this.config.minValue || value > this.config.maxValue) {
            outOfRangeCount++;
          } else if (value === 0) {
            zeroCount++;
          }
        }
      }

      const totalValues = features.features.reduce((sum, feature) => sum + feature.length, 0);
      const nanPercentage = (nanCount / totalValues) * 100;
      const outOfRangePercentage = (outOfRangeCount / totalValues) * 100;
      const zeroPercentage = (zeroCount / totalValues) * 100;

      // Check for NaN values
      checks.push({
        name: 'nan-check',
        passed: nanPercentage <= (this.config.nanThreshold || 0),
        details: nanCount > 0
          ? `Contains ${nanCount} NaN values (${nanPercentage.toFixed(2)}%)`
          : 'No NaN values found'
      });

      // Check value range
      checks.push({
        name: 'range-check',
        passed: outOfRangePercentage <= 5, // Allow up to 5% out of range
        details: outOfRangeCount > 0
          ? `Contains ${outOfRangeCount} out-of-range values (${outOfRangePercentage.toFixed(2)}%)`
          : 'All values within range'
      });

      // Check for too many zeros (potential issue)
      checks.push({
        name: 'zero-check',
        passed: zeroPercentage <= (this.config.zeroThreshold || 20), // Allow up to 20% zeros by default
        details: zeroCount > 0
          ? `Contains ${zeroCount} zero values (${zeroPercentage.toFixed(2)}%)`
          : 'No zero values found'
      });

      // Check metadata
      checks.push({
        name: 'metadata-check',
        passed: !!features.metadata && typeof features.metadata === 'object',
        details: features.metadata ? 'Metadata present' : 'Metadata missing'
      });

      return {
        valid: checks.every(check => check.passed),
        checks,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error("Error validating audio features", {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        valid: false,
        checks,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

/**
 * Validator for pattern recognition
 */
export class PatternRecognitionValidator implements Validator {
  private config: PatternValidatorConfig;
  private logger: Logger;

  constructor(config: PatternValidatorConfig) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-qa-pattern" });
  }

  async validate(result: any, context?: any): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];

    try {
      // Check if result exists
      if (!result || !result.matches || !Array.isArray(result.matches)) {
        return {
          valid: false,
          checks: [{
            name: 'result-structure',
            passed: false,
            details: 'Result structure is invalid or missing matches array'
          }],
          timestamp: new Date()
        };
      }

      // Check matches structure
      const validMatches = result.matches.every((match: any) =>
        typeof match === 'object' &&
        typeof match.id === 'string' &&
        typeof match.similarity === 'number'
      );

      checks.push({
        name: 'matches-structure',
        passed: validMatches,
        details: validMatches
          ? 'Matches have valid structure'
          : 'One or more matches have invalid structure'
      });

      // Check similarity scores
      const validSimilarities = result.matches.every((match: any) =>
        match.similarity >= 0 && match.similarity <= 1
      );

      checks.push({
        name: 'similarity-range',
        passed: validSimilarities,
        details: validSimilarities
          ? 'All similarity scores are within valid range [0,1]'
          : 'One or more similarity scores are outside valid range'
      });

      // Check confidence threshold
      const highConfidenceMatches = result.matches.filter((match: any) =>
        match.similarity >= this.config.minConfidence
      );

      checks.push({
        name: 'confidence-threshold',
        passed: highConfidenceMatches.length > 0,
        details: highConfidenceMatches.length > 0
          ? `${highConfidenceMatches.length} matches above confidence threshold`
          : 'No matches above confidence threshold'
      });

      return {
        valid: checks.every(check => check.passed),
        checks,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error("Error validating pattern recognition", {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        valid: false,
        checks,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

/**
 * Validator for response time
 */
export class ResponseTimeValidator implements Validator {
  private config: ResponseTimeValidatorConfig;
  private logger: Logger;

  constructor(config: ResponseTimeValidatorConfig) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-qa-response-time" });
  }

  async validate(result: any, context?: any): Promise<ValidationResult> {
    const checks: ValidationCheck[] = [];

    try {
      // Check if result and metadata exist
      if (!result || !result.metadata) {
        return {
          valid: false,
          checks: [{
            name: 'metadata-exists',
            passed: false,
            details: 'Result metadata is missing'
          }],
          timestamp: new Date()
        };
      }

      // Get duration from metadata or context
      const duration = result.metadata.duration || context?.duration;

      if (typeof duration !== 'number') {
        return {
          valid: false,
          checks: [{
            name: 'duration-exists',
            passed: false,
            details: 'Duration information is missing or invalid'
          }],
          timestamp: new Date()
        };
      }

      // Check if duration is within acceptable range
      const isAcceptable = duration <= this.config.maxResponseTime;
      const isWarning = duration > this.config.warningThreshold && duration <= this.config.maxResponseTime;

      checks.push({
        name: 'response-time',
        passed: isAcceptable,
        details: isAcceptable
          ? isWarning
            ? `Response time (${duration}ms) is within acceptable range but above warning threshold`
            : `Response time (${duration}ms) is within acceptable range`
          : `Response time (${duration}ms) exceeds maximum allowed (${this.config.maxResponseTime}ms)`
      });

      return {
        valid: checks.every(check => check.passed),
        checks,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error("Error validating response time", {
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        valid: false,
        checks,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

/**
 * Simple in-memory metrics storage
 */
export class MetricsStorage {
  private results: Map<string, ValidationResult[]> = new Map();
  private config: any;
  private logger: Logger;

  constructor(config: any) {
    this.config = config;
    this.logger = new Logger({ namespace: "gama-qa-storage" });
  }

  async storeValidationResult(type: string, result: ValidationResult): Promise<void> {
    try {
      // Get existing results for this type
      const typeResults = this.results.get(type) || [];

      // Add type to result for reporting
      const resultWithType = { ...result, type };

      // Add to results
      typeResults.push(resultWithType);

      // Store updated results
      this.results.set(type, typeResults);

      // Limit storage size if needed
      this.pruneOldResults(type);
    } catch (error) {
      this.logger.error("Error storing validation result", {
        error: error instanceof Error ? error.message : String(error),
        type
      });
    }
  }

  async getValidationResults(timeRange?: TimeRange): Promise<any[]> {
    try {
      // Flatten all results
      const allResults: any[] = [];

      for (const typeResults of this.results.values()) {
        allResults.push(...typeResults);
      }

      // Filter by time range if provided
      if (timeRange) {
        return allResults.filter(result => {
          const timestamp = result.timestamp.getTime();
          return timestamp >= timeRange.start.getTime() && timestamp <= timeRange.end.getTime();
        });
      }

      return allResults;
    } catch (error) {
      this.logger.error("Error retrieving validation results", {
        error: error instanceof Error ? error.message : String(error)
      });

      return [];
    }
  }

  private pruneOldResults(type: string): void {
    const typeResults = this.results.get(type);

    if (!typeResults) return;

    // Keep only the most recent results (e.g., last 1000)
    const maxResults = this.config.maxResultsPerType || 1000;

    if (typeResults.length > maxResults) {
      // Sort by timestamp (newest first)
      typeResults.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Keep only the most recent
      this.results.set(type, typeResults.slice(0, maxResults));
    }
  }
}

/**
 * Quality metrics collector and reporter
 */
export class QualityMetrics {
  private storage: MetricsStorage;
  private config: QualityMetricsConfig;
  private logger: Logger;

  constructor(config: QualityMetricsConfig) {
    this.config = config;
    this.storage = new MetricsStorage(config.storageConfig);
    this.logger = new Logger({ namespace: "gama-qa-metrics" });
  }

  async record(type: string, result: ValidationResult): Promise<void> {
    await this.storage.storeValidationResult(type, result);
  }

  async generateReport(timeRange?: TimeRange): Promise<QualityReport> {
    try {
      const results = await this.storage.getValidationResults(timeRange);

      // Calculate metrics
      const totalCount = results.length;
      const validCount = results.filter(result => result.valid).length;
      const validPercentage = totalCount > 0 ? (validCount / totalCount) * 100 : 100;

      // Group by type
      const byType = new Map<string, any[]>();
      for (const result of results) {
        const type = result.type || 'unknown';
        const typeResults = byType.get(type) || [];
        typeResults.push(result);
        byType.set(type, typeResults);
      }

      // Generate type-specific metrics
      const typeMetrics = Array.from(byType.entries()).map(([type, typeResults]) => {
        const typeValidCount = typeResults.filter(result => result.valid).length;
        const typeValidPercentage = typeResults.length > 0 ? (typeValidCount / typeResults.length) * 100 : 100;

        return {
          type,
          totalCount: typeResults.length,
          validCount: typeValidCount,
          validPercentage: typeValidPercentage,
          commonIssues: this.identifyCommonIssues(typeResults)
        };
      });

      return {
        timeRange,
        overallMetrics: {
          totalCount,
          validCount,
          validPercentage,
          trend: this.calculateTrend(results)
        },
        typeMetrics,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error("Error generating quality report", {
        error: error instanceof Error ? error.message : String(error)
      });

      // Return empty report
      return {
        timeRange,
        overallMetrics: {
          totalCount: 0,
          validCount: 0,
          validPercentage: 0,
          trend: { direction: 'stable', change: 0 }
        },
        typeMetrics: [],
        timestamp: new Date()
      };
    }
  }

  private identifyCommonIssues(results: any[]): CommonIssue[] {
    // Identify common validation issues
    const issueCounter = new Map<string, number>();

    for (const result of results) {
      if (!result.valid && result.checks) {
        for (const check of result.checks) {
          if (!check.passed) {
            const count = issueCounter.get(check.name) || 0;
            issueCounter.set(check.name, count + 1);
          }
        }
      }
    }

    return Array.from(issueCounter.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / results.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateTrend(results: any[]): Trend {
    // Calculate trend over time
    // This is a simplified implementation
    if (results.length < 2) {
      return { direction: 'stable', change: 0 };
    }

    // Sort by timestamp
    const sorted = [...results].sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Split into two halves
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    // Calculate valid percentage for each half
    const firstHalfValid = firstHalf.filter(r => r.valid).length / firstHalf.length;
    const secondHalfValid = secondHalf.filter(r => r.valid).length / secondHalf.length;

    const change = secondHalfValid - firstHalfValid;

    return {
      direction: change > 0.05 ? 'improving' : change < -0.05 ? 'degrading' : 'stable',
      change: change * 100 // Convert to percentage
    };
  }
}

/**
 * Main quality assurance system for GAMA
 */
export class GAMAQualityAssurance {
  private validators: Map<string, Validator> = new Map();
  private qualityMetrics: QualityMetrics;
  private logger: Logger;

  constructor(config: QAConfig) {
    this.logger = new Logger({ namespace: "gama-quality-assurance" });
    this.initializeValidators(config);
    this.qualityMetrics = new QualityMetrics(config.metricsConfig);
  }

  /**
   * Validate output from GAMA operations
   */
  async validateOutput(output: any, type: string, context?: any): Promise<ValidationResult> {
    this.logger.debug(`Validating output of type: ${type}`, { context });

    const validator = this.validators.get(type);

    if (!validator) {
      this.logger.warn(`No validator found for type: ${type}`);
      return {
        valid: true, // Default to valid if no validator exists
        checks: [],
        timestamp: new Date()
      };
    }

    try {
      const result = await validator.validate(output, context);
      await this.qualityMetrics.record(type, result);

      if (!result.valid) {
        this.logger.warn(`Validation failed for type: ${type}`, {
          checks: result.checks.filter(check => !check.passed),
          context
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Error during validation: ${error instanceof Error ? error.message : String(error)}`, { type, context });

      return {
        valid: false,
        checks: [{
          name: 'validation-error',
          passed: false,
          details: `Validation process failed: ${error instanceof Error ? error.message : String(error)}`
        }],
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Get quality report for a time range
   */
  async getQualityReport(timeRange?: TimeRange): Promise<QualityReport> {
    return await this.qualityMetrics.generateReport(timeRange);
  }

  /**
   * Initialize validators based on config
   */
  private initializeValidators(config: QAConfig): void {
    // Clear existing validators
    this.validators.clear();

    // Add validators individually to avoid type issues
    this.validators.set('audio-features', new AudioFeaturesValidator(config.audioFeaturesConfig));
    this.validators.set('pattern-recognition', new PatternRecognitionValidator(config.patternConfig));
    this.validators.set('response-time', new ResponseTimeValidator(config.responseTimeConfig));
  }
}
