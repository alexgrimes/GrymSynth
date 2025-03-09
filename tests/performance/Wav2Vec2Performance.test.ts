import { Wav2Vec2Service } from "../../src/services/audio/Wav2Vec2Service";
import { AudioBuffer } from "../../src/interfaces/audio";
import {
  PerformanceResult,
  MemoryProfile,
  BatchResult,
  createTestAudio,
  formatResults,
  formatMemoryProfiles,
  shouldRunPerformanceTests,
  measureMemoryUsage,
} from "../utils/performance";

describe("Wav2Vec2Service Performance", () => {
  let service: Wav2Vec2Service;
  let testAudioBuffers: AudioBuffer[];

  // Create test audio buffers of different durations
  beforeAll(async () => {
    service = new Wav2Vec2Service({ maxMemory: "2GB" });
    testAudioBuffers = [
      createTestAudio(1), // 1 second
      createTestAudio(3), // 3 seconds
      createTestAudio(5), // 5 seconds
      createTestAudio(10), // 10 seconds
    ];
  });

  afterAll(async () => {
    await service.dispose();
  });

  describe("Processing Performance", () => {
    // Skip tests if not in performance test mode
    (shouldRunPerformanceTests() ? describe : describe.skip)(
      "Latency Tests",
      () => {
        it("should meet latency targets for different audio lengths", async () => {
          const results: PerformanceResult[] = [];

          for (const audio of testAudioBuffers) {
            const duration = audio.data.length / audio.sampleRate;
            const start = process.hrtime.bigint();

            await service.process(audio);

            const end = process.hrtime.bigint();
            const latencyMs = Number(end - start) / 1_000_000;

            results.push({
              duration,
              latencyMs,
              ratio: latencyMs / (duration * 1000), // Processing time / Audio duration
            });

            // Ensure processing is faster than real-time
            expect(latencyMs).toBeLessThan(duration * 1000);
          }

          // Log performance results
          console.log("Performance Results:\n" + formatResults(results));
        }, 30000);

        it("should handle concurrent processing within memory limits", async () => {
          const concurrentRequests = 5;
          const audio = testAudioBuffers[0]; // Use 1-second audio
          const initialMemory = measureMemoryUsage();

          // Process multiple requests concurrently
          const start = process.hrtime.bigint();
          await Promise.all(
            Array(concurrentRequests)
              .fill(0)
              .map(() => service.process(audio))
          );
          const end = process.hrtime.bigint();

          const finalMemory = measureMemoryUsage();
          const totalLatencyMs = Number(end - start) / 1_000_000;
          const avgLatencyMs = totalLatencyMs / concurrentRequests;
          const memoryIncreaseMB =
            finalMemory.heapUsed - initialMemory.heapUsed;

          const result = {
            concurrentRequests,
            totalLatencyMs,
            avgLatencyMs,
            memoryIncreaseMB: Math.round(memoryIncreaseMB * 100) / 100,
          };

          console.log("Concurrent Processing Results:", result);

          // Performance assertions
          expect(avgLatencyMs).toBeLessThan(1000); // Less than 1 second per request
          expect(memoryIncreaseMB).toBeLessThan(500); // Less than 500MB increase
        }, 30000);
      }
    );
  });

  describe("Memory Management", () => {
    // Skip tests if not in performance test mode
    (shouldRunPerformanceTests() ? describe : describe.skip)(
      "Memory Tests",
      () => {
        it("should maintain stable memory usage over repeated operations", async () => {
          const iterations = 10;
          const audio = testAudioBuffers[0]; // Use 1-second audio
          const memoryProfiles: MemoryProfile[] = [];

          for (let i = 0; i < iterations; i++) {
            const beforeMemory = measureMemoryUsage();
            await service.process(audio);
            const afterMemory = measureMemoryUsage();

            memoryProfiles.push({
              iteration: i + 1,
              heapUsedMB: Math.round(
                afterMemory.heapUsed - beforeMemory.heapUsed
              ),
              heapTotalMB: Math.round(afterMemory.heapTotal),
              externalMB: Math.round(afterMemory.external),
            });

            // Force garbage collection if available
            if (global.gc) {
              global.gc();
            }
          }

          console.log(
            "Memory Profiles:\n" + formatMemoryProfiles(memoryProfiles)
          );

          // Check for memory leaks
          const memoryVariation =
            Math.max(...memoryProfiles.map((p) => p.heapUsedMB)) -
            Math.min(...memoryProfiles.map((p) => p.heapUsedMB));

          expect(memoryVariation).toBeLessThan(100); // Less than 100MB variation
        }, 60000);

        it("should properly clean up resources after large batches", async () => {
          const batchSize = 20;
          const audio = testAudioBuffers[0]; // Use 1-second audio
          const initialMemory = measureMemoryUsage().heapUsed;

          // Process a large batch
          for (let i = 0; i < batchSize; i++) {
            await service.process(audio);
          }

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }

          const finalMemory = measureMemoryUsage().heapUsed;
          const memoryIncreaseMB = finalMemory - initialMemory;

          const result: BatchResult = {
            batchSize,
            memoryIncreaseMB: Math.round(memoryIncreaseMB * 100) / 100,
          };

          console.log("Batch Processing Results:", result);

          // Check for memory leaks
          expect(memoryIncreaseMB).toBeLessThan(200); // Less than 200MB retained
        }, 60000);
      }
    );
  });
});
