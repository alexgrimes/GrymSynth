import { v4 as uuidv4 } from 'uuid';
import { ModelAdapter, ModelCapabilities } from '../../interfaces/orchestration';
import { AudioTask, TaskResult, TaskType } from '../../interfaces/tasks';
import { SimpleAudioBuffer } from '../../interfaces/audio';
import { Logger } from '../../utils/logger';
import { GAMAService } from './GAMAService';

export interface FeatureMemoryProvider {
  storePattern(features: Float32Array): Promise<string>;
  findSimilarPatterns(features: Float32Array, options?: { threshold?: number; maxResults?: number }): Promise<any[]>;
}

export interface GAMAAdapterConfig {
  gamaService: GAMAService;
  featureMemory?: FeatureMemoryProvider;
}

export class GAMAAdapter implements ModelAdapter {
  private gamaService: GAMAService;
  private featureMemory?: FeatureMemoryProvider;
  private logger: Logger;

  constructor(config: GAMAAdapterConfig) {
    this.gamaService = config.gamaService;
    this.featureMemory = config.featureMemory;
    this.logger = new Logger({ namespace: "gama-adapter" });
  }

  async handleTask(task: AudioTask): Promise<TaskResult> {
    // Validate task
    this.validateTask(task);

    try {
      // Process based on task type
      switch (task.type) {
        case TaskType.AUDIO_PROCESS:
          return await this.processAudio(task);

        case TaskType.AUDIO_ANALYZE:
          return await this.analyzeAudio(task);

        // For task types not in the enum, we'll need to handle them differently
        // or extend the TaskType enum
        case 'audio.extract_features' as any:
          return await this.extractFeatures(task);

        case 'audio.pattern_recognition' as any:
          return await this.recognizePattern(task);

        default:
          return {
            success: false,
            data: null,
            error: `Unsupported task type: ${task.type}`
          };
      }
    } catch (error) {
      this.logger.error("Error handling task", {
        taskId: task.id,
        taskType: task.type,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async extractAndStoreFeatures(audio: SimpleAudioBuffer): Promise<string> {
    if (!this.featureMemory) {
      throw new Error("Feature memory provider not configured");
    }

    // Extract features using GAMA
    const features = await this.gamaService.extractFeatures(audio);

    // Store in feature memory
    return await this.featureMemory.storePattern(features);
  }

  getCapabilities(): ModelCapabilities {
    return {
      supportedTasks: [
        TaskType.AUDIO_PROCESS,
        TaskType.AUDIO_ANALYZE,
        // We can't include the custom task types here since they're not in the enum
        // This is a limitation of the current design
      ],
      supportedFormats: ['wav', 'mp3', 'ogg'],
      performance: {
        averageLatency: 500, // Estimated average latency in ms
        throughput: 2 // Estimated tasks per second
      }
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check if service is initialized
      if (!this.gamaService.isInitialized()) {
        await this.gamaService.initialize();
      }

      // Get service status
      const status = this.gamaService.getStatus();
      return status.state === 'ready';
    } catch (error) {
      this.logger.error("Health check failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  async dispose(): Promise<void> {
    try {
      await this.gamaService.shutdown();
    } catch (error) {
      this.logger.error("Error during adapter disposal", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private validateTask(task: AudioTask): void {
    if (!task.id) {
      task.id = uuidv4();
    }

    if (!task.data?.audio) {
      throw new Error("Task must include audio data");
    }
  }

  private async processAudio(task: AudioTask): Promise<TaskResult> {
    const audio = task.data.audio;
    const result = await this.gamaService.process(audio);

    return {
      success: true,
      data: {
        transcription: result.transcription,
        confidence: result.confidence,
        segments: result.segments
      }
    };
  }

  private async analyzeAudio(task: AudioTask): Promise<TaskResult> {
    const audio = task.data.audio;
    const result = await this.gamaService.analyze(audio);

    return {
      success: true,
      data: {
        analysis: {
          features: result.features,
          metadata: result.metadata
        }
      }
    };
  }

  private async extractFeatures(task: AudioTask): Promise<TaskResult> {
    const audio = task.data.audio;
    const features = await this.gamaService.extractFeatures(audio);

    return {
      success: true,
      data: {
        features: Array.from(features)
      }
    };
  }

  private async recognizePattern(task: AudioTask): Promise<TaskResult> {
    if (!this.featureMemory) {
      throw new Error("Feature memory provider not configured");
    }

    const audio = task.data.audio;
    const options = task.data.options || {};

    // Get pattern recognition settings from model settings or use defaults
    const patternSettings = {
      threshold: 0.8,
      maxResults: 5
    };

    // If options.model.settings exists, extract threshold and maxResults
    if (options.model?.settings) {
      const settings = options.model.settings as Record<string, unknown>;
      if (typeof settings.threshold === 'number') {
        patternSettings.threshold = settings.threshold;
      }
      if (typeof settings.maxResults === 'number') {
        patternSettings.maxResults = settings.maxResults;
      }
    }

    // Extract features
    const features = await this.gamaService.extractFeatures(audio);

    // Find matching patterns
    const matches = await this.featureMemory.findSimilarPatterns(features, patternSettings);

    return {
      success: true,
      data: {
        matches
      }
    };
  }
}
