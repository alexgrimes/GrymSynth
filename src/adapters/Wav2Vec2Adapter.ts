import { ModelAdapter, ModelCapabilities } from "../interfaces/orchestration";
import { Wav2Vec2Service } from "../services/audio/Wav2Vec2Service";
import { TaskType, TaskResult, AudioTask } from "../interfaces/tasks";
import { SimpleAudioBuffer } from "../interfaces/audio";
import { Logger } from "../utils/logger";

/**
 * Adapter for Wav2Vec2 model integration with orchestration system
 */
export class Wav2Vec2Adapter implements ModelAdapter {
  private service: Wav2Vec2Service;
  private logger: Logger;

  constructor(config: {
    maxMemory: string;
    modelPath?: string;
    logger?: Logger;
  }) {
    this.service = new Wav2Vec2Service({
      maxMemory: config.maxMemory,
      modelPath: config.modelPath,
    });
    this.logger =
      config.logger || new Logger({ namespace: "wav2vec2-adapter" });
  }

  /**
   * Convert Web Audio API AudioBuffer to our SimpleAudioBuffer
   */
  private convertToSimpleBuffer(
    webAudioBuffer: AudioBuffer
  ): SimpleAudioBuffer {
    return {
      data: webAudioBuffer.getChannelData(0),
      channels: webAudioBuffer.numberOfChannels,
      sampleRate: webAudioBuffer.sampleRate,
      metadata: {
        duration: webAudioBuffer.duration,
        format: "wav",
      },
    };
  }

  /**
   * Handle audio processing tasks
   */
  async handleTask(task: AudioTask): Promise<TaskResult> {
    this.logger.debug("Handling task", { taskId: task.id, type: task.type });

    try {
      // Initialize service if needed
      await this.service.initialize();

      switch (task.type) {
        case TaskType.AUDIO_PROCESS:
          return await this._processAudio(task);
        case TaskType.AUDIO_ANALYZE:
          return await this._analyzeAudio(task);
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } catch (error) {
      this.logger.error("Task handling failed", {
        taskId: task.id,
        type: task.type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get adapter capabilities for task routing
   */
  getCapabilities(): ModelCapabilities {
    return {
      supportedTasks: [TaskType.AUDIO_PROCESS, TaskType.AUDIO_ANALYZE],
      supportedFormats: ["wav", "mp3", "ogg"],
      performance: {
        averageLatency: 200, // ms
        throughput: 10, // requests per second
        maxConcurrent: 5,
      },
      resourceRequirements: {
        memory: "1GB",
        cpuPriority: "medium",
      },
    };
  }

  /**
   * Check health status by verifying service initialization
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.service.initialize();
      return true;
    } catch (error) {
      this.logger.error("Health check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Process audio using wav2vec2
   */
  private async _processAudio(task: AudioTask): Promise<TaskResult> {
    const startTime = Date.now();

    // Validate audio data
    if (!task.data?.audio) {
      throw new Error("Missing audio data in task");
    }

    // Process audio
    const result = await this.service.process(task.data.audio);

    return {
      success: true,
      data: result,
      metadata: {
        processingTime: Date.now() - startTime,
        model: "wav2vec2",
        options: task.data.options,
      },
    };
  }

  /**
   * Analyze audio using wav2vec2
   */
  private async _analyzeAudio(task: AudioTask): Promise<TaskResult> {
    const startTime = Date.now();

    // Validate audio data
    if (!task.data?.audio) {
      throw new Error("Missing audio data in task");
    }

    // Analyze audio
    const result = await this.service.analyze(task.data.audio);

    return {
      success: true,
      data: result,
      metadata: {
        processingTime: Date.now() - startTime,
        model: "wav2vec2",
        options: task.data.options,
      },
    };
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.logger.debug("Disposing adapter resources");
    await this.service.dispose();
  }
}
