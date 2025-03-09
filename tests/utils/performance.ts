import { AudioBuffer } from "../../src/interfaces/audio";

export interface PerformanceResult {
  duration: number;
  latencyMs: number;
  ratio: number;
}

export interface MemoryProfile {
  iteration: number;
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
}

export interface BatchResult {
  batchSize: number;
  memoryIncreaseMB: number;
}

export function createTestAudio(durationSeconds: number): AudioBuffer {
  const sampleRate = 16000;
  const samples = new Float32Array(sampleRate * durationSeconds);

  // Generate a simple sine wave
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
  }

  return {
    data: samples,
    sampleRate,
    channels: 1,
  };
}

export function formatResults(results: PerformanceResult[]): string {
  return results
    .map(
      (r) =>
        `Duration: ${r.duration}s, Latency: ${r.latencyMs.toFixed(
          2
        )}ms, Ratio: ${r.ratio.toFixed(2)}`
    )
    .join("\n");
}

export function formatMemoryProfiles(profiles: MemoryProfile[]): string {
  return profiles
    .map(
      (p) =>
        `Iteration ${p.iteration}: Heap Used: ${p.heapUsedMB}MB, Total: ${p.heapTotalMB}MB, External: ${p.externalMB}MB`
    )
    .join("\n");
}

export function shouldRunPerformanceTests(): boolean {
  return (
    process.env.IS_CI !== "true" && process.env.RUN_PERFORMANCE_TESTS === "true"
  );
}

export function measureMemoryUsage(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
} {
  const memory = process.memoryUsage();
  return {
    heapUsed: memory.heapUsed / 1024 / 1024,
    heapTotal: memory.heapTotal / 1024 / 1024,
    external: memory.external / 1024 / 1024,
  };
}
