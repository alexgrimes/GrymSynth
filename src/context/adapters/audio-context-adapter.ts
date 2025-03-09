import { ContextAdapter, ContextItem, AudioModelContext } from "../types";
import { Logger } from "../../utils/logger";

/**
 * Adapter for transforming context items into AudioModelContext format
 * This adapter is used by audio processing and generation steps to
 * ensure consistent context format across the workflow
 */
export class AudioContextAdapter implements ContextAdapter<AudioModelContext> {
  private logger: Logger;

  constructor() {
    this.logger = new Logger("audio-context-adapter");
  }

  /**
   * Adapts an array of context items into a unified AudioModelContext
   * Prioritizes items based on timestamp (newer items take precedence)
   * @param contextItems Array of context items to adapt
   * @returns Adapted AudioModelContext
   */
  adaptContext(contextItems: ContextItem[]): AudioModelContext {
    this.logger.debug(
      `Adapting ${contextItems.length} context items to AudioModelContext`
    );

    // Default audio context structure
    const defaultContext: AudioModelContext = {
      audioParameters: {
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16,
        format: "wav",
      },
      processingRequirements: {
        quality: "medium",
        latency: "batch",
        priority: 5,
      },
      stylistic: {
        genre: "neutral",
        tempo: 120,
        effects: [],
      },
    };

    // Sort items by timestamp (newest first)
    const sortedItems = [...contextItems].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Apply context items to the default context
    for (const item of sortedItems) {
      try {
        switch (item.type) {
          case "audio_parameters":
            this.mergeAudioParameters(defaultContext, item.content);
            break;
          case "processing_requirements":
            this.mergeProcessingRequirements(defaultContext, item.content);
            break;
          case "stylistic_preferences":
            this.mergeStylePreferences(defaultContext, item.content);
            break;
          case "generation_parameters":
            defaultContext.generationParameters = {
              ...defaultContext.generationParameters,
              ...item.content,
            };
            break;
          case "prompt":
            if (!defaultContext.generationParameters) {
              defaultContext.generationParameters = {
                prompt: item.content.text || item.content,
                duration: 5,
                batchSize: 1,
                guidanceScale: 3.0,
                diffusionSteps: 50,
                sampleRate: defaultContext.audioParameters.sampleRate,
              };
            } else {
              defaultContext.generationParameters.prompt =
                item.content.text || item.content;
            }
            break;
          default:
            this.logger.warn(`Unknown context item type: ${item.type}`);
        }
      } catch (error) {
        this.logger.error(`Error adapting context item of type ${item.type}`, {
          error,
        });
      }
    }

    return defaultContext;
  }

  /**
   * Merges audio parameters from a context item into the target context
   */
  private mergeAudioParameters(target: AudioModelContext, source: any): void {
    if (source && typeof source === "object") {
      target.audioParameters = {
        ...target.audioParameters,
        ...source,
      };
    }
  }

  /**
   * Merges processing requirements from a context item into the target context
   */
  private mergeProcessingRequirements(
    target: AudioModelContext,
    source: any
  ): void {
    if (source && typeof source === "object") {
      target.processingRequirements = {
        ...target.processingRequirements,
        ...source,
      };
    }
  }

  /**
   * Merges stylistic preferences from a context item into the target context
   */
  private mergeStylePreferences(target: AudioModelContext, source: any): void {
    if (source && typeof source === "object") {
      target.stylistic = {
        ...target.stylistic,
        ...source,
      };

      // Handle effects array specially to ensure it's merged properly
      if (Array.isArray(source.effects)) {
        target.stylistic.effects = [...source.effects];
      }
    }
  }
}
