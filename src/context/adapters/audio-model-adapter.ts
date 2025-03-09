import {
  ContextAdapter,
  ContextItem,
  AudioModelContext,
  ContextItemType,
  AudioGenerationParameters,
} from "../types";
import { Logger } from "../../utils/logger";

export class AudioModelContextAdapter
  implements ContextAdapter<AudioModelContext>
{
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ namespace: "audio-model-adapter" });
  }

  adaptContext(context: ContextItem[]): AudioModelContext {
    // Initialize with default parameters
    const audioContext: AudioModelContext = {
      audioParameters: {
        sampleRate: 16000,
        channels: 1,
        bitDepth: 16,
        format: "wav",
      },
      processingRequirements: {
        quality: "medium",
        latency: "batch",
        priority: 1,
      },
      stylistic: {
        genre: "general",
        tempo: 120,
        effects: [],
      },
      generationParameters: {
        prompt: "",
        diffusionSteps: 25,
        guidanceScale: 3.5,
        duration: 5.0,
        batchSize: 1,
        sampleRate: 16000,
      },
    };

    try {
      // Only override defaults if valid parameters exist in context
      if (context && context.length > 0) {
        for (const item of context) {
          switch (item.type) {
            case "audio_parameters":
              // Merge with defaults rather than replacing
              audioContext.audioParameters = {
                ...audioContext.audioParameters,
                ...(item.content as AudioModelContext["audioParameters"]),
              };
              break;

            case "processing_requirements":
              audioContext.processingRequirements = {
                ...audioContext.processingRequirements,
                ...(item.content as AudioModelContext["processingRequirements"]),
              };
              break;

            case "stylistic_preferences":
              audioContext.stylistic = {
                ...audioContext.stylistic,
                ...(item.content as AudioModelContext["stylistic"]),
              };
              break;

            case "generation_parameters":
              audioContext.generationParameters = {
                ...audioContext.generationParameters,
                ...(item.content as AudioGenerationParameters),
              };
              break;

            case "prompt":
              if (audioContext.generationParameters) {
                audioContext.generationParameters.prompt =
                  item.content.text || "";
              }
              break;

            default:
              this.logger.debug("Ignoring unknown context type", {
                type: item.type,
                id: item.id,
              });
          }
        }
      }

      // Validate the adapted context
      this.validateAudioContext(audioContext);

      return audioContext;
    } catch (error) {
      this.logger.warn("Error adapting context, using defaults", { error });
      return audioContext;
    }
  }

  private validateAudioContext(context: AudioModelContext): void {
    const {
      audioParameters,
      processingRequirements,
      stylistic,
      generationParameters,
    } = context;

    // Validate and normalize audio parameters
    audioParameters.sampleRate = audioParameters.sampleRate || 16000;
    audioParameters.channels = audioParameters.channels || 1;
    audioParameters.bitDepth = audioParameters.bitDepth || 16;
    audioParameters.format = audioParameters.format || "wav";

    // Validate and normalize processing requirements
    processingRequirements.quality = processingRequirements.quality || "medium";
    processingRequirements.latency = processingRequirements.latency || "batch";
    processingRequirements.priority = processingRequirements.priority || 1;

    // Validate and normalize stylistic parameters
    stylistic.genre = stylistic.genre || "general";
    stylistic.tempo = stylistic.tempo || 120;
    stylistic.effects = stylistic.effects || [];

    // Validate and normalize generation parameters
    if (generationParameters) {
      generationParameters.prompt = generationParameters.prompt || "";
      generationParameters.diffusionSteps =
        generationParameters.diffusionSteps || 25;
      generationParameters.guidanceScale =
        generationParameters.guidanceScale || 3.5;
      generationParameters.duration = generationParameters.duration || 5.0;
      generationParameters.batchSize = generationParameters.batchSize || 1;
      generationParameters.sampleRate =
        generationParameters.sampleRate || 16000;

      // Ensure values are within valid ranges
      if (generationParameters.diffusionSteps <= 0)
        generationParameters.diffusionSteps = 25;
      if (generationParameters.guidanceScale <= 0)
        generationParameters.guidanceScale = 3.5;
      if (generationParameters.duration <= 0)
        generationParameters.duration = 5.0;
      if (generationParameters.batchSize <= 0)
        generationParameters.batchSize = 1;
      if (generationParameters.sampleRate <= 0)
        generationParameters.sampleRate = 16000;
    }

    // Ensure values are within valid ranges
    if (audioParameters.sampleRate <= 0) audioParameters.sampleRate = 16000;
    if (audioParameters.channels <= 0) audioParameters.channels = 1;
    if (audioParameters.bitDepth <= 0) audioParameters.bitDepth = 16;
    if (processingRequirements.priority < 0)
      processingRequirements.priority = 1;
    if (stylistic.tempo <= 0) stylistic.tempo = 120;
  }
}

// Singleton instance
export const audioModelAdapter = new AudioModelContextAdapter();
