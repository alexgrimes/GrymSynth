#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { performance } from 'perf_hooks';
import { SimpleAudioBuffer } from '../interfaces/audio';
import { GAMAService, GAMAServiceConfig } from '../services/audio/GAMAService';
import { GAMAMemoryManager } from '../services/audio/GAMAMemoryManager';
import { AudioFeatureCache } from '../services/caching/AudioFeatureCache';
import { BatchProcessor, BatchOperationType } from '../services/audio/BatchProcessor';
import { Logger } from '../utils/logger';

/**
 * Configuration for the performance benchmark
 */
interface BenchmarkConfig {
  /** Output directory for benchmark results */
  outputDir: string;

  /** Number of iterations for each benchmark */
  iterations: number;

  /** Whether to run baseline benchmarks */
  runBaseline: boolean;

  /** Whether to run optimized benchmarks */
  runOptimized: boolean;

  /** Whether to generate visualizations */
  generateVisualizations: boolean;

  /** Audio file paths to use for benchmarks */
  audioFiles: string[];

  /** GAMA service configuration */
  gamaConfig: GAMAServiceConfig;

  /** Logging configuration */
  logConfig?: {
    /** Whether to log detailed benchmark operations */
    verbose?: boolean;
  };
}

/**
 * Benchmark result for a single operation
 */
interface BenchmarkResult {
  /** Name of the benchmark */
  name: string;

  /** Type of operation */
  operation: string;

  /** Whether optimizations were enabled */
  optimized: boolean;

  /** Duration in milliseconds */
  duration: number;

  /** Memory usage in bytes */
  memoryUsage: number;

  /** Peak memory usage in bytes */
  peakMemoryUsage: number;

  /** Batch size used (if applicable) */
  batchSize?: number;

  /** Cache hit rate (if applicable) */
  cacheHitRate?: number;

  /** Number of items processed */
  itemCount: number;

  /** Items processed per second */
  itemsPerSecond: number;

  /** Timestamp when the benchmark was run */
  timestamp: number;

  /** Additional metrics */
  metrics?: Record<string, any>;
}

/**
 * Benchmark summary with aggregated results
 */
interface BenchmarkSummary {
  /** Name of the benchmark suite */
  name: string;

  /** When the benchmark was run */
  timestamp: number;

  /** Total duration of all benchmarks */
  totalDuration: number;

  /** Results for each benchmark */
  results: BenchmarkResult[];

  /** Comparison with baseline (if available) */
  comparison?: {
    /** Average speedup factor */
    averageSpeedup: number;
    /** Average memory reduction factor */
    averageMemoryReduction: number;
    /** Operations with the most improvement */
    mostImproved: {
      operation: string;
      speedup: number;
    }[];
    /** Operations with performance regressions */
    regressions: {
      operation: string;
      speedup: number;
    }[];
  };

  /** System information */
  system: {
    /** Node.js version */
    nodeVersion: string;
    /** Operating system */
    os: string;
    /** CPU information */
    cpu: string;
    /** Total system memory */
    totalMemory: number;
  };
}

/**
 * Performance bottleneck information
 */
interface PerformanceBottleneck {
  /** Operation name */
  operation: string;

  /** Severity of the bottleneck (0-1) */
  severity: number;

  /** Type of bottleneck */
  type: 'memory' | 'cpu' | 'io' | 'other';

  /** Description of the bottleneck */
  description: string;

  /** Suggested improvements */
  suggestions: string[];
}

/**
 * Default benchmark configuration
 */
const DEFAULT_CONFIG: BenchmarkConfig = {
  outputDir: path.join(process.cwd(), 'benchmark-results'),
  iterations: 5,
  runBaseline: true,
  runOptimized: true,
  generateVisualizations: true,
  audioFiles: [],
  gamaConfig: {
    id: 'benchmark',
    modelPath: path.join(process.cwd(), 'models', 'gama'),
    maxMemory: '4GB',
    device: 'cuda',
    batchSize: 4
  },
  logConfig: {
    verbose: false
  }
};

/**
 * Performance benchmarking suite for GAMA operations
 */
export class PerformanceBenchmark {
  private config: BenchmarkConfig;
  private logger: Logger;
  private baselineResults: BenchmarkResult[] = [];
  private optimizedResults: BenchmarkResult[] = [];
  private audioBuffers: SimpleAudioBuffer[] = [];
  private gamaService: GAMAService | null = null;
  private memoryManager: GAMAMemoryManager | null = null;
  private featureCache: AudioFeatureCache | null = null;
  private batchProcessor: BatchProcessor | null = null;

  /**
   * Creates a new performance benchmark
   * @param config Benchmark configuration
   */
  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger({ namespace: "performance-benchmark" });

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    this.logger.info("Performance benchmark initialized", {
      iterations: this.config.iterations,
      audioFiles: this.config.audioFiles.length
    });
  }

  /**
   * Loads audio files for benchmarking
   * @param audioFiles Array of audio file paths
   */
  public async loadAudioFiles(audioFiles: string[] = this.config.audioFiles): Promise<void> {
    this.logger.info(`Loading ${audioFiles.length} audio files`);

    // In a real implementation, this would load actual audio files
    // For this example, we'll create synthetic audio buffers
    this.audioBuffers = audioFiles.map((_, index) => this.createSyntheticAudioBuffer(index));

    this.logger.info(`Loaded ${this.audioBuffers.length} audio files`);
  }

  /**
   * Creates a synthetic audio buffer for testing
   * @param index Index for varying the buffer properties
   * @returns Synthetic audio buffer
   */
  private createSyntheticAudioBuffer(index: number): SimpleAudioBuffer {
    // Create different sizes of buffers
    const sizes = [16000, 32000, 64000, 128000, 256000];
    const size = sizes[index % sizes.length];

    // Create buffer with random data
    const data = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2) - 1; // Random values between -1 and 1
    }

    return {
      data,
      channels: 1,
      sampleRate: 16000,
      metadata: {
        duration: size / 16000,
        // Use type assertion to add custom property
        ...(({ index } as any))
      }
    };
  }

  /**
   * Initializes services for benchmarking
   * @param optimized Whether to use optimized services
   */
  private async initializeServices(optimized: boolean): Promise<void> {
    // Clean up existing services
    await this.cleanupServices();

    if (optimized) {
      this.logger.info("Initializing optimized services");

      // Initialize memory manager
      this.memoryManager = new GAMAMemoryManager({
        maxMemory: this.config.gamaConfig.maxMemory,
        optimizationThreshold: 60,
        logConfig: {
          verbose: this.config.logConfig?.verbose || false
        }
      });

      // Initialize feature cache
      this.featureCache = new AudioFeatureCache({
        maxEntries: 1000,
        ttl: 3600000,
        enableWarming: true,
        logConfig: {
          verbose: this.config.logConfig?.verbose || false
        }
      });

      // Initialize GAMA service
      this.gamaService = new GAMAService({
        ...this.config.gamaConfig,
        // Add optimized configurations
        useFp16: true,
        useGradientCheckpointing: true,
        quantization: '8bit'
      });

      // Initialize batch processor
      this.batchProcessor = new BatchProcessor({
        maxBatchSize: 8,
        memoryManager: this.memoryManager,
        logConfig: {
          verbose: this.config.logConfig?.verbose || false
        }
      });

      // Register processors for batch operations
      if (this.batchProcessor && this.gamaService) {
        this.registerBatchProcessors();
      }
    } else {
      this.logger.info("Initializing baseline services");

      // Initialize GAMA service with default settings
      this.gamaService = new GAMAService(this.config.gamaConfig);
    }

    // Initialize GAMA service
    if (this.gamaService) {
      await this.gamaService.initialize();
    }
  }

  /**
   * Registers batch processors for different operations
   */
  private registerBatchProcessors(): void {
    if (!this.batchProcessor || !this.gamaService) return;

    // Register processor for audio processing
    this.batchProcessor.registerProcessor(
      BatchOperationType.PROCESS,
      async (items: SimpleAudioBuffer[], resourceStrategy) => {
        const results = [];

        for (const item of items) {
          try {
            const result = await this.gamaService!.process(item);
            results.push(result);
          } catch (error) {
            results.push(error instanceof Error ? error : new Error(String(error)));
          }
        }

        return results;
      }
    );

    // Register processor for feature extraction
    this.batchProcessor.registerProcessor(
      BatchOperationType.EXTRACT_FEATURES,
      async (items: SimpleAudioBuffer[], resourceStrategy) => {
        const results = [];

        for (const item of items) {
          try {
            // Check cache first if available
            let features: Float32Array | undefined;

            if (this.featureCache) {
              const cacheKey = `features:${item.sampleRate}:${item.channels}:${item.data.length}:${(item.metadata as any)?.index || 0}`;
              features = this.featureCache.get(cacheKey);

              if (!features) {
                features = await this.gamaService!.extractFeatures(item);
                this.featureCache.set(cacheKey, features);
              }
            } else {
              features = await this.gamaService!.extractFeatures(item);
            }

            results.push(features);
          } catch (error) {
            results.push(error instanceof Error ? error : new Error(String(error)));
          }
        }

        return results;
      }
    );

    // Register processor for audio analysis
    this.batchProcessor.registerProcessor(
      BatchOperationType.ANALYZE,
      async (items: SimpleAudioBuffer[], resourceStrategy) => {
        const results = [];

        for (const item of items) {
          try {
            const result = await this.gamaService!.analyze(item);
            results.push(result);
          } catch (error) {
            results.push(error instanceof Error ? error : new Error(String(error)));
          }
        }

        return results;
      }
    );
  }

  /**
   * Cleans up services
   */
  private async cleanupServices(): Promise<void> {
    // Shutdown GAMA service
    if (this.gamaService) {
      await this.gamaService.shutdown();
      this.gamaService = null;
    }

    // Dispose memory manager
    if (this.memoryManager) {
      this.memoryManager.dispose();
      this.memoryManager = null;
    }

    // Dispose feature cache
    if (this.featureCache) {
      this.featureCache.dispose();
      this.featureCache = null;
    }

    // Dispose batch processor
    if (this.batchProcessor) {
      this.batchProcessor.dispose();
      this.batchProcessor = null;
    }
  }

  /**
   * Runs all benchmarks
   */
  public async runBenchmarks(): Promise<BenchmarkSummary> {
    const startTime = performance.now();

    // Load audio files if not already loaded
    if (this.audioBuffers.length === 0) {
      await this.loadAudioFiles();
    }

    // Run baseline benchmarks
    if (this.config.runBaseline) {
      this.baselineResults = await this.runBenchmarkSuite(false);
    }

    // Run optimized benchmarks
    if (this.config.runOptimized) {
      this.optimizedResults = await this.runBenchmarkSuite(true);
    }

    // Generate summary
    const summary = this.generateSummary();

    // Save results
    this.saveResults(summary);

    // Generate visualizations
    if (this.config.generateVisualizations) {
      this.generateVisualizations(summary);
    }

    // Clean up
    await this.cleanupServices();

    const totalDuration = performance.now() - startTime;
    this.logger.info(`Benchmarks completed in ${(totalDuration / 1000).toFixed(2)}s`);

    return summary;
  }

  /**
   * Runs a benchmark suite
   * @param optimized Whether to use optimized services
   * @returns Benchmark results
   */
  private async runBenchmarkSuite(optimized: boolean): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    this.logger.info(`Running ${optimized ? 'optimized' : 'baseline'} benchmark suite`);

    // Initialize services
    await this.initializeServices(optimized);

    // Run process benchmark
    results.push(await this.runProcessBenchmark(optimized));

    // Run analyze benchmark
    results.push(await this.runAnalyzeBenchmark(optimized));

    // Run extract features benchmark
    results.push(await this.runExtractFeaturesBenchmark(optimized));

    // Run batch processing benchmark (optimized only)
    if (optimized && this.batchProcessor) {
      results.push(await this.runBatchProcessingBenchmark());
    }

    // Run cache benchmark (optimized only)
    if (optimized && this.featureCache) {
      results.push(await this.runCacheBenchmark());
    }

    return results;
  }

  /**
   * Runs a benchmark for audio processing
   * @param optimized Whether to use optimized services
   * @returns Benchmark result
   */
  private async runProcessBenchmark(optimized: boolean): Promise<BenchmarkResult> {
    const operation = 'process';
    const name = `${optimized ? 'Optimized' : 'Baseline'} Audio Processing`;

    this.logger.info(`Running ${name} benchmark`);

    if (!this.gamaService) {
      throw new Error("GAMA service not initialized");
    }

    // Get memory usage before benchmark
    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;

    const startTime = performance.now();
    let processedItems = 0;

    // Run benchmark for each iteration
    for (let i = 0; i < this.config.iterations; i++) {
      for (const audio of this.audioBuffers) {
        await this.gamaService.process(audio);
        processedItems++;

        // Update peak memory
        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);
      }
    }

    const duration = performance.now() - startTime;
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsage = finalMemory - initialMemory;

    // Calculate items per second
    const itemsPerSecond = (processedItems / duration) * 1000;

    // Get additional metrics
    const metrics: Record<string, any> = {};

    if (optimized && this.memoryManager) {
      const memStats = this.memoryManager.getMemoryUsage();
      metrics.tensorCount = memStats.tensorCount;
      metrics.tensorMemory = memStats.tensorMemory;

      const opStats = this.memoryManager.getOperationStats();
      if (opStats[operation]) {
        metrics.avgDuration = opStats[operation].avgDuration;
      }
    }

    return {
      name,
      operation,
      optimized,
      duration,
      memoryUsage,
      peakMemoryUsage: peakMemory - initialMemory,
      itemCount: processedItems,
      itemsPerSecond,
      timestamp: Date.now(),
      metrics
    };
  }

  /**
   * Runs a benchmark for audio analysis
   * @param optimized Whether to use optimized services
   * @returns Benchmark result
   */
  private async runAnalyzeBenchmark(optimized: boolean): Promise<BenchmarkResult> {
    const operation = 'analyze';
    const name = `${optimized ? 'Optimized' : 'Baseline'} Audio Analysis`;

    this.logger.info(`Running ${name} benchmark`);

    if (!this.gamaService) {
      throw new Error("GAMA service not initialized");
    }

    // Get memory usage before benchmark
    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;

    const startTime = performance.now();
    let processedItems = 0;

    // Run benchmark for each iteration
    for (let i = 0; i < this.config.iterations; i++) {
      for (const audio of this.audioBuffers) {
        await this.gamaService.analyze(audio);
        processedItems++;

        // Update peak memory
        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);
      }
    }

    const duration = performance.now() - startTime;
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsage = finalMemory - initialMemory;

    // Calculate items per second
    const itemsPerSecond = (processedItems / duration) * 1000;

    // Get additional metrics
    const metrics: Record<string, any> = {};

    if (optimized && this.memoryManager) {
      const memStats = this.memoryManager.getMemoryUsage();
      metrics.tensorCount = memStats.tensorCount;
      metrics.tensorMemory = memStats.tensorMemory;

      const opStats = this.memoryManager.getOperationStats();
      if (opStats[operation]) {
        metrics.avgDuration = opStats[operation].avgDuration;
      }
    }

    return {
      name,
      operation,
      optimized,
      duration,
      memoryUsage,
      peakMemoryUsage: peakMemory - initialMemory,
      itemCount: processedItems,
      itemsPerSecond,
      timestamp: Date.now(),
      metrics
    };
  }

  /**
   * Runs a benchmark for feature extraction
   * @param optimized Whether to use optimized services
   * @returns Benchmark result
   */
  private async runExtractFeaturesBenchmark(optimized: boolean): Promise<BenchmarkResult> {
    const operation = 'extractFeatures';
    const name = `${optimized ? 'Optimized' : 'Baseline'} Feature Extraction`;

    this.logger.info(`Running ${name} benchmark`);

    if (!this.gamaService) {
      throw new Error("GAMA service not initialized");
    }

    // Get memory usage before benchmark
    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;

    const startTime = performance.now();
    let processedItems = 0;

    // Run benchmark for each iteration
    for (let i = 0; i < this.config.iterations; i++) {
      for (const audio of this.audioBuffers) {
        await this.gamaService.extractFeatures(audio);
        processedItems++;

        // Update peak memory
        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);
      }
    }

    const duration = performance.now() - startTime;
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsage = finalMemory - initialMemory;

    // Calculate items per second
    const itemsPerSecond = (processedItems / duration) * 1000;

    // Get additional metrics
    const metrics: Record<string, any> = {};

    if (optimized && this.memoryManager) {
      const memStats = this.memoryManager.getMemoryUsage();
      metrics.tensorCount = memStats.tensorCount;
      metrics.tensorMemory = memStats.tensorMemory;

      const opStats = this.memoryManager.getOperationStats();
      if (opStats[operation]) {
        metrics.avgDuration = opStats[operation].avgDuration;
      }
    }

    return {
      name,
      operation,
      optimized,
      duration,
      memoryUsage,
      peakMemoryUsage: peakMemory - initialMemory,
      itemCount: processedItems,
      itemsPerSecond,
      timestamp: Date.now(),
      metrics
    };
  }

  /**
   * Runs a benchmark for batch processing
   * @returns Benchmark result
   */
  private async runBatchProcessingBenchmark(): Promise<BenchmarkResult> {
    const operation = 'batchProcessing';
    const name = 'Batch Processing';

    this.logger.info(`Running ${name} benchmark`);

    if (!this.batchProcessor) {
      throw new Error("Batch processor not initialized");
    }

    // Get memory usage before benchmark
    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;

    const startTime = performance.now();
    let processedItems = 0;

    // Run benchmark for each iteration
    for (let i = 0; i < this.config.iterations; i++) {
      const promises = [];

      // Add items to batch processor
      for (const audio of this.audioBuffers) {
        promises.push(
          this.batchProcessor.addItem(BatchOperationType.EXTRACT_FEATURES, audio)
        );
        processedItems++;

        // Update peak memory
        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);
      }

      // Wait for all items to be processed
      await Promise.all(promises);
    }

    const duration = performance.now() - startTime;
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsage = finalMemory - initialMemory;

    // Calculate items per second
    const itemsPerSecond = (processedItems / duration) * 1000;

    // Get batch size
    const batchSize = this.batchProcessor.getActiveBatches().reduce(
      (max, batch) => Math.max(max, batch.items.length),
      0
    );

    return {
      name,
      operation,
      optimized: true,
      duration,
      memoryUsage,
      peakMemoryUsage: peakMemory - initialMemory,
      itemCount: processedItems,
      itemsPerSecond,
      batchSize,
      timestamp: Date.now()
    };
  }

  /**
   * Runs a benchmark for feature cache
   * @returns Benchmark result
   */
  private async runCacheBenchmark(): Promise<BenchmarkResult> {
    const operation = 'featureCache';
    const name = 'Feature Cache';

    this.logger.info(`Running ${name} benchmark`);

    if (!this.featureCache || !this.gamaService) {
      throw new Error("Feature cache or GAMA service not initialized");
    }

    // Get memory usage before benchmark
    const initialMemory = process.memoryUsage().heapUsed;
    let peakMemory = initialMemory;

    const startTime = performance.now();
    let processedItems = 0;
    let cacheHits = 0;

    // Run benchmark for each iteration
    for (let i = 0; i < this.config.iterations; i++) {
      for (const audio of this.audioBuffers) {
        const cacheKey = `features:${audio.sampleRate}:${audio.channels}:${audio.data.length}:${(audio.metadata as any)?.index || 0}`;

        // Try to get from cache
        let features = this.featureCache.get(cacheKey);

        if (features) {
          cacheHits++;
        } else {
          // Extract features and store in cache
          features = await this.gamaService.extractFeatures(audio);
          this.featureCache.set(cacheKey, features);
        }

        processedItems++;

        // Update peak memory
        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);
      }
    }

    const duration = performance.now() - startTime;
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsage = finalMemory - initialMemory;

    // Calculate items per second
    const itemsPerSecond = (processedItems / duration) * 1000;

    // Calculate cache hit rate
    const cacheHitRate = cacheHits / processedItems;

    // Get cache analytics
    const cacheAnalytics = this.featureCache.getAnalytics();

    return {
      name,
      operation,
      optimized: true,
      duration,
      memoryUsage,
      peakMemoryUsage: peakMemory - initialMemory,
      itemCount: processedItems,
      itemsPerSecond,
      cacheHitRate,
      timestamp: Date.now(),
      metrics: {
        cacheSize: this.featureCache.size(),
        cacheHits: cacheAnalytics.hits,
        cacheMisses: cacheAnalytics.misses,
        estimatedTimeSaved: cacheAnalytics.estimatedTimeSaved
      }
    };
  }

  /**
   * Generates a summary of benchmark results
   * @returns Benchmark summary
   */
  private generateSummary(): BenchmarkSummary {
    const timestamp = Date.now();

    // Combine results
    const results = [...this.baselineResults, ...this.optimizedResults];

    // Calculate total duration
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);

    // Generate comparison if both baseline and optimized results are available
    let comparison: BenchmarkSummary['comparison'] | undefined;

    if (this.baselineResults.length > 0 && this.optimizedResults.length > 0) {
      // Group results by operation
      const baselineByOperation = new Map<string, BenchmarkResult>();
      const optimizedByOperation = new Map<string, BenchmarkResult>();

      this.baselineResults.forEach(result => {
        baselineByOperation.set(result.operation, result);
      });

      this.optimizedResults.forEach(result => {
        optimizedByOperation.set(result.operation, result);
      });

      // Calculate speedups and memory reductions
      const speedups: { operation: string; speedup: number }[] = [];
      const memoryReductions: { operation: string; reduction: number }[] = [];

      for (const [operation, baseline] of baselineByOperation.entries()) {
        const optimized = optimizedByOperation.get(operation);

        if (optimized) {
          // Calculate speedup
          const speedup = baseline.duration / optimized.duration;
          speedups.push({ operation, speedup });

          // Calculate memory reduction
          const reduction = baseline.memoryUsage / optimized.memoryUsage;
          memoryReductions.push({ operation, reduction });
        }
      }

      // Calculate average speedup and memory reduction
      const averageSpeedup = speedups.reduce((sum, { speedup }) => sum + speedup, 0) / speedups.length;
      const averageMemoryReduction = memoryReductions.reduce((sum, { reduction }) => sum + reduction, 0) / memoryReductions.length;

      // Find most improved operations
      const mostImproved = [...speedups].sort((a, b) => b.speedup - a.speedup).slice(0, 3);

      // Find regressions
      const regressions = speedups.filter(({ speedup }) => speedup < 1);

      comparison = {
        averageSpeedup,
        averageMemoryReduction,
        mostImproved,
        regressions
      };
    }

    // Get system information
    const system = {
      nodeVersion: process.version,
      os: process.platform,
      cpu: process.arch,
      totalMemory: os.totalmem()
    };

    return {
      name: 'GAMA Performance Benchmark',
      timestamp,
      totalDuration,
      results,
      comparison,
      system
    };
  }

  /**
   * Saves benchmark results to disk
   * @param summary Benchmark summary
   */
  private saveResults(summary: BenchmarkSummary): void {
    const filename = `benchmark-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const filePath = path.join(this.config.outputDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));

    this.logger.info(`Benchmark results saved to ${filePath}`);
  }

  /**
   * Generates visualizations of benchmark results
   * @param summary Benchmark summary
   */
  private generateVisualizations(summary: BenchmarkSummary): void {
    // In a real implementation, this would generate charts and graphs
    // For this example, we'll just generate a simple HTML report

    const htmlPath = path.join(this.config.outputDir, `benchmark-${new Date().toISOString().replace(/:/g, '-')}.html`);

    // Generate HTML content
    const html = this.generateHtmlReport(summary);

    // Write HTML file
    fs.writeFileSync(htmlPath, html);

    this.logger.info(`Benchmark visualizations saved to ${htmlPath}`);
  }

  /**
   * Generates an HTML report of benchmark results
   * @param summary Benchmark summary
   * @returns HTML content
   */
  private generateHtmlReport(summary: BenchmarkSummary): string {
    // Simple HTML template
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>GAMA Performance Benchmark</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { background-color: #e9f7ef; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .bottleneck { background-color: #fdedec; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
          .improvement { background-color: #eafaf1; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>GAMA Performance Benchmark</h1>
        <p>Run at: ${new Date(summary.timestamp).toLocaleString()}</p>

        <div class="summary">
          <h2>Summary</h2>
          <p>Total Duration: ${(summary.totalDuration / 1000).toFixed(2)}s</p>
          ${summary.comparison ? `
            <p>Average Speedup: ${summary.comparison.averageSpeedup.toFixed(2)}x</p>
            <p>Average Memory Reduction: ${summary.comparison.averageMemoryReduction.toFixed(2)}x</p>
          ` : ''}
        </div>

        <h2>Results</h2>
        <table>
          <tr>
            <th>Operation</th>
            <th>Optimized</th>
            <th>Duration (ms)</th>
            <th>Memory Usage (MB)</th>
            <th>Items/sec</th>
            ${summary.comparison ? '<th>Speedup</th>' : ''}
          </tr>
          ${summary.results.map(result => `
            <tr>
              <td>${result.name}</td>
              <td>${result.optimized ? 'Yes' : 'No'}</td>
              <td>${result.duration.toFixed(2)}</td>
              <td>${(result.memoryUsage / (1024 * 1024)).toFixed(2)}</td>
              <td>${result.itemsPerSecond.toFixed(2)}</td>
              ${summary.comparison ? `
                <td>
                  ${this.getSpeedupForOperation(summary, result.operation, result.optimized)}
                </td>
              ` : ''}
            </tr>
          `).join('')}
        </table>

        ${this.generateBottlenecksHtml(summary)}

        <h2>System Information</h2>
        <table>
          <tr><th>Node.js Version</th><td>${summary.system.nodeVersion}</td></tr>
          <tr><th>Operating System</th><td>${summary.system.os}</td></tr>
          <tr><th>CPU Architecture</th><td>${summary.system.cpu}</td></tr>
          <tr><th>Total Memory</th><td>${(summary.system.totalMemory / (1024 * 1024 * 1024)).toFixed(2)} GB</td></tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Gets the speedup for an operation
   * @param summary Benchmark summary
   * @param operation Operation name
   * @param isOptimized Whether the result is optimized
   * @returns Speedup text
   */
  private getSpeedupForOperation(summary: BenchmarkSummary, operation: string, isOptimized: boolean): string {
    if (!summary.comparison || !isOptimized) {
      return '-';
    }

    const speedup = summary.comparison.mostImproved.find(item => item.operation === operation);
    if (speedup) {
      return `${speedup.speedup.toFixed(2)}x`;
    }

    const regression = summary.comparison.regressions.find(item => item.operation === operation);
    if (regression) {
      return `${regression.speedup.toFixed(2)}x (regression)`;
    }

    return '-';
  }

  /**
   * Generates HTML for performance bottlenecks
   * @param summary Benchmark summary
   * @returns HTML content
   */
  private generateBottlenecksHtml(summary: BenchmarkSummary): string {
    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(summary);

    if (bottlenecks.length === 0) {
      return '';
    }

    return `
      <h2>Performance Bottlenecks</h2>
      ${bottlenecks.map(bottleneck => `
        <div class="bottleneck">
          <h3>${bottleneck.operation} (${bottleneck.type})</h3>
          <p>${bottleneck.description}</p>
          <ul>
            ${bottleneck.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    `;
  }

  /**
   * Identifies performance bottlenecks
   * @param summary Benchmark summary
   * @returns Array of performance bottlenecks
   */
  private identifyBottlenecks(summary: BenchmarkSummary): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Only identify bottlenecks if we have both baseline and optimized results
    if (!summary.comparison) {
      return bottlenecks;
    }

    // Find operations with the lowest speedup
    const optimizedResults = summary.results.filter(result => result.optimized);

    // Sort by items per second (ascending)
    const sortedByThroughput = [...optimizedResults].sort((a, b) => a.itemsPerSecond - b.itemsPerSecond);

    // Check the slowest operation
    if (sortedByThroughput.length > 0) {
      const slowest = sortedByThroughput[0];

      bottlenecks.push({
        operation: slowest.name,
        severity: 0.8,
        type: 'cpu',
        description: `This operation has the lowest throughput at ${slowest.itemsPerSecond.toFixed(2)} items/sec.`,
        suggestions: [
          'Consider further optimizing the algorithm',
          'Investigate if the operation can be parallelized',
          'Profile the code to identify specific slow sections'
        ]
      });
    }

    // Sort by memory usage (descending)
    const sortedByMemory = [...optimizedResults].sort((a, b) => b.memoryUsage - a.memoryUsage);

    // Check the most memory-intensive operation
    if (sortedByMemory.length > 0) {
      const mostMemoryIntensive = sortedByMemory[0];

      bottlenecks.push({
        operation: mostMemoryIntensive.name,
        severity: 0.7,
        type: 'memory',
        description: `This operation uses the most memory at ${(mostMemoryIntensive.memoryUsage / (1024 * 1024)).toFixed(2)} MB.`,
        suggestions: [
          'Review tensor lifecycle management',
          'Consider using lower precision (e.g., FP16)',
          'Implement more aggressive memory optimization',
          'Reduce batch size if applicable'
        ]
      });
    }

    return bottlenecks;
  }
}

/**
 * Main function to run the benchmark
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const config: Partial<BenchmarkConfig> = {};

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output-dir' && i + 1 < args.length) {
      config.outputDir = args[++i];
    } else if (arg === '--iterations' && i + 1 < args.length) {
      config.iterations = parseInt(args[++i], 10);
    } else if (arg === '--no-baseline') {
      config.runBaseline = false;
    } else if (arg === '--no-optimized') {
      config.runOptimized = false;
    } else if (arg === '--no-visualizations') {
      config.generateVisualizations = false;
    } else if (arg === '--verbose') {
      config.logConfig = { verbose: true };
    } else if (arg === '--audio-file' && i + 1 < args.length) {
      config.audioFiles = config.audioFiles || [];
      config.audioFiles.push(args[++i]);
    }
  }

  // If no audio files specified, use synthetic data
  if (!config.audioFiles || config.audioFiles.length === 0) {
    config.audioFiles = Array(10).fill('synthetic');
  }

  // Create and run benchmark
  const benchmark = new PerformanceBenchmark(config);
  await benchmark.runBenchmarks();
}

// Run main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}
