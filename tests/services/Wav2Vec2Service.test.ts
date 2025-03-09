import {
  Wav2Vec2Service,
  Wav2Vec2ServiceError,
} from "../../src/services/audio/Wav2Vec2Service";
import { SimpleAudioBuffer } from "../../src/interfaces/audio";
import { Logger } from "../../src/utils/logger";
import { MemoryManager } from "../../src/utils/memory";

// Mock dependencies
jest.mock("../../src/utils/logger");
jest.mock("../../src/utils/memory");

describe("Wav2Vec2Service", () => {
  let service: Wav2Vec2Service;
  let mockLogger: jest.Mocked<Logger>;
  let mockMemoryManager: jest.Mocked<MemoryManager>;

  const createMockAudio = (): SimpleAudioBuffer => ({
    data: new Float32Array(1000),
    channels: 1,
    sampleRate: 16000,
    metadata: {
      duration: 1.0,
    },
  });

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Create service instance
    service = new Wav2Vec2Service({
      maxMemory: "1GB",
      modelPath: "test/model/path",
    });
  });

  describe("initialization", () => {
    test("should create instance with valid config", () => {
      expect(service).toBeInstanceOf(Wav2Vec2Service);
      expect(service.isInitialized()).toBe(false);
    });

    test("should throw on missing memory config", () => {
      expect(() => new Wav2Vec2Service({} as any)).toThrow(
        Wav2Vec2ServiceError
      );
    });

    test("should initialize only once", async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);

      await service.initialize(); // Second call
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe("audio processing", () => {
    test("should process valid audio data", async () => {
      const audio = createMockAudio();
      const result = await service.process(audio);

      expect(result).toBeDefined();
      expect(result.transcription).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    test("should handle missing audio data", async () => {
      await expect(service.process(null as any)).rejects.toThrow(
        Wav2Vec2ServiceError
      );
    });

    test("should track memory usage during processing", async () => {
      const audio = createMockAudio();
      await service.process(audio);

      expect(MemoryManager.prototype.startOperation).toHaveBeenCalledWith(
        "process"
      );
      expect(MemoryManager.prototype.endOperation).toHaveBeenCalled();
    });
  });

  describe("audio analysis", () => {
    test("should analyze valid audio data", async () => {
      const audio = createMockAudio();
      const result = await service.analyze(audio);

      expect(result).toBeDefined();
      expect(result.features).toBeInstanceOf(Array);
      expect(result.featureCount).toBeGreaterThan(0);
    });

    test("should handle missing audio data", async () => {
      await expect(service.analyze(null as any)).rejects.toThrow(
        Wav2Vec2ServiceError
      );
    });

    test("should track memory usage during analysis", async () => {
      const audio = createMockAudio();
      await service.analyze(audio);

      expect(MemoryManager.prototype.startOperation).toHaveBeenCalledWith(
        "analyze"
      );
      expect(MemoryManager.prototype.endOperation).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    test("should handle initialization failures", async () => {
      // Mock initialization failure
      jest
        .spyOn(service as any, "initialize")
        .mockRejectedValueOnce(new Error("Init failed"));

      await expect(service.process(createMockAudio())).rejects.toThrow(
        Wav2Vec2ServiceError
      );
    });

    test("should handle processing errors", async () => {
      const audio = createMockAudio();
      // Corrupt the audio data
      audio.data = null as any;

      await expect(service.process(audio)).rejects.toThrow(
        Wav2Vec2ServiceError
      );
    });

    test("should handle analysis errors", async () => {
      const audio = createMockAudio();
      // Corrupt the audio data
      audio.data = null as any;

      await expect(service.analyze(audio)).rejects.toThrow(
        Wav2Vec2ServiceError
      );
    });
  });

  describe("cleanup", () => {
    test("should dispose resources correctly", async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);

      await service.dispose();
      expect(service.isInitialized()).toBe(false);
    });

    test("should handle disposal errors", async () => {
      // Mock disposal failure
      jest
        .spyOn(service as any, "dispose")
        .mockRejectedValueOnce(new Error("Cleanup failed"));

      await expect(service.dispose()).rejects.toThrow(Wav2Vec2ServiceError);
    });
  });
});
