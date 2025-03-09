import { StochasticGenerator } from '../../generators/stochastic';
import { StochasticConfig, ParameterStream } from '../../types';

describe('StochasticGenerator', () => {
  let generator: StochasticGenerator;
  let config: StochasticConfig;

  beforeEach(() => {
    config = {
      type: 'stochastic',
      duration: 1,
      sampleRate: 44100,
      distribution: {
        type: 'gaussian',
        parameters: {
          mean: 0,
          stdDev: 1
        }
      },
      range: {
        min: -1,
        max: 1
      },
      timeScale: 1
    };
    generator = new StochasticGenerator(config);
  });

  describe('validation', () => {
    it('should validate correct configuration', () => {
      const result = generator.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject negative duration', () => {
      config.duration = -1;
      generator = new StochasticGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duration must be positive');
    });

    it('should reject invalid range', () => {
      config.range = { min: 1, max: 0 }; // min > max
      generator = new StochasticGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Range minimum must be less than maximum');
    });

    it('should reject negative standard deviation', () => {
      config.distribution.parameters.stdDev = -1;
      generator = new StochasticGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Standard deviation must be positive');
    });
  });

  describe('parameter generation', () => {
    it('should generate correct number of parameters', async () => {
      const stream = await generator.generate();
      const expectedCount = Math.ceil(config.duration * config.sampleRate);
      expect(stream.parameters.length).toBe(expectedCount);
    });

    it('should generate values within specified range', async () => {
      const stream = await generator.generate();
      const allInRange = stream.parameters.every(p =>
        p.value >= config.range.min && p.value <= config.range.max
      );
      expect(allInRange).toBe(true);
    });

    it('should generate unique values', async () => {
      const stream = await generator.generate();
      const uniqueValues = new Set(stream.parameters.map(p => p.value));
      // Should have reasonable variation (at least 50% unique values)
      expect(uniqueValues.size).toBeGreaterThan(stream.parameters.length * 0.5);
    });

    it('should generate parameters with correct timing', async () => {
      const stream = await generator.generate();
      const timeStep = config.duration / (stream.parameters.length - 1);

      // Check first and last parameters
      expect(stream.parameters[0].time).toBeCloseTo(0);
      expect(stream.parameters[stream.parameters.length - 1].time)
        .toBeCloseTo(config.duration);

      // Check time intervals
      for (let i = 1; i < stream.parameters.length; i++) {
        const timeDiff = stream.parameters[i].time - stream.parameters[i-1].time;
        expect(timeDiff).toBeCloseTo(timeStep);
      }
    });
  });

  describe('distribution properties', () => {
    let values: number[];

    beforeEach(async () => {
      const stream = await generator.generate();
      values = stream.parameters.map(p => p.value);
    });

    it('should generate normally distributed values for gaussian distribution', () => {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      expect(mean).toBeCloseTo(0, 1); // Mean should be close to 0

      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      expect(stdDev).toBeCloseTo(config.distribution.parameters.stdDev, 1);
    });

    it('should maintain time scale property', async () => {
      const fastConfig = { ...config, timeScale: 0.5 };
      const slowConfig = { ...config, timeScale: 2 };

      const fastGenerator = new StochasticGenerator(fastConfig);
      const slowGenerator = new StochasticGenerator(slowConfig);

      const fastStream = await fastGenerator.generate();
      const slowStream = await slowGenerator.generate();

      // Faster time scale should result in more rapid value changes
      const fastChanges = countValueChanges(fastStream);
      const slowChanges = countValueChanges(slowStream);

      expect(fastChanges).toBeGreaterThan(slowChanges);
    });
  });

  describe('visualization', () => {
    it('should generate valid visualization data', async () => {
      const viz = await generator.visualize(100, 100);
      expect(viz.type).toBe('graph');
      expect(viz.data.length).toBe(2); // Distribution curve and histogram
      expect(viz.dimensions).toEqual({ width: 100, height: 100 });
      expect(viz.metadata).toBeDefined();
    });

    it('should generate histogram matching the distribution', async () => {
      const viz = await generator.visualize(100, 100);
      const histogram = viz.data[1];

      // Check if histogram is normalized
      const sum = histogram.reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThan(0);

      // Check if histogram shape roughly matches gaussian
      const mid = Math.floor(histogram.length / 2);
      const leftHalf = histogram.slice(0, mid);
      const rightHalf = histogram.slice(mid);

      // Should be roughly symmetric
      expect(Math.abs(
        leftHalf.reduce((a, b) => a + b, 0) -
        rightHalf.reduce((a, b) => a + b, 0)
      )).toBeLessThan(sum * 0.2); // Within 20% difference
    });
  });
});

function countValueChanges(stream: ParameterStream): number {
  let changes = 0;
  for (let i = 1; i < stream.parameters.length; i++) {
    if (Math.abs(stream.parameters[i].value - stream.parameters[i-1].value) > 0.01) {
      changes++;
    }
  }
  return changes;
}
