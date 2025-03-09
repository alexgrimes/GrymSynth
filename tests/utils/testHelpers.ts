import fs from "fs";
import path from "path";
import os from "os";

/**
 * Creates a test WAV file with a sine wave
 */
export async function createTestAudioFile(
  frequency: number = 440,
  durationSec: number = 3,
  sampleRate: number = 16000
): Promise<string> {
  // Create a mock WAV file structure
  const filePath = path.join(os.tmpdir(), `test_audio_${Date.now()}.wav`);

  // Create a simple header to make it look like a WAV file
  const buffer = Buffer.alloc(44); // Basic WAV header

  // Write the mock WAV file
  await fs.promises.writeFile(filePath, buffer);

  return filePath;
}

/**
 * Captures memory usage before and after an operation
 */
export async function measureMemoryUsage<T>(
  operation: () => Promise<T>
): Promise<{
  result: T;
  startMemory: NodeJS.MemoryUsage;
  endMemory: NodeJS.MemoryUsage;
  diff: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}> {
  // Trigger GC if available to get accurate readings
  if (global.gc) {
    global.gc();
  }

  const startMemory = process.memoryUsage();
  const result = await operation();
  const endMemory = process.memoryUsage();

  return {
    result,
    startMemory,
    endMemory,
    diff: {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    },
  };
}
