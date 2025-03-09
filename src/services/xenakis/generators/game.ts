import {
  GameTheoryConfig,
  ParameterStream,
  VisualizationData,
  ValidationResult,
  MappingConstraints,
  AudioGenerationParameters,
  EvolutionStrategy,
  MathematicalParameter
} from '../types';
import { MathematicalGenerator } from './base';

interface Strategy {
  name: string;
  probability: number;
}

interface Player {
  name: string;
  strategies: Strategy[];
  currentStrategy: number;
  payoffHistory: number[];
}

class GameTheorySystem {
  private players: Map<string, Player>;
  private payoffMatrix: Map<string, Map<string, number>>;
  private history: GameState[] = [];

  constructor(
    players: string[],
    strategies: Map<string, string[]>,
    payoffs: Map<string, Map<string, number>>
  ) {
    this.players = new Map();
    this.payoffMatrix = payoffs;

    // Initialize players with equal probability for each strategy
    players.forEach(playerName => {
      const playerStrategies = strategies.get(playerName) || [];
      this.players.set(playerName, {
        name: playerName,
        strategies: playerStrategies.map(name => ({
          name,
          probability: 1 / playerStrategies.length
        })),
        currentStrategy: 0,
        payoffHistory: []
      });
    });
  }

  evolve(steps: number, strategy: EvolutionStrategy): void {
    for (let step = 0; step < steps; step++) {
      const state = this.getCurrentState();
      this.history.push(state);

      switch (strategy) {
        case 'nash':
          this.evolveTowardNash();
          break;
        case 'cooperative':
          this.evolveCooperative();
          break;
        case 'competitive':
          this.evolveCompetitive();
          break;
      }
    }
  }

  private evolveTowardNash(): void {
    // Implement fictitious play algorithm
    for (const [playerName, player] of this.players) {
      const strategies = player.strategies;
      const bestResponse = this.findBestResponse(playerName);

      // Update probabilities toward best response
      const learningRate = 0.1;
      strategies.forEach((strategy, i) => {
        if (i === bestResponse) {
          strategy.probability += learningRate * (1 - strategy.probability);
        } else {
          strategy.probability *= (1 - learningRate);
        }
      });

      // Normalize probabilities
      const sum = strategies.reduce((s, strat) => s + strat.probability, 0);
      strategies.forEach(strategy => {
        strategy.probability /= sum;
      });

      // Update current strategy
      player.currentStrategy = bestResponse;
    }
  }

  private evolveCooperative(): void {
    // Implement cooperative strategy maximizing total payoff
    const totalPayoffs = new Map<string, number>();

    for (const [playerName, player] of this.players) {
      for (let i = 0; i < player.strategies.length; i++) {
        const payoff = this.calculateTotalPayoff(playerName, i);
        totalPayoffs.set(player.strategies[i].name, payoff);
      }

      // Choose strategy with highest total payoff
      let maxPayoff = -Infinity;
      let bestStrategy = 0;

      totalPayoffs.forEach((payoff, strategyName) => {
        if (payoff > maxPayoff) {
          maxPayoff = payoff;
          bestStrategy = player.strategies.findIndex(s => s.name === strategyName);
        }
      });

      player.currentStrategy = bestStrategy;
    }
  }

  private evolveCompetitive(): void {
    // Implement competitive strategy maximizing individual payoff
    for (const [playerName, player] of this.players) {
      let maxPayoff = -Infinity;
      let bestStrategy = 0;

      for (let i = 0; i < player.strategies.length; i++) {
        const payoff = this.calculateIndividualPayoff(playerName, i);
        if (payoff > maxPayoff) {
          maxPayoff = payoff;
          bestStrategy = i;
        }
      }

      player.currentStrategy = bestStrategy;
      player.payoffHistory.push(maxPayoff);
    }
  }

  private findBestResponse(playerName: string): number {
    let maxPayoff = -Infinity;
    let bestStrategy = 0;
    const player = this.players.get(playerName)!;

    for (let i = 0; i < player.strategies.length; i++) {
      const payoff = this.calculateIndividualPayoff(playerName, i);
      if (payoff > maxPayoff) {
        maxPayoff = payoff;
        bestStrategy = i;
      }
    }

    return bestStrategy;
  }

  private calculateTotalPayoff(playerName: string, strategyIndex: number): number {
    let totalPayoff = 0;
    const player = this.players.get(playerName)!;

    this.players.forEach((otherPlayer, otherName) => {
      if (otherName !== playerName) {
        const payoff = this.payoffMatrix
          .get(playerName)!
          .get(player.strategies[strategyIndex].name)! +
          this.payoffMatrix
            .get(otherName)!
            .get(otherPlayer.strategies[otherPlayer.currentStrategy].name)!;
        totalPayoff += payoff;
      }
    });

    return totalPayoff;
  }

  private calculateIndividualPayoff(playerName: string, strategyIndex: number): number {
    const player = this.players.get(playerName)!;
    let payoff = 0;

    this.players.forEach((otherPlayer, otherName) => {
      if (otherName !== playerName) {
        payoff += this.payoffMatrix
          .get(playerName)!
          .get(player.strategies[strategyIndex].name)!;
      }
    });

    return payoff;
  }

  getCurrentState(): GameState {
    const state = new Map<string, string>();
    this.players.forEach((player, name) => {
      state.set(name, player.strategies[player.currentStrategy].name);
    });
    return state;
  }

  getHistory(): GameState[] {
    return this.history;
  }

  getPlayers(): Map<string, Player> {
    return new Map(this.players);
  }
}

type GameState = Map<string, string>;

export class GameTheoryGenerator extends MathematicalGenerator<GameTheoryConfig> {
  private game: GameTheorySystem;

  constructor(config: GameTheoryConfig) {
    super(config);
    this.game = new GameTheorySystem(
      config.players,
      config.strategies,
      config.payoffs
    );
  }

  async generate(startTime: number = 0): Promise<ParameterStream> {
    const parameters: MathematicalParameter[] = [];
    const timeStep = this.duration / this.config.steps;

    this.game.evolve(this.config.steps, this.config.evolutionStrategy);
    const history = this.game.getHistory();

    // Convert game states to parameter values
    history.forEach((state, step) => {
      const time = startTime + step * timeStep;
      const stateArray = Array.from(state.entries());

      stateArray.forEach(([playerName, strategy], playerIndex) => {
        parameters.push({
          id: `game-${step}-${playerName}`,
          type: 'game',
          value: this.normalizeStrategyValue(strategy),
          time
        });
      });
    });

    return {
      parameters,
      metadata: {
        generator: 'game',
        config: this.config,
        timestamp: Date.now()
      }
    };
  }

  private normalizeStrategyValue(strategy: string): number {
    // Convert strategy names to normalized numerical values
    const player = this.config.players[0]; // Use first player's strategies as reference
    const strategies = this.config.strategies.get(player) || [];
    const index = strategies.indexOf(strategy);
    return index / (strategies.length - 1);
  }

  async visualize(width: number, height: number): Promise<VisualizationData> {
    const history = this.game.getHistory();
    const players = this.game.getPlayers();
    const data: number[][] = [];

    // Create a row for each player's strategy evolution
    players.forEach(player => {
      const row = new Array(this.config.steps).fill(0);
      history.forEach((state, step) => {
        const strategy = state.get(player.name)!;
        row[step] = this.normalizeStrategyValue(strategy);
      });
      data.push(row);
    });

    return {
      type: 'matrix',
      data,
      dimensions: { width, height },
      labels: Array.from(players.keys()),
      metadata: {
        evolutionStrategy: this.config.evolutionStrategy,
        steps: this.config.steps,
        playerCount: players.size
      }
    };
  }

  validate(): ValidationResult {
    const commonValidation = this.validateCommon();
    const errors: string[] = [...(commonValidation.errors || [])];
    const warnings: string[] = [...(commonValidation.warnings || [])];

    if (this.config.players.length < 2) {
      errors.push('At least two players are required');
    }

    this.config.players.forEach(player => {
      const strategies = this.config.strategies.get(player);
      if (!strategies || strategies.length === 0) {
        errors.push(`Player ${player} has no strategies defined`);
      }
    });

    // Validate payoff matrix
    this.config.players.forEach(player => {
      const payoffs = this.config.payoffs.get(player);
      if (!payoffs) {
        errors.push(`No payoffs defined for player ${player}`);
      }
    });

    if (this.config.steps < 1) {
      errors.push('Number of evolution steps must be positive');
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

    // Calculate average value and variance of strategies
    const values = filteredParams.map(p => p.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    const variance = values.reduce(
      (sum, val) => sum + Math.pow(val - avgValue, 2), 0
    ) / values.length;

    return {
      prompt: `Generated using game theory with ${this.config.evolutionStrategy} evolution`,
      guidanceScale: this.normalize(avgValue, 1, 7),
      diffusionSteps: Math.round(this.normalize(variance, 10, 50))
    };
  }

  dispose(): void {
    // No resources to clean up
  }
}
