import { AudioFeatureVector, AudioFeatureMetadata } from "../../lib/feature-memory/interfaces";
import { Logger } from "../../utils/logger";

/**
 * Configuration options for feature translation
 */
export interface FeatureTranslationOptions {
  /**
   * Target dimension size for GAMA features (default: 512)
   */
  targetDimension?: number;

  /**
   * Method to use for dimensionality reduction
   */
  dimensionalityReductionMethod?: 'pca' | 'average-pooling' | 'max-pooling' | 'linear-projection';

  /**
   * Whether to normalize the output features
   */
  normalizeOutput?: boolean;

  /**
   * Threshold for validation checks
   */
  validationThreshold?: number;
}

/**
 * Result of feature translation process
 */
export interface TranslationResult {
  /**
   * Translated features in GAMA format
   */
  features: Float32Array[];

  /**
   * Metadata for the translated features
   */
  metadata: {
    type: string;
    dimensions: number[];
    sampleRate: number;
    timeSteps?: number;
  };

  /**
   * Quality metrics for the translation
   */
  quality: {
    /**
     * Information preservation score (0-1)
     */
    informationPreservation: number;

    /**
     * Structural similarity score (0-1)
     */
    structuralSimilarity: number;

    /**
     * Overall confidence in the translation (0-1)
     */
    confidence: number;
  };

  /**
   * Statistics about the translation process
   */
  stats: {
    /**
     * Original dimensions
     */
    originalDimensions: number[];

    /**
     * Target dimensions
     */
    targetDimensions: number[];

    /**
     * Processing time in milliseconds
     */
    processingTimeMs: number;
  };
}

/**
 * Handles translation of wav2vec2 feature vectors to GAMA feature vectors
 */
export class FeatureTranslation {
  private logger: Logger;
  private options: Required<FeatureTranslationOptions>;

  /**
   * Default options for feature translation
   */
  private static readonly DEFAULT_OPTIONS: Required<FeatureTranslationOptions> = {
    targetDimension: 512,
    dimensionalityReductionMethod: 'average-pooling',
    normalizeOutput: true,
    validationThreshold: 0.7
  };

  constructor(options?: FeatureTranslationOptions) {
    this.options = { ...FeatureTranslation.DEFAULT_OPTIONS, ...options };
    this.logger = new Logger({ namespace: "feature-translation" });
  }

  /**
   * Translates a wav2vec2 feature vector to GAMA format
   *
   * @param sourceFeatures The wav2vec2 feature vector to translate
   * @returns The translated GAMA feature vector
   */
  public async translateFeatures(sourceFeatures: AudioFeatureVector): Promise<TranslationResult> {
    const startTime = performance.now();

    this.logger.info("Starting feature translation", {
      sourceType: sourceFeatures.metadata.type,
      sourceDimensions: sourceFeatures.metadata.dimensions,
      targetDimension: this.options.targetDimension
    });

    // Validate input
    this.validateInput(sourceFeatures);

    // Perform dimensionality reduction
    const translatedFeatures = this.reduceDimensionality(sourceFeatures);

    // Normalize if required
    if (this.options.normalizeOutput) {
      for (let i = 0; i < translatedFeatures.length; i++) {
        translatedFeatures[i] = this.normalizeFeatureVector(translatedFeatures[i]);
      }
    }

    // Create metadata for translated features
    const metadata = this.createTranslatedMetadata(sourceFeatures.metadata);

    // Validate the translation quality
    const quality = this.validateTranslation(sourceFeatures, translatedFeatures);

    const processingTime = performance.now() - startTime;

    this.logger.info("Feature translation completed", {
      quality,
      processingTimeMs: processingTime
    });

    return {
      features: translatedFeatures,
      metadata,
      quality,
      stats: {
        originalDimensions: sourceFeatures.metadata.dimensions,
        targetDimensions: metadata.dimensions,
        processingTimeMs: processingTime
      }
    };
  }

  /**
   * Validates the input feature vector
   *
   * @param features The feature vector to validate
   * @throws Error if the feature vector is invalid
   */
  private validateInput(features: AudioFeatureVector): void {
    if (!features || !features.features || features.features.length === 0) {
      throw new Error("Invalid feature vector: empty or undefined");
    }

    if (!features.metadata || !features.metadata.dimensions) {
      throw new Error("Invalid feature vector: missing metadata or dimensions");
    }

    // Check for NaN or Infinity values
    for (const frame of features.features) {
      for (let i = 0; i < frame.length; i++) {
        if (isNaN(frame[i]) || !isFinite(frame[i])) {
          throw new Error("Invalid feature vector: contains NaN or Infinity values");
        }
      }
    }
  }

  /**
   * Reduces the dimensionality of the feature vector
   *
   * @param features The feature vector to reduce
   * @returns The reduced feature vector
   */
  private reduceDimensionality(features: AudioFeatureVector): Float32Array[] {
    const sourceFeatures = features.features;
    const sourceDimension = sourceFeatures[0].length;
    const targetDimension = this.options.targetDimension;

    // If dimensions are already the same, return a copy
    if (sourceDimension === targetDimension) {
      return sourceFeatures.map(frame => new Float32Array(frame));
    }

    const translatedFeatures: Float32Array[] = [];

    switch (this.options.dimensionalityReductionMethod) {
      case 'average-pooling':
        return this.averagePooling(sourceFeatures, targetDimension);

      case 'max-pooling':
        return this.maxPooling(sourceFeatures, targetDimension);

      case 'linear-projection':
        return this.linearProjection(sourceFeatures, targetDimension);

      case 'pca':
        // PCA would require a more complex implementation
        // For now, fall back to average pooling
        this.logger.warn("PCA not implemented, falling back to average pooling");
        return this.averagePooling(sourceFeatures, targetDimension);

      default:
        return this.averagePooling(sourceFeatures, targetDimension);
    }
  }

  /**
   * Performs average pooling to reduce dimensionality
   *
   * @param features The feature vectors to reduce
   * @param targetDimension The target dimension
   * @returns The reduced feature vectors
   */
  private averagePooling(features: Float32Array[], targetDimension: number): Float32Array[] {
    const result: Float32Array[] = [];
    const sourceDimension = features[0].length;

    for (const frame of features) {
      const reducedFrame = new Float32Array(targetDimension);

      if (sourceDimension < targetDimension) {
        // Upsample: repeat values
        const ratio = targetDimension / sourceDimension;
        for (let i = 0; i < sourceDimension; i++) {
          const start = Math.floor(i * ratio);
          const end = Math.floor((i + 1) * ratio);
          for (let j = start; j < end; j++) {
            reducedFrame[j] = frame[i];
          }
        }
      } else {
        // Downsample: average values
        const ratio = sourceDimension / targetDimension;
        for (let i = 0; i < targetDimension; i++) {
          const start = Math.floor(i * ratio);
          const end = Math.floor((i + 1) * ratio);
          let sum = 0;
          for (let j = start; j < end; j++) {
            sum += frame[j];
          }
          reducedFrame[i] = sum / (end - start);
        }
      }

      result.push(reducedFrame);
    }

    return result;
  }

  /**
   * Performs max pooling to reduce dimensionality
   *
   * @param features The feature vectors to reduce
   * @param targetDimension The target dimension
   * @returns The reduced feature vectors
   */
  private maxPooling(features: Float32Array[], targetDimension: number): Float32Array[] {
    const result: Float32Array[] = [];
    const sourceDimension = features[0].length;

    for (const frame of features) {
      const reducedFrame = new Float32Array(targetDimension);

      if (sourceDimension < targetDimension) {
        // Upsample: repeat values
        const ratio = targetDimension / sourceDimension;
        for (let i = 0; i < sourceDimension; i++) {
          const start = Math.floor(i * ratio);
          const end = Math.floor((i + 1) * ratio);
          for (let j = start; j < end; j++) {
            reducedFrame[j] = frame[i];
          }
        }
      } else {
        // Downsample: take max value
        const ratio = sourceDimension / targetDimension;
        for (let i = 0; i < targetDimension; i++) {
          const start = Math.floor(i * ratio);
          const end = Math.floor((i + 1) * ratio);
          let max = -Infinity;
          for (let j = start; j < end; j++) {
            if (frame[j] > max) {
              max = frame[j];
            }
          }
          reducedFrame[i] = max;
        }
      }

      result.push(reducedFrame);
    }

    return result;
  }

  /**
   * Performs linear projection to reduce dimensionality
   *
   * @param features The feature vectors to reduce
   * @param targetDimension The target dimension
   * @returns The reduced feature vectors
   */
  private linearProjection(features: Float32Array[], targetDimension: number): Float32Array[] {
    const result: Float32Array[] = [];
    const sourceDimension = features[0].length;

    // Create a simple projection matrix (in a real implementation, this would be learned or predefined)
    const projectionMatrix = this.createProjectionMatrix(sourceDimension, targetDimension);

    for (const frame of features) {
      const reducedFrame = new Float32Array(targetDimension);

      // Apply projection: reducedFrame = frame * projectionMatrix
      for (let i = 0; i < targetDimension; i++) {
        let sum = 0;
        for (let j = 0; j < sourceDimension; j++) {
          sum += frame[j] * projectionMatrix[j][i];
        }
        reducedFrame[i] = sum;
      }

      result.push(reducedFrame);
    }

    return result;
  }

  /**
   * Creates a simple projection matrix for dimensionality reduction
   *
   * @param sourceDimension The source dimension
   * @param targetDimension The target dimension
   * @returns A projection matrix
   */
  private createProjectionMatrix(sourceDimension: number, targetDimension: number): number[][] {
    const matrix: number[][] = [];

    // Create a simple projection matrix with values between -0.1 and 0.1
    for (let i = 0; i < sourceDimension; i++) {
      matrix[i] = [];
      for (let j = 0; j < targetDimension; j++) {
        // Use a deterministic pattern based on indices for reproducibility
        const value = Math.sin(i * j) * 0.1;
        matrix[i][j] = value;
      }
    }

    return matrix;
  }

  /**
   * Normalizes a feature vector using z-score normalization
   *
   * @param features The feature vector to normalize
   * @returns The normalized feature vector
   */
  private normalizeFeatureVector(features: Float32Array): Float32Array {
    const normalizedFeatures = new Float32Array(features.length);

    // Calculate mean and standard deviation
    let sum = 0;
    let sumSquared = 0;

    for (let i = 0; i < features.length; i++) {
      sum += features[i];
      sumSquared += features[i] * features[i];
    }

    const mean = sum / features.length;
    const variance = sumSquared / features.length - mean * mean;
    const stdDev = Math.sqrt(variance);

    // Apply z-score normalization
    for (let i = 0; i < features.length; i++) {
      normalizedFeatures[i] = (features[i] - mean) / (stdDev || 1);
    }

    return normalizedFeatures;
  }

  /**
   * Creates metadata for the translated features
   *
   * @param sourceMetadata The source metadata
   * @returns The translated metadata
   */
  private createTranslatedMetadata(sourceMetadata: AudioFeatureMetadata): {
    type: string;
    dimensions: number[];
    sampleRate: number;
    timeSteps?: number;
  } {
    return {
      type: "gama_features",
      dimensions: [this.options.targetDimension],
      sampleRate: sourceMetadata.sampleRate,
      timeSteps: sourceMetadata.timeSteps
    };
  }

  /**
   * Validates the translation quality
   *
   * @param sourceFeatures The source features
   * @param translatedFeatures The translated features
   * @returns Quality metrics for the translation
   */
  private validateTranslation(
    sourceFeatures: AudioFeatureVector,
    translatedFeatures: Float32Array[]
  ): {
    informationPreservation: number;
    structuralSimilarity: number;
    confidence: number;
  } {
    // Calculate information preservation score
    const informationPreservation = this.calculateInformationPreservation(
      sourceFeatures.features,
      translatedFeatures
    );

    // Calculate structural similarity score
    const structuralSimilarity = this.calculateStructuralSimilarity(
      sourceFeatures.features,
      translatedFeatures
    );

    // Calculate overall confidence
    const confidence = (informationPreservation * 0.6) + (structuralSimilarity * 0.4);

    return {
      informationPreservation,
      structuralSimilarity,
      confidence
    };
  }

  /**
   * Calculates information preservation score
   *
   * @param sourceFeatures The source features
   * @param translatedFeatures The translated features
   * @returns Information preservation score (0-1)
   */
  private calculateInformationPreservation(
    sourceFeatures: Float32Array[],
    translatedFeatures: Float32Array[]
  ): number {
    // This is a simplified measure of information preservation
    // In a real implementation, this would use more sophisticated methods

    // Compare energy distribution
    const sourceEnergy = this.calculateTotalEnergy(sourceFeatures);
    const translatedEnergy = this.calculateTotalEnergy(translatedFeatures);

    // Normalize by feature dimensions
    const normalizedSourceEnergy = sourceEnergy / (sourceFeatures.length * sourceFeatures[0].length);
    const normalizedTranslatedEnergy = translatedEnergy / (translatedFeatures.length * translatedFeatures[0].length);

    // Calculate ratio (capped at 1.0)
    const energyRatio = Math.min(
      normalizedTranslatedEnergy / normalizedSourceEnergy,
      normalizedSourceEnergy / normalizedTranslatedEnergy
    );

    return Math.max(0, Math.min(1, energyRatio));
  }

  /**
   * Calculates structural similarity score
   *
   * @param sourceFeatures The source features
   * @param translatedFeatures The translated features
   * @returns Structural similarity score (0-1)
   */
  private calculateStructuralSimilarity(
    sourceFeatures: Float32Array[],
    translatedFeatures: Float32Array[]
  ): number {
    // This is a simplified measure of structural similarity
    // In a real implementation, this would use more sophisticated methods

    // Compare temporal patterns by downsampling both to the same length
    const minLength = Math.min(sourceFeatures.length, translatedFeatures.length);

    let similaritySum = 0;

    for (let i = 0; i < minLength; i++) {
      const sourceIdx = Math.floor(i * sourceFeatures.length / minLength);
      const translatedIdx = Math.floor(i * translatedFeatures.length / minLength);

      const sourceFrame = sourceFeatures[sourceIdx];
      const translatedFrame = translatedFeatures[translatedIdx];

      // Calculate frame similarity using pattern correlation
      const similarity = this.calculateFrameSimilarity(sourceFrame, translatedFrame);
      similaritySum += similarity;
    }

    return similaritySum / minLength;
  }

  /**
   * Calculates similarity between two feature frames
   *
   * @param frame1 The first frame
   * @param frame2 The second frame
   * @returns Similarity score (0-1)
   */
  private calculateFrameSimilarity(frame1: Float32Array, frame2: Float32Array): number {
    // Downsample both frames to the same length for comparison
    const targetLength = 10; // Small fixed length for pattern comparison

    const downsampled1 = this.downsampleFrame(frame1, targetLength);
    const downsampled2 = this.downsampleFrame(frame2, targetLength);

    // Calculate correlation coefficient
    let sum1 = 0, sum2 = 0;
    let sum1Sq = 0, sum2Sq = 0;
    let pSum = 0;

    for (let i = 0; i < targetLength; i++) {
      sum1 += downsampled1[i];
      sum2 += downsampled2[i];
      sum1Sq += downsampled1[i] * downsampled1[i];
      sum2Sq += downsampled2[i] * downsampled2[i];
      pSum += downsampled1[i] * downsampled2[i];
    }

    const num = pSum - (sum1 * sum2 / targetLength);
    const den = Math.sqrt(
      (sum1Sq - sum1 * sum1 / targetLength) *
      (sum2Sq - sum2 * sum2 / targetLength)
    );

    if (den === 0) return 0;

    // Convert correlation (-1 to 1) to similarity score (0 to 1)
    return (num / den + 1) / 2;
  }

  /**
   * Downsamples a feature frame to a target length
   *
   * @param frame The frame to downsample
   * @param targetLength The target length
   * @returns The downsampled frame
   */
  private downsampleFrame(frame: Float32Array, targetLength: number): number[] {
    const result = new Array(targetLength);
    const ratio = frame.length / targetLength;

    for (let i = 0; i < targetLength; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += frame[j];
      }
      result[i] = sum / (end - start);
    }

    return result;
  }

  /**
   * Calculates total energy in feature vectors
   *
   * @param features The feature vectors
   * @returns Total energy
   */
  private calculateTotalEnergy(features: Float32Array[]): number {
    let totalEnergy = 0;

    for (const frame of features) {
      for (let i = 0; i < frame.length; i++) {
        totalEnergy += frame[i] * frame[i];
      }
    }

    return totalEnergy;
  }
}
