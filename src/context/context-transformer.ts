import { ContextItem } from "../services/types";
import { Logger } from "../utils/logger";

/**
 * Interface for context transformation rules
 */
export interface TransformationRule {
  sourceKey: string;
  targetKey: string;
  transform: (value: any) => any;
}

/**
 * Service for transforming context data between workflow steps
 * This enables intelligent data flow between analysis and generation steps
 */
export class ContextTransformer {
  private logger: Logger;
  private rules: Map<string, TransformationRule[]>;

  constructor() {
    this.logger = new Logger("context-transformer");
    this.rules = new Map();
  }

  /**
   * Registers a transformation rule for a specific step transition
   * @param sourceStepId ID of the source step
   * @param targetStepId ID of the target step
   * @param rule Transformation rule to apply
   */
  registerRule(
    sourceStepId: string,
    targetStepId: string,
    rule: TransformationRule
  ): void {
    const key = this.getTransitionKey(sourceStepId, targetStepId);

    if (!this.rules.has(key)) {
      this.rules.set(key, []);
    }

    this.rules.get(key)!.push(rule);

    this.logger.debug(
      `Registered transformation rule: ${sourceStepId} -> ${targetStepId}`,
      {
        sourceKey: rule.sourceKey,
        targetKey: rule.targetKey,
      }
    );
  }

  /**
   * Transforms context data from one step to another
   * @param sourceStepId ID of the source step
   * @param targetStepId ID of the target step
   * @param sourceContext Source context data
   * @returns Transformed context items
   */
  transformContext(
    sourceStepId: string,
    targetStepId: string,
    sourceContext: Record<string, any>
  ): ContextItem[] {
    const key = this.getTransitionKey(sourceStepId, targetStepId);
    const rules = this.rules.get(key) || [];

    if (rules.length === 0) {
      this.logger.debug(
        `No transformation rules found for ${sourceStepId} -> ${targetStepId}`
      );
      return [];
    }

    const transformedItems: ContextItem[] = [];

    for (const rule of rules) {
      try {
        // Extract source value
        const sourceValue = this.getNestedValue(sourceContext, rule.sourceKey);

        if (sourceValue === undefined) {
          this.logger.debug(`Source key not found: ${rule.sourceKey}`);
          continue;
        }

        // Apply transformation
        const transformedValue = rule.transform(sourceValue);

        // Create context item
        const contextItem: ContextItem = {
          id: `${targetStepId}-${rule.targetKey}-${Date.now()}`,
          key: rule.targetKey,
          content: transformedValue,
          timestamp: new Date(),
        };

        transformedItems.push(contextItem);

        this.logger.debug(
          `Transformed context: ${rule.sourceKey} -> ${rule.targetKey}`
        );
      } catch (error) {
        this.logger.error(`Error applying transformation rule`, {
          sourceStepId,
          targetStepId,
          sourceKey: rule.sourceKey,
          targetKey: rule.targetKey,
          error,
        });
      }
    }

    return transformedItems;
  }

  /**
   * Registers common audio analysis to generation transformation rules
   * These rules help convert analysis results into generation parameters
   */
  registerAudioAnalysisToGenerationRules(): void {
    // Register rules for transforming audio analysis results to generation parameters

    // Rule: Convert detected tempo to generation tempo
    this.registerRule("audio-analysis", "audio-generation", {
      sourceKey: "analysis.tempo",
      targetKey: "stylistic_preferences",
      transform: (tempo) => ({
        tempo: tempo,
        // Add other stylistic parameters that might be derived from tempo
        intensity: tempo > 120 ? "high" : tempo > 90 ? "medium" : "low",
      }),
    });

    // Rule: Convert detected features to generation parameters
    this.registerRule("audio-analysis", "audio-generation", {
      sourceKey: "analysis.features",
      targetKey: "generation_parameters",
      transform: (features) => {
        // Extract relevant features for generation
        const relevantFeatures = {
          complexity: features.complexity || 0.5,
          energy: features.energy || 0.5,
          brightness: features.brightness || 0.5,
        };

        // Map features to generation parameters
        return {
          temperature: 0.8 + relevantFeatures.complexity * 0.4, // 0.8-1.2
          topK: Math.floor(50 - relevantFeatures.complexity * 20), // 30-50
          guidanceScale: 3.0 + relevantFeatures.energy * 4.0, // 3.0-7.0
          diffusionSteps: 50 + Math.floor(relevantFeatures.complexity * 50), // 50-100
        };
      },
    });

    // Rule: Convert detected patterns to prompt enhancements
    this.registerRule("audio-analysis", "audio-generation", {
      sourceKey: "analysis.patterns",
      targetKey: "prompt",
      transform: (patterns) => {
        if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
          return { text: "" };
        }

        // Extract pattern descriptions
        const patternDescriptions = patterns
          .map((p) => p.description || p.name || "")
          .filter((desc) => desc.length > 0);

        if (patternDescriptions.length === 0) {
          return { text: "" };
        }

        // Create enhanced prompt with pattern descriptions
        return {
          text: `with ${patternDescriptions.join(", ")}`,
          patterns: patterns,
        };
      },
    });

    // Rule: Convert quality metrics to processing requirements
    this.registerRule("audio-analysis", "audio-generation", {
      sourceKey: "analysis.quality",
      targetKey: "processing_requirements",
      transform: (quality) => {
        if (!quality) return {};

        // Map quality metrics to processing requirements
        const processingQuality =
          quality.overall > 0.8
            ? "high"
            : quality.overall > 0.5
            ? "medium"
            : "low";

        return {
          quality: processingQuality,
          priority: Math.ceil(quality.overall * 10),
        };
      },
    });
  }

  /**
   * Gets a unique key for a step transition
   * @param sourceStepId ID of the source step
   * @param targetStepId ID of the target step
   * @returns Transition key
   */
  private getTransitionKey(sourceStepId: string, targetStepId: string): string {
    return `${sourceStepId}:${targetStepId}`;
  }

  /**
   * Gets a nested value from an object using a dot-notation path
   * @param obj Object to extract value from
   * @param path Dot-notation path to the value
   * @returns Extracted value or undefined if not found
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || typeof obj !== "object") {
      return undefined;
    }

    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object"
      ) {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }
}
