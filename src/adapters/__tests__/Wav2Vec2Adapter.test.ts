import { Wav2Vec2Adapter } from "../Wav2Vec2Adapter";
import { TaskType, AudioTask } from "../../interfaces/tasks";
import {
  SimpleAudioBuffer,
  AudioProcessingOptions,
} from "../../interfaces/audio";
import { Logger } from "../../utils/logger";

// Mock dependencies
jest.mock("../../services/audio/Wav2Vec2Service");
jest.mock("../../utils/logger");

describe("Wav2Vec2Adapter", () => {
  let adapter: Wav2Vec2Adapter;
  let mockLogger: jest.Mocked<Logger>;

  const createMockAudio = (): SimpleAudioBuffer => ({
    data: new Float32Array(1000),
    channels: 1,
    sampleRate: 16000,
    metadata: {
      format: "wav",
      duration: 1.0,
    },
  });

  const createMockTask = (
    type: TaskType,
    options?: Partial<AudioProcessingOptions>
  ): AudioTask => ({
    id: "test-id",
    type,
    timestamp: Date.now(),
    data: {
      audio: createMockAudio(),
      ...(options ? { options } : {}),
    },
  });

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = new Logger({ namespace: "test" }) as jest.Mocked<Logger>;

    // Create adapter instance
    adapter = new Wav2Vec2Adapter({
      maxMemory: "1GB",
      modelPath: "test/model/path",
      logger: mockLogger,
    });
  });

  describe("initialization", () => {
    test("should create adapter with default logger if not provided", () => {
      const defaultAdapter = new Wav2Vec2Adapter({
        maxMemory: "1GB",
      });
      expect(defaultAdapter).toBeDefined();
    });

    test("should initialize with custom configuration", () => {
      const customAdapter = new Wav2Vec2Adapter({
        maxMemory: "2GB",
        modelPath: "custom/path",
        logger: mockLogger,
      });
      expect(customAdapter).toBeDefined();
    });
  });

  describe("getCapabilities", () => {
    test("should return correct capabilities", () => {
      const capabilities = adapter.getCapabilities();

      expect(capabilities.supportedTasks).toContain(TaskType.AUDIO_PROCESS);
      expect(capabilities.supportedTasks).toContain(TaskType.AUDIO_ANALYZE);
      expect(capabilities.supportedFormats).toContain("wav");
      expect(capabilities.performance).toBeDefined();
      expect(capabilities.resourceRequirements).toBeDefined();
    });
  });

  describe("handleTask", () => {
    test("should handle AUDIO_PROCESS task", async () => {
      const task = createMockTask(TaskType.AUDIO_PROCESS, {
        quality: 0.9,
        format: "wav",
        sampleRate: 16000,
        model: {
          name: "wav2vec2-base",
          path: "models/wav2vec2",
          settings: {
            beam_size: 5,
          },
        },
      });

      const result = await adapter.handleTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.model).toBe("wav2vec2");
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    test("should handle AUDIO_ANALYZE task", async () => {
      const task = createMockTask(TaskType.AUDIO_ANALYZE, {
        sampleRate: 16000,
        model: {
          name: "wav2vec2-base",
          settings: {
            feature_type: "mfcc",
          },
        },
      });

      const result = await adapter.handleTask(task);

      expect(result.success).toBe(true);
      expect(result.metadata?.model).toBe("wav2vec2");
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    test("should reject unsupported task types", async () => {
      const task: AudioTask = {
        ...createMockTask(TaskType.AUDIO_PROCESS),
        type: "UNSUPPORTED" as TaskType,
      };

      await expect(adapter.handleTask(task)).rejects.toThrow(
        /unsupported task type/i
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    test("should handle missing audio data", async () => {
      const task = {
        id: "test-4",
        type: TaskType.AUDIO_PROCESS,
        timestamp: Date.now(),
        data: {},
      } as AudioTask;

      await expect(adapter.handleTask(task)).rejects.toThrow(
        /missing audio data/i
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("checkHealth", () => {
    test("should return true when service is healthy", async () => {
      const health = await adapter.checkHealth();
      expect(health).toBe(true);
    });

    test("should return false when service initialization fails", async () => {
      // Mock service initialization failure
      jest
        .spyOn(adapter["service"], "initialize")
        .mockRejectedValueOnce(new Error("Init failed"));

      const health = await adapter.checkHealth();
      expect(health).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("resource management", () => {
    test("should dispose resources correctly", async () => {
      await adapter.dispose();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Disposing adapter resources"
      );
    });
  });
});
