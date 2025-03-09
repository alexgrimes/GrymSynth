import { GameTheoryGenerator } from '../../generators/game';
import { GameTheoryConfig, ParameterStream } from '../../types';

describe('GameTheoryGenerator', () => {
  let generator: GameTheoryGenerator;
  let config: GameTheoryConfig;

  beforeEach(() => {
    config = {
      type: 'game',
      duration: 1,
      sampleRate: 44100,
      players: ['player1', 'player2'],
      strategies: new Map([
        ['player1', ['cooperate', 'defect']],
        ['player2', ['cooperate', 'defect']]
      ]),
      payoffs: new Map([
        ['player1', new Map([
          ['cooperate', 3],
          ['defect', 5]
        ])],
        ['player2', new Map([
          ['cooperate', 3],
          ['defect', 5]
        ])]
      ]),
      evolutionStrategy: 'nash',
      steps: 10
    };
    generator = new GameTheoryGenerator(config);
  });

  describe('validation', () => {
    it('should validate correct configuration', () => {
      const result = generator.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject configuration with single player', () => {
      config.players = ['player1'];
      generator = new GameTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least two players are required');
    });

    it('should reject missing strategies', () => {
      config.strategies = new Map([['player1', ['cooperate', 'defect']]]);
      generator = new GameTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player player2 has no strategies defined');
    });

    it('should reject missing payoffs', () => {
      config.payoffs = new Map([['player1', new Map()]]);
      generator = new GameTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No payoffs defined for player player2');
    });

    it('should reject invalid step count', () => {
      config.steps = 0;
      generator = new GameTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of evolution steps must be positive');
    });
  });

  describe('evolution strategies', () => {
    it('should evolve toward Nash equilibrium', async () => {
      config.evolutionStrategy = 'nash';
      generator = new GameTheoryGenerator(config);
      const stream = await generator.generate();

      // In prisoner's dilemma-like games, should converge to defect
      const finalStates = stream.parameters.slice(-2);
      expect(finalStates.every(p => p.value > 0.5)).toBe(true); // Both players defecting
    });

    it('should maintain cooperation in cooperative mode', async () => {
      config.evolutionStrategy = 'cooperative';
      // Set payoffs to favor cooperation
      config.payoffs = new Map([
        ['player1', new Map([
          ['cooperate', 5],
          ['defect', 3]
        ])],
        ['player2', new Map([
          ['cooperate', 5],
          ['defect', 3]
        ])]
      ]);

      generator = new GameTheoryGenerator(config);
      const stream = await generator.generate();

      // Should converge to cooperation
      const finalStates = stream.parameters.slice(-2);
      expect(finalStates.every(p => p.value < 0.5)).toBe(true);
    });

    it('should maximize individual payoffs in competitive mode', async () => {
      config.evolutionStrategy = 'competitive';
      const stream = await generator.generate();

      // Each player should choose highest individual payoff
      const player1States = stream.parameters.filter(p => p.id.includes('player1'));
      const player2States = stream.parameters.filter(p => p.id.includes('player2'));

      // Verify each player maximizes their own payoff
      expect(player1States[player1States.length - 1].value).toBeGreaterThan(0.5);
      expect(player2States[player2States.length - 1].value).toBeGreaterThan(0.5);
    });
  });

  describe('parameter generation', () => {
    it('should generate correct number of parameters', async () => {
      const stream = await generator.generate();
      // Should have one parameter per player per step
      expect(stream.parameters.length).toBe(config.players.length * config.steps);
    });

    it('should generate parameters with correct timing', async () => {
      const stream = await generator.generate();
      const timeStep = config.duration / config.steps;

      stream.parameters.forEach((param, i) => {
        const stepIndex = Math.floor(i / config.players.length);
        expect(param.time).toBeCloseTo(stepIndex * timeStep);
      });
    });

    it('should maintain player relationships in parameter sequence', async () => {
      const stream = await generator.generate();

      for (let step = 0; step < config.steps; step++) {
        const stepParams = stream.parameters.slice(
          step * config.players.length,
          (step + 1) * config.players.length
        );

        // Each step should have one parameter per player
        expect(stepParams.length).toBe(config.players.length);
        config.players.forEach(player => {
          expect(stepParams.some(p => p.id.includes(player))).toBe(true);
        });
      }
    });
  });

  describe('visualization', () => {
    it('should generate valid visualization data', async () => {
      const viz = await generator.visualize(100, 100);
      expect(viz.type).toBe('matrix');
      expect(viz.data.length).toBe(config.players.length); // One row per player
      expect(viz.dimensions).toEqual({ width: 100, height: 100 });
      expect(viz.labels).toEqual(config.players);
    });

    it('should show strategy evolution over time', async () => {
      const viz = await generator.visualize(100, 100);

      // Each row should show evolution of strategies
      viz.data.forEach(row => {
        // Should have some variation in values
        const uniqueValues = new Set(row);
        expect(uniqueValues.size).toBeGreaterThan(1);
      });
    });
  });

  describe('audio parameter mapping', () => {
    it('should map game states to audio parameters', async () => {
      const stream = await generator.generate();
      const audioParams = await generator.mapToAudioParameters(stream);

      expect(audioParams.guidanceScale).toBeDefined();
      expect(audioParams.guidanceScale).toBeGreaterThanOrEqual(1);
      expect(audioParams.guidanceScale).toBeLessThanOrEqual(7);

      expect(audioParams.diffusionSteps).toBeDefined();
      expect(audioParams.diffusionSteps).toBeGreaterThanOrEqual(10);
      expect(audioParams.diffusionSteps).toBeLessThanOrEqual(50);
    });

    it('should reflect game dynamics in parameter values', async () => {
      const stream = await generator.generate();
      const audioParams = await generator.mapToAudioParameters(stream);

      // Parameters should reflect the complexity of the game evolution
      const values = stream.parameters.map(p => p.value);
      const variance = calculateVariance(values);

      // High variance should lead to more diffusion steps
      expect(audioParams.diffusionSteps).toBeGreaterThan(25);
    });
  });
});

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}
