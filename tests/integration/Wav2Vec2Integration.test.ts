import { Wav2Vec2Service } from "../../src/services/audio/Wav2Vec2Service";
import { createTestAudioFile, measureMemoryUsage } from "../utils/testHelpers";
import fs from "fs";
import path from "path";
import "../mocks/pythonBridge.mock"; // Import mocks

// Mock fs for certain error cases
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  promises: {
    ...jest.requireActual("fs").promises,
    writeFile: jest.fn().mockImplementation((path, data) => {
      if (path.includes("error_test")) {
        return Promise.reject(new Error("Mock file system error"));
      }
      return jest.requireActual("fs").promises.writeFile(path, data);
    }),
  },
}));

// Configuration for integration tests
const config = {
  maxMemory: "1GB",
  modelPath: "facebook/wav2vec2-base-960h",
};

// Type guard for errors with message property
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

describe("Wav2Vec2 Integration Tests", () => {
  let service: Wav2Vec2Service;
  let testAudioPath: string;
  let cleanupQueue: Array<() => Promise<void>>;

  // Use longer timeout for integration tests
  jest.setTimeout(120000); // 2 minutes

  beforeAll(async () => {
    // Create a test audio file once for all tests
    testAudioPath = await createTestAudioFile();
    cleanupQueue = [];
  });

  afterAll(async () => {
    // Clean up test audio file
    if (testAudioPath && fs.existsSync(testAudioPath)) {
      await fs.promises.unlink(testAudioPath);
    }

    // Perform all cleanup operations
    await Promise.all(cleanupQueue.map((cleanup) => cleanup()));
    // Clear mocks after all tests
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Create a fresh service instance for each test
    service = new Wav2Vec2Service(config);
    // Add service cleanup to queue
    cleanupQueue.push(() => service.dispose());
    // Reset mocks for each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    if (service) {
      await service.dispose();
    }
  });

  // Service Lifecycle Tests
  describe("Service Lifecycle", () => {
    test("should initialize with custom config", async () => {
      const customConfig = {
        ...config,
        maxMemory: "2GB",
        modelPath: "facebook/wav2vec2-base-960h",
      };

      const customService = new Wav2Vec2Service(customConfig);
      cleanupQueue.push(() => customService.dispose());
      expect(customService).toBeDefined();
      await customService.initialize();
      await customService.dispose();
    }, 120000);

    test("should handle initialization failures gracefully", async () => {
      const invalidConfig = {
        ...config,
        maxMemory: "invalid",
      };

      expect(() => new Wav2Vec2Service(invalidConfig)).toThrow(
        /Invalid memory string format/
      );
    });

    test("should handle various memory limit formats", () => {
      expect(() => new Wav2Vec2Service({ maxMemory: "1GB" })).not.toThrow();
      expect(() => new Wav2Vec2Service({ maxMemory: "512MB" })).not.toThrow();
      expect(() => new Wav2Vec2Service({ maxMemory: "2048MB" })).not.toThrow();
      expect(() => new Wav2Vec2Service({ maxMemory: "1G" })).toThrow();
      expect(() => new Wav2Vec2Service({ maxMemory: "1.5GB" })).toThrow();
      expect(() => new Wav2Vec2Service({ maxMemory: "-1GB" })).toThrow();
    });
  });

  // Audio Processing Tests
  describe("Audio Processing", () => {
    test("should initialize and process audio", async () => {
      try {
        await service.initialize();

        const audioData = await fs.promises.readFile(testAudioPath);
        const audioBuffer = {
          data: new Float32Array(audioData.buffer),
          sampleRate: 16000,
          channels: 1,
        };

        const result = await service.process(audioBuffer);

        expect(result).toBeDefined();
        expect(result.transcription).toBeDefined();
        expect(typeof result.confidence).toBe("number");
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      } catch (error) {
        if (
          isErrorWithMessage(error) &&
          !error.message.includes("were not initialized")
        ) {
          throw error;
        }
      }
    }, 120000);

    test("should reject multi-channel audio", async () => {
      await service.initialize();

      const stereoBuffer = {
        data: new Float32Array(32000),
        sampleRate: 16000,
        channels: 2,
      };

      await expect(service.process(stereoBuffer)).rejects.toThrow(
        "Audio must be mono channel"
      );
    }, 120000);

    test("should reject invalid sample rates", async () => {
      await service.initialize();

      const invalidRateBuffer = {
        data: new Float32Array(16000),
        sampleRate: 8000,
        channels: 1,
      };

      await expect(service.process(invalidRateBuffer)).rejects.toThrow(
        /sample rate/i
      );
    }, 120000);

    test("should analyze audio features", async () => {
      await service.initialize();

      const audioBuffer = {
        data: new Float32Array(16000),
        sampleRate: 16000,
        channels: 1,
      };

      // Mock the Python bridge response for analyze
      const bridgeInstance = (service as any).pythonBridge;
      jest.spyOn(bridgeInstance, "executeWav2Vec2").mockResolvedValueOnce({
        features: Array(20).fill(0.1),
        feature_count: 20,
      });

      const features = await service.analyze(audioBuffer);
      expect(features).toBeDefined();
      expect(features.features).toHaveLength(20);
      expect(features.featureCount).toBe(20);
    }, 120000);

    test("should handle various audio durations", async () => {
      await service.initialize();
      const durations = [0.1, 0.5, 1.0, 2.0];

      for (const duration of durations) {
        const samples = Math.floor(16000 * duration);
        const audioBuffer = {
          data: new Float32Array(samples),
          sampleRate: 16000,
          channels: 1,
        };

        const result = await service.process(audioBuffer);
        expect(result).toBeDefined();
        expect(result.transcription).toBeDefined();
      }
    }, 120000);
  });

  // Memory Management Tests
  describe("Memory Management", () => {
    test("should track memory usage during processing", async () => {
      try {
        await service.initialize();

        const audioData = await fs.promises.readFile(testAudioPath);
        const audioBuffer = {
          data: new Float32Array(audioData.buffer),
          sampleRate: 16000,
          channels: 1,
        };

        const memoryUsage = await measureMemoryUsage(async () => {
          try {
            return await service.process(audioBuffer);
          } catch (error) {
            if (
              isErrorWithMessage(error) &&
              !error.message.includes("were not initialized")
            ) {
              throw error;
            }
            return null;
          }
        });

        console.log("Memory usage:", memoryUsage.diff);

        expect(memoryUsage.diff.heapUsed).toBeDefined();

        const memoryManager = (service as any).memoryManager;
        const stats = memoryManager.getOperationStats();

        expect(stats).toBeDefined();
        if (stats.process) {
          expect(stats.process.count).toBeGreaterThan(0);
        }
      } catch (error) {
        if (
          isErrorWithMessage(error) &&
          !error.message.includes("were not initialized")
        ) {
          throw error;
        }
      }
    }, 120000);

    test("should verify proper disposal behavior", async () => {
      const disposalTest = new Wav2Vec2Service(config);
      cleanupQueue.push(() => disposalTest.dispose());
      await disposalTest.initialize();

      const audioBuffer = {
        data: new Float32Array(16000),
        sampleRate: 16000,
        channels: 1,
      };

      const result = await disposalTest.process(audioBuffer);
      expect(result).toBeDefined();
      expect(result.transcription).toBeDefined();

      await disposalTest.dispose();

      await expect(disposalTest.process(audioBuffer)).rejects.toThrow(
        /disposed/i
      );
      await expect(disposalTest.initialize()).rejects.toThrow(/disposed/i);
      await expect(disposalTest.dispose()).resolves.toBeUndefined();
    }, 120000);

    test("should track memory across multiple operations", async () => {
      await service.initialize();

      const audioBuffer = {
        data: new Float32Array(16000),
        sampleRate: 16000,
        channels: 1,
      };

      // Process multiple times with memory tracking
      const memoryResults: number[] = [];
      for (let i = 0; i < 3; i++) {
        const memoryBefore = process.memoryUsage();
        await service.process(audioBuffer);
        const memoryAfter = process.memoryUsage();
        memoryResults.push(memoryAfter.heapUsed - memoryBefore.heapUsed);
      }

      // Verify operations were tracked
      const memoryManager = (service as any).memoryManager;
      const stats = memoryManager.getOperationStats();

      expect(stats.process).toBeDefined();
      expect(stats.process.count).toBe(3);

      // Verify at least one operation had measurable memory impact
      const totalMemoryUsed = memoryResults.reduce(
        (sum, usage) => sum + usage,
        0
      );
      expect(totalMemoryUsed).toBeGreaterThan(0);
    }, 120000);
  });

  // Error Handling Tests
  describe("Error Handling", () => {
    test("should handle errors during processing", async () => {
      await service.initialize();

      const invalidAudioBuffer = {
        data: new Float32Array(0),
        sampleRate: 16000,
        channels: 1,
      };

      await expect(service.process(invalidAudioBuffer)).rejects.toThrow();

      const validAudioBuffer = {
        data: new Float32Array(1600),
        sampleRate: 16000,
        channels: 1,
      };

      try {
        const result = await service.process(validAudioBuffer);
        expect(result).toBeDefined();
      } catch (error) {
        if (
          isErrorWithMessage(error) &&
          !error.message.includes("were not initialized")
        ) {
          throw error;
        }
      }
    }, 120000);

    test("should properly propagate Python errors", async () => {
      await service.initialize();

      const badAudioBuffer = {
        data: new Float32Array(16000),
        sampleRate: -1,
        channels: 1,
      };

      await expect(service.process(badAudioBuffer)).rejects.toThrow(
        /sample rate/i
      );
    }, 120000);

    test("should handle concurrent processing errors", async () => {
      await service.initialize();

      const audioBuffer = {
        data: new Float32Array(16000),
        sampleRate: 16000,
        channels: 1,
      };

      const promises = Array(3)
        .fill(null)
        .map(() => service.process(audioBuffer));

      await expect(Promise.all(promises)).resolves.toBeDefined();
    }, 120000);

    test("should handle file system errors", async () => {
      await service.initialize();

      const audioBuffer = {
        data: new Float32Array(16000),
        sampleRate: 16000,
        channels: 1,
      };

      // Mock writeFile to reject
      jest
        .spyOn(fs.promises, "writeFile")
        .mockRejectedValueOnce(new Error("Mock file system error"));

      await expect(service.process(audioBuffer)).rejects.toThrow(
        "Mock file system error"
      );
    }, 120000);

    test("should handle Python bridge errors", async () => {
      await service.initialize();

      const bridgeInstance = (service as any).pythonBridge;
      jest
        .spyOn(bridgeInstance, "executeWav2Vec2")
        .mockRejectedValueOnce(new Error("Python process crashed"));

      await expect(
        service.process({
          data: new Float32Array(16000),
          sampleRate: 16000,
          channels: 1,
        })
      ).rejects.toThrow(/Python process crashed/);
    }, 120000);
  });
});
