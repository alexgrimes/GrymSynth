import {
  CellularAutomataConfig,
  ParameterStream,
  VisualizationData,
  ValidationResult,
  MappingConstraints,
  AudioGenerationParameters,
  MathematicalParameter
} from '../types';
import { MathematicalGenerator } from './base';

interface Cell {
  state: number;
  x: number;
  y: number;
}

class CellularAutomaton {
  private grid: number[][];
  private width: number;
  private height: number;
  private rule: number;

  constructor(
    initialState: number[],
    dimensions: 1 | 2,
    rule: number,
    timeSteps: number
  ) {
    this.rule = rule;

    if (dimensions === 1) {
      this.width = initialState.length;
      this.height = timeSteps;
      this.grid = Array(this.height).fill(0).map(() =>
        Array(this.width).fill(0)
      );
      this.grid[0] = [...initialState];
    } else {
      const size = Math.ceil(Math.sqrt(initialState.length));
      this.width = size;
      this.height = size;
      this.grid = Array(size).fill(0).map((_, y) =>
        Array(size).fill(0).map((_, x) =>
          initialState[y * size + x] || 0
        )
      );
    }
  }

  evolve(steps: number): void {
    for (let t = 0; t < steps; t++) {
      if (this.grid[0].length === this.width) { // 1D
        this.evolve1D(t);
      } else { // 2D
        this.evolve2D();
      }
    }
  }

  private evolve1D(currentStep: number): void {
    const nextRow = new Array(this.width).fill(0);
    const currentRow = this.grid[currentStep];

    for (let x = 0; x < this.width; x++) {
      const left = currentRow[(x - 1 + this.width) % this.width];
      const center = currentRow[x];
      const right = currentRow[(x + 1) % this.width];
      const neighborhood = (left << 2) | (center << 1) | right;
      nextRow[x] = (this.rule >> neighborhood) & 1;
    }

    this.grid[currentStep + 1] = nextRow;
  }

  private evolve2D(): void {
    const newGrid = this.grid.map(row => [...row]);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const neighbors = this.countNeighbors(x, y);
        newGrid[y][x] = this.apply2DRule(this.grid[y][x], neighbors);
      }
    }

    this.grid = newGrid;
  }

  private countNeighbors(x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + this.width) % this.width;
        const ny = (y + dy + this.height) % this.height;
        count += this.grid[ny][nx];
      }
    }
    return count;
  }

  private apply2DRule(currentState: number, neighbors: number): number {
    // Game of Life rules by default
    if (currentState === 1) {
      return neighbors === 2 || neighbors === 3 ? 1 : 0;
    } else {
      return neighbors === 3 ? 1 : 0;
    }
  }

  getState(): number[][] {
    return this.grid.map(row => [...row]);
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}

export class CellularGenerator extends MathematicalGenerator<CellularAutomataConfig> {
  private automaton: CellularAutomaton;
  private evolutionSteps: number;

  constructor(config: CellularAutomataConfig) {
    super(config);
    this.evolutionSteps = Math.ceil(this.duration * this.sampleRate);
    this.automaton = new CellularAutomaton(
      config.initialState,
      config.dimensions,
      config.rule,
      this.evolutionSteps
    );
  }

  async generate(startTime: number = 0): Promise<ParameterStream> {
    const parameters: MathematicalParameter[] = [];
    this.automaton.evolve(this.evolutionSteps);
    const state = this.automaton.getState();
    const timeStep = this.duration / this.evolutionSteps;

    for (let t = 0; t < this.evolutionSteps; t++) {
      // Calculate average activity for this time step
      let activity = 0;
      if (this.config.dimensions === 1) {
        activity = state[t].reduce((sum, val) => sum + val, 0) / state[t].length;
      } else {
        activity = state.reduce((sum, row) =>
          sum + row.reduce((rowSum, val) => rowSum + val, 0), 0
        ) / (state.length * state[0].length);
      }

      parameters.push({
        id: `cellular-${t}`,
        type: 'cellular',
        value: activity,
        time: startTime + t * timeStep
      });
    }

    return {
      parameters,
      metadata: {
        generator: 'cellular',
        config: this.config,
        timestamp: Date.now()
      }
    };
  }

  async visualize(width: number, height: number): Promise<VisualizationData> {
    const state = this.automaton.getState();
    const { width: gridWidth, height: gridHeight } = this.automaton.getDimensions();

    // Scale the grid to fit the visualization dimensions
    const cellWidth = width / gridWidth;
    const cellHeight = height / gridHeight;

    // Create visualization grid
    const data: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));

    // Map automaton state to visualization grid
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const visualX = Math.floor(x * cellWidth);
        const visualY = Math.floor(y * cellHeight);
        data[visualY][visualX] = state[y][x];
      }
    }

    return {
      type: 'matrix',
      data,
      dimensions: { width, height },
      labels: ['Time', 'Space'],
      metadata: {
        rule: this.config.rule,
        dimensions: this.config.dimensions,
        steps: this.evolutionSteps
      }
    };
  }

  validate(): ValidationResult {
    const commonValidation = this.validateCommon();
    const errors: string[] = [...(commonValidation.errors || [])];
    const warnings: string[] = [...(commonValidation.warnings || [])];

    if (this.config.rule < 0 || this.config.rule > 255) {
      errors.push('Rule must be between 0 and 255');
    }

    if (this.config.initialState.length === 0) {
      errors.push('Initial state cannot be empty');
    }

    if (this.config.initialState.some(val => val !== 0 && val !== 1)) {
      errors.push('Initial state must contain only 0s and 1s');
    }

    if (this.config.neighborhoodSize < 1) {
      errors.push('Neighborhood size must be positive');
    }

    if (this.config.dimensions === 2 && !Number.isInteger(Math.sqrt(this.config.initialState.length))) {
      errors.push('2D initial state must have square dimensions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async mapToAudioParameters(
    params: ParameterStream,
    constraints?: MappingConstraints
  ): Promise<AudioGenerationParameters> {
    // Filter parameters based on time constraints if provided
    let filteredParams = params.parameters;
    if (constraints?.timeRange) {
      filteredParams = filteredParams.filter(
        p => p.time >= constraints.timeRange!.min &&
            p.time <= constraints.timeRange!.max
      );
    }

    // Calculate complexity measures from cellular automata patterns
    const activity = filteredParams.reduce((sum, p) => sum + p.value, 0) /
                    filteredParams.length;

    const variability = Math.sqrt(
      filteredParams.reduce((sum, p) =>
        sum + Math.pow(p.value - activity, 2), 0
      ) / filteredParams.length
    );

    return {
      prompt: `Generated using cellular automata rule ${this.config.rule}`,
      guidanceScale: this.normalize(activity, 1, 7),
      diffusionSteps: Math.round(this.normalize(variability, 10, 50))
    };
  }

  dispose(): void {
    // No resources to clean up
  }
}
