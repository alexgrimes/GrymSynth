import { GAMAService, GAMAServiceConfig } from "./audio/GAMAService";
import { AudioLDMService } from "./audio/AudioLDMService";
import { AudioServiceConfig } from "../types/audio";
import { Logger } from "../utils/logger";

export class ServiceFactory {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ namespace: "service-factory" });
  }

  createGAMAService(
    config?: Partial<GAMAServiceConfig>
  ): GAMAService {
    const defaultConfig: GAMAServiceConfig = {
      id: "gama-default",
      modelPath: "models/gama-base",
      maxMemory: "1GB",
      device: "cpu"
    };

    // Ensure we don't override with invalid values
    const finalConfig = {
      ...defaultConfig,
      ...config,
    };

    this.logger.info("Creating GAMAService", { config: finalConfig });

    try {
      return new GAMAService(finalConfig);
    } catch (error) {
      this.logger.error("Failed to create GAMAService", {
        error,
        config: finalConfig,
      });
      throw error;
    }
  }

  async createAudioLDMService(
    config?: Partial<AudioServiceConfig>
  ): Promise<AudioLDMService> {
    // Create with defaults
    const defaultConfig: AudioServiceConfig = {
      model: "audioldm-base",
      sampleRate: 44100,
      maxDuration: 30
    };

    // Merge with provided config
    const finalConfig = {
      ...defaultConfig,
      ...config,
    };

    this.logger.info("Creating AudioLDMService", { config: finalConfig });

    try {
      // Use the static initialize method instead of constructor
      return await AudioLDMService.initialize(finalConfig);
    } catch (error) {
      this.logger.error("Failed to create AudioLDMService", {
        error,
        config: finalConfig,
      });
      throw error;
    }
  }

  // Factory methods for other service types would go here
  // For example:
  // createAudioEnhancementService(config?: Partial<AudioEnhancementConfig>): AudioEnhancementService
  // createMusicTranscriptionService(config?: Partial<TranscriptionConfig>): MusicTranscriptionService
}

// Singleton instance for global use
export const serviceFactory = new ServiceFactory();
