import { ModelService, ServiceStatus, ServiceMetrics, Task, TaskResult } from '../types';
import { AudioLDMService, AudioGenerationResult } from '../audio/AudioLDMService';
import { Logger } from '../../utils/logger';
import { MemoryManager } from '../../utils/memory';
import {
  XenakisConfig,
  XenakisParameters,
  ValidationResult,
  GeneratorType,
  GeneratorConfig,
  ParameterStream,
  GenerationResult,
  VisualizationData,
  XenakisError,
  StochasticConfig,
  SieveConfig,
  CellularAutomataConfig,
  GameTheoryConfig,
  SetTheoryConfig
} from './types';
import { StochasticGenerator } from './generators/stochastic';
import { SieveGenerator } from './generators/sieve';
import { CellularGenerator } from './generators/cellular';
import { GameTheoryGenerator } from './generators/game';
import { SetTheoryGenerator } from './generators/set';
import { MathematicalGenerator } from './generators/base';

type SpecificConfig =
  | StochasticConfig
  | SieveConfig
  | CellularAutomataConfig
  | GameTheoryConfig
  | SetTheoryConfig;

export class XenakisLDMService implements ModelService {
  private audioLDM: AudioLDMService;
  private memoryManager: MemoryManager;
  private logger: Logger;
  private status: ServiceStatus = 'offline';
  private initialized = false;
  private generators: Map<string, MathematicalGenerator<SpecificConfig>> = new Map();
  private metrics: ServiceMetrics = {
    requestCount: 0,
    processingTime: 0,
    memoryUsage: 0,
    errorCount: 0
  };

  constructor(
    private config: XenakisConfig,
    audioLDM: AudioLDMService
  ) {
    this.audioLDM = audioLDM;
    this.logger = new Logger({ namespace: 'xenakis-service' });
    this.memoryManager = new MemoryManager({ maxMemory: config.maxMemory });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('Initializing XenakisLDM service');
      this.status = 'maintenance';

      const startTime = this.memoryManager.startOperation('initialization');

      // Ensure AudioLDM is initialized
      if (!this.audioLDM.isInitialized()) {
        await this.audioLDM.initialize();
      }

      this.memoryManager.endOperation('initialization', startTime);
      const memUsage = this.memoryManager.getMemoryUsage();
      this.metrics.memoryUsage = memUsage.used;

      this.status = 'online';
      this.initialized = true;
      this.logger.info('XenakisLDM service initialized successfully', {
        memoryUsage: memUsage.used
      });
    } catch (error) {
      this.status = 'error';
      this.metrics.errorCount++;
      this.logger.error('Failed to initialize XenakisLDM service', { error });
      throw new XenakisError(
        'initialization_failed',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async getStatus(): Promise<ServiceStatus> {
    return this.status;
  }

  async getMetrics(): Promise<ServiceMetrics> {
    const memUsage = this.memoryManager.getMemoryUsage();
    return {
      ...this.metrics,
      memoryUsage: memUsage.used
    };
  }

  private createGenerator(type: GeneratorType, config: SpecificConfig): MathematicalGenerator<SpecificConfig> {
    switch (type) {
      case 'stochastic':
        return new StochasticGenerator(config as StochasticConfig);
      case 'sieve':
        return new SieveGenerator(config as SieveConfig);
      case 'cellular':
        return new CellularGenerator(config as CellularAutomataConfig);
      case 'game':
        return new GameTheoryGenerator(config as GameTheoryConfig);
      case 'set':
        return new SetTheoryGenerator(config as SetTheoryConfig);
      default:
        throw new XenakisError('invalid_generator', { type });
    }
  }

  async executeTask(task: Task): Promise<TaskResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (task.type !== 'xenakis-generation') {
      return {
        id: task.id,
        status: 'error',
        data: null,
        error: new Error('Unsupported task type'),
        metrics: this.metrics
      };
    }

    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      const opStartTime = this.memoryManager.startOperation(`task-${task.id}`);
      const params = task.data?.parameters as XenakisParameters;

      const result = await this.generateAudio(params);

      this.memoryManager.endOperation(`task-${task.id}`, opStartTime);
      const memUsage = this.memoryManager.getMemoryUsage();
      const processingTime = Date.now() - startTime;
      this.metrics.processingTime += processingTime;

      return {
        id: task.id,
        status: 'success',
        data: result,
        metrics: {
          ...this.metrics,
          memoryUsage: memUsage.used
        }
      };
    } catch (error) {
      this.metrics.errorCount++;
      this.logger.error('Error executing task', { taskId: task.id, error });

      return {
        id: task.id,
        status: 'error',
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: this.metrics
      };
    }
  }

  async generateAudio(parameters: XenakisParameters): Promise<GenerationResult> {
    this.logger.info('Generating audio with Xenakis parameters');

    const mathematicalParams = parameters.mathematical;
    const parameterStreams: ParameterStream[] = [];
    const visualizations: VisualizationData[] = [];

    // Generate parameters from each mathematical structure
    for (const [type, config] of Object.entries(mathematicalParams)) {
      if (!config) continue;

      const generator = this.createGenerator(type as GeneratorType, config as SpecificConfig);
      const validation = generator.validate();

      if (!validation.isValid) {
        throw new XenakisError('invalid_parameters', { errors: validation.errors });
      }

      const stream = await generator.generate();
      parameterStreams.push(stream);

      const viz = await generator.visualize(800, 400); // Standard visualization size
      visualizations.push(viz);

      this.generators.set(`${type}-${Date.now()}`, generator);
    }

    // Map mathematical parameters to AudioLDM parameters
    const audioParams = await this.mapToAudioParameters(parameterStreams, parameters);

    // Generate audio using AudioLDM
    const audioResult = await this.audioLDM.generateAudio(
      audioParams.prompt,
      audioParams
    );

    return {
      ...audioResult,
      mathematicalStructure: this.combineParameterStreams(parameterStreams),
      visualizationData: this.combineVisualizations(visualizations)
    };
  }

  private async mapToAudioParameters(
    streams: ParameterStream[],
    baseParams: XenakisParameters
  ): Promise<XenakisParameters> {
    // Start with base parameters
    const mappedParams: XenakisParameters = { ...baseParams };

    // Apply each mapping from the mathematical parameters
    for (const mapping of baseParams.mapping) {
      const relevantStream = streams.find(s =>
        s.parameters.some(p => p.id === mapping.source.id)
      );

      if (relevantStream) {
        const generator = this.generators.get(relevantStream.metadata.generator);
        if (generator) {
          const mapped = await generator.mapToAudioParameters(
            relevantStream,
            baseParams.constraints
          );
          mappedParams[mapping.target] = mapped[mapping.target];
        }
      }
    }

    return mappedParams;
  }

  private combineParameterStreams(streams: ParameterStream[]): ParameterStream {
    return {
      parameters: streams.flatMap(s => s.parameters),
      metadata: {
        generator: 'stochastic' as GeneratorType, // Use a default type
        config: {
          type: 'stochastic',
          duration: Math.max(...streams.map(s => (s.metadata.config as GeneratorConfig).duration)),
          sampleRate: streams[0]?.metadata.config.sampleRate || 44100
        },
        timestamp: Date.now()
      }
    };
  }

  private combineVisualizations(visualizations: VisualizationData[]): VisualizationData {
    // Stack visualizations vertically
    const totalHeight = visualizations.reduce((sum, viz) => sum + viz.dimensions.height, 0);
    const width = Math.max(...visualizations.map(viz => viz.dimensions.width));

    const combined: number[][] = [];
    visualizations.forEach(viz => {
      viz.data.forEach(row => {
        combined.push(row);
      });
    });

    return {
      type: 'matrix',
      data: combined,
      dimensions: {
        width,
        height: totalHeight
      },
      labels: visualizations.flatMap(viz => viz.labels || []),
      metadata: {
        generatorCount: visualizations.length,
        timestamp: Date.now()
      }
    };
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;

    try {
      this.logger.info('Shutting down XenakisLDM service');

      // Clean up generators
      for (const generator of this.generators.values()) {
        generator.dispose();
      }
      this.generators.clear();

      this.status = 'offline';
      this.initialized = false;
    } catch (error) {
      this.logger.error('Error shutting down XenakisLDM service', { error });
      throw new XenakisError(
        'shutdown_failed',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}
