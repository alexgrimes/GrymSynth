import { AudioMetrics } from '../types';

export class MetricsCollector {
  private startTime: number | null = null;
  private measurements: {
    duration: number[];
    memory: number[];
    cpu: number[];
  } = {
    duration: [],
    memory: [],
    cpu: []
  };

  startRecording(): void {
    this.startTime = Date.now();
    this.measurements = {
      duration: [],
      memory: [],
      cpu: []
    };
  }

  stopRecording(): void {
    if (!this.startTime) return;

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    this.measurements.duration.push(duration);
    this.measurements.memory.push(process.memoryUsage().heapUsed);
    this.measurements.cpu.push(0); // Mock CPU usage

    this.startTime = null;
  }

  getMetrics(): AudioMetrics {
    const durations = this.measurements.duration;
    const memories = this.measurements.memory;
    const cpus = this.measurements.cpu;

    return {
      duration: {
        total: this.average(durations),
        processing: this.average(durations) * 0.8, // Simulated processing time
        overhead: this.average(durations) * 0.2    // Simulated overhead
      },
      memory: {
        peak: Math.max(...memories),
        average: this.average(memories)
      },
      cpu: {
        peak: Math.max(...cpus),
        average: this.average(cpus)
      }
    };
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}
