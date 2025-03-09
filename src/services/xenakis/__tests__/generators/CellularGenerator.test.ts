import { CellularGenerator } from '../../generators/cellular';
import { CellularAutomataConfig, ParameterStream } from '../../types';

describe('CellularGenerator', () => {
  let generator: CellularGenerator;
  let config: CellularAutomataConfig;

  beforeEach(() => {
    config = {
      type: 'cellular',
      duration: 1,
      sampleRate: 44100,
      rule: 30, // Wolfram Rule 30 (chaotic)
      initialState: [0, 0, 0, 1, 0, 0, 0], // Single cell
      dimensions: 1,
      neighborhoodSize: 1
    };
    generator = new CellularGenerator(config);
  });

  describe('validation', () => {
    it('should validate correct configuration', () => {
      const result = generator.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject invalid rule numbers', () => {
      config.rule = 256; // Rules must be 0-255 for elementary CA
      generator = new CellularGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rule must be between 0 and 255');
    });

    it('should reject empty initial state', () => {
      config.initialState = [];
      generator = new CellularGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial state cannot be empty');
    });

    it('should reject invalid cell values', () => {
      config.initialState = [0, 2, 1]; // Only 0 and 1 allowed
      generator = new CellularGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial state must contain only 0s and 1s');
    });

    it('should reject invalid neighborhood size', () => {
      config.neighborhoodSize = 0;
      generator = new CellularGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Neighborhood size must be positive');
    });
  });

  describe('pattern generation', () => {
    describe('1D cellular automata', () => {
      it('should correctly implement Rule 30', async () => {
        config.rule = 30;
        generator = new CellularGenerator(config);
        const stream = await generator.generate();

        // First few steps of Rule 30 from a single cell
        const expectedPattern = [
          [0, 0, 0, 1, 0, 0, 0], // Initial state
          [0, 0, 1, 1, 1, 0, 0], // Step 1
          [0, 1, 1, 0, 0, 1, 0]  // Step 2
        ];

        const generatedPattern = extractPattern(stream, 3, config.initialState.length);
        expect(generatedPattern).toEqual(expectedPattern);
      });

      it('should correctly implement Rule 110', async () => {
        config.rule = 110;
        generator = new CellularGenerator(config);
        const stream = await generator.generate();

        // Rule 110 is known to be Turing complete and has specific patterns
        const generatedPattern = extractPattern(stream, 5, config.initialState.length);

        // Verify pattern properties
        expect(generatedPattern.length).toBe(5);
        expect(generatedPattern[0]).toEqual(config.initialState);

        // Rule 110 should maintain some active cells
        const hasActiveCells = generatedPattern.every(row =>
          row.some(cell => cell === 1)
        );
        expect(hasActiveCells).toBe(true);
      });
    });

    describe('2D cellular automata', () => {
      beforeEach(() => {
        config.dimensions = 2;
        config.initialState = [
          0, 0, 0, 0,
          0, 1, 1, 0,
          0, 1, 1, 0,
          0, 0, 0, 0
        ];
      });

      it('should maintain grid topology', async () => {
        generator = new CellularGenerator(config);
        const stream = await generator.generate();

        const size = Math.sqrt(config.initialState.length);
        const pattern = extractPattern(stream, 1, config.initialState.length);

        // Verify each row has correct dimensions
        expect(pattern.every(row => row.length === size * size)).toBe(true);
      });

      it('should implement Game of Life rules', async () => {
        // 2x2 block should remain stable
        generator = new CellularGenerator(config);
        const stream = await generator.generate();

        const pattern = extractPattern(stream, 3, config.initialState.length);

        // Block pattern should remain unchanged
        expect(pattern[0]).toEqual(pattern[1]);
        expect(pattern[1]).toEqual(pattern[2]);
      });

      it('should handle edge wrapping correctly', async () => {
        // Place pattern at the edge
        config.initialState = new Array(16).fill(0);
        config.initialState[3] = 1;  // Top right corner
        config.initialState[7] = 1;  // Right edge

        generator = new CellularGenerator(config);
        const stream = await generator.generate();

        const pattern = extractPattern(stream, 2, config.initialState.length);

        // Verify cells wrapped correctly
        expect(pattern[1][0]).toBe(1); // Should wrap to left edge
      });
    });
  });

  describe('parameter mapping', () => {
    it('should generate parameters with correct timing', async () => {
      const stream = await generator.generate();
      const timeStep = config.duration / (stream.parameters.length / config.initialState.length);

      // Check time intervals
      let lastTime = -1;
      stream.parameters.forEach(p => {
        if (lastTime !== p.time) {
          if (lastTime !== -1) {
            expect(p.time - lastTime).toBeCloseTo(timeStep);
          }
          lastTime = p.time;
        }
      });
    });

    it('should normalize cell values to [0,1]', async () => {
      const stream = await generator.generate();
      const allNormalized = stream.parameters.every(p =>
        p.value === 0 || p.value === 1
      );
      expect(allNormalized).toBe(true);
    });
  });

  describe('visualization', () => {
    it('should generate valid visualization data', async () => {
      const viz = await generator.visualize(100, 100);
      expect(viz.type).toBe('matrix');
      expect(viz.data.length).toBeGreaterThan(0);
      expect(viz.dimensions).toEqual({ width: 100, height: 100 });
    });

    it('should show pattern evolution over time', async () => {
      const viz = await generator.visualize(100, 100);

      // Should have some variation in the pattern
      const hasVariation = viz.data.some(row =>
        row.some(val => val === 1) && row.some(val => val === 0)
      );
      expect(hasVariation).toBe(true);
    });
  });

  describe('audio parameter mapping', () => {
    it('should map cellular activity to audio parameters', async () => {
      const stream = await generator.generate();
      const audioParams = await generator.mapToAudioParameters(stream);

      expect(audioParams.guidanceScale).toBeDefined();
      expect(audioParams.guidanceScale).toBeGreaterThanOrEqual(1);
      expect(audioParams.guidanceScale).toBeLessThanOrEqual(7);

      expect(audioParams.diffusionSteps).toBeDefined();
      expect(audioParams.diffusionSteps).toBeGreaterThanOrEqual(10);
      expect(audioParams.diffusionSteps).toBeLessThanOrEqual(50);
    });

    it('should reflect pattern complexity in parameters', async () => {
      // Use Rule 30 (known for chaos)
      config.rule = 30;
      generator = new CellularGenerator(config);
      const stream = await generator.generate();
      const audioParams = await generator.mapToAudioParameters(stream);

      // Complex patterns should result in higher diffusion steps
      expect(audioParams.diffusionSteps).toBeGreaterThan(30);
    });
  });
});

function extractPattern(stream: ParameterStream, steps: number, width: number): number[][] {
  const pattern: number[][] = [];
  for (let i = 0; i < steps; i++) {
    const row = stream.parameters
      .slice(i * width, (i + 1) * width)
      .map(p => p.value);
    pattern.push(row);
  }
  return pattern;
}
