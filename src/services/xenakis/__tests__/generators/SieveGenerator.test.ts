import { SieveGenerator } from '../../generators/sieve';
import { SieveConfig, ParameterStream } from '../../types';

describe('SieveGenerator', () => {
  let generator: SieveGenerator;
  let config: SieveConfig;

  beforeEach(() => {
    config = {
      type: 'sieve',
      duration: 1,
      sampleRate: 44100,
      moduli: [2, 3],
      residues: [0, 1],
      operations: ['union']
    };
    generator = new SieveGenerator(config);
  });

  describe('validation', () => {
    it('should validate correct configuration', () => {
      const result = generator.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject mismatched moduli and residues', () => {
      config.moduli = [2, 3];
      config.residues = [0]; // Missing residue
      generator = new SieveGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Number of moduli must match number of residues');
    });

    it('should reject negative moduli', () => {
      config.moduli = [2, -3];
      generator = new SieveGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All moduli must be positive');
    });

    it('should reject negative residues', () => {
      config.residues = [-1, 1];
      generator = new SieveGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All residues must be non-negative');
    });

    it('should reject residues greater than or equal to moduli', () => {
      config.moduli = [2, 3];
      config.residues = [1, 3]; // 3 >= 3
      generator = new SieveGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Residue 3 must be less than modulus 3');
    });
  });

  describe('sieve operations', () => {
    it('should correctly implement union operation', async () => {
      config.moduli = [2, 3];
      config.residues = [0, 0];
      config.operations = ['union'];
      generator = new SieveGenerator(config);

      const stream = await generator.generate();

      // Union should include points from both sieves
      // For moduli [2,3] and residues [0,0], points should be at [0,2,3,4,6,8,9,10,...]
      const expectedPoints = new Set([0, 2, 3, 4, 6, 8, 9, 10]);
      const actualPoints = new Set(
        stream.parameters
          .filter(p => p.value === 1)
          .map(p => Math.round(p.time * config.sampleRate))
      );

      expect(actualPoints).toEqual(expectedPoints);
    });

    it('should correctly implement intersection operation', async () => {
      config.moduli = [2, 3];
      config.residues = [0, 0];
      config.operations = ['intersection'];
      generator = new SieveGenerator(config);

      const stream = await generator.generate();

      // Intersection should only include points present in both sieves
      // For moduli [2,3] and residues [0,0], points should be at [0,6,12,...]
      const expectedPoints = new Set([0, 6]);
      const actualPoints = new Set(
        stream.parameters
          .filter(p => p.value === 1)
          .map(p => Math.round(p.time * config.sampleRate))
      );

      expect(actualPoints).toEqual(expectedPoints);
    });

    it('should correctly implement complement operation', async () => {
      config.moduli = [2];
      config.residues = [0];
      config.operations = ['complement'];
      generator = new SieveGenerator(config);

      const stream = await generator.generate();

      // Complement of modulus 2, residue 0 should be odd numbers
      const points = stream.parameters
        .filter(p => p.value === 1)
        .map(p => Math.round(p.time * config.sampleRate));

      expect(points.every(p => p % 2 === 1)).toBe(true);
    });
  });

  describe('parameter generation', () => {
    it('should generate binary values (0 or 1)', async () => {
      const stream = await generator.generate();
      const validValues = stream.parameters.every(p =>
        p.value === 0 || p.value === 1
      );
      expect(validValues).toBe(true);
    });

    it('should respect period if specified', async () => {
      config.period = 6;
      generator = new SieveGenerator(config);
      const stream = await generator.generate();

      // Check if pattern repeats every period
      const pattern = stream.parameters.slice(0, Math.floor(config.sampleRate * config.period));
      const nextPattern = stream.parameters.slice(
        Math.floor(config.sampleRate * config.period),
        Math.floor(config.sampleRate * config.period * 2)
      );

      const patternsMatch = pattern.every((p, i) =>
        nextPattern[i] && p.value === nextPattern[i].value
      );
      expect(patternsMatch).toBe(true);
    });
  });

  describe('visualization', () => {
    it('should generate valid visualization data', async () => {
      const viz = await generator.visualize(100, 100);
      expect(viz.type).toBe('graph');
      expect(viz.data.length).toBeGreaterThanOrEqual(1);
      expect(viz.dimensions).toEqual({ width: 100, height: 100 });
    });

    it('should include period markers when period is specified', async () => {
      config.period = 6;
      generator = new SieveGenerator(config);
      const viz = await generator.visualize(100, 100);

      expect(viz.data.length).toBe(2); // Points and period markers
      expect(viz.data[1].some(v => v > 0)).toBe(true); // Should have some period markers
    });
  });

  describe('audio parameter mapping', () => {
    it('should map sieve density to audio parameters', async () => {
      const stream = await generator.generate();
      const audioParams = await generator.mapToAudioParameters(stream);

      expect(audioParams.guidanceScale).toBeDefined();
      expect(audioParams.guidanceScale).toBeGreaterThanOrEqual(1);
      expect(audioParams.guidanceScale).toBeLessThanOrEqual(7);
      expect(audioParams.diffusionSteps).toBeDefined();
      expect(audioParams.diffusionSteps).toBeGreaterThanOrEqual(10);
      expect(audioParams.diffusionSteps).toBeLessThanOrEqual(50);
    });

    it('should handle constraints in parameter mapping', async () => {
      const stream = await generator.generate();
      const constraints = {
        timeRange: { min: 0, max: 0.5 },
        valueRange: { min: 0, max: 1 }
      };

      const audioParams = await generator.mapToAudioParameters(stream, constraints);

      // Parameters should be based only on the constrained portion of the stream
      const filteredStream = {
        ...stream,
        parameters: stream.parameters.filter(p =>
          p.time >= constraints.timeRange.min &&
          p.time <= constraints.timeRange.max &&
          p.value >= constraints.valueRange.min &&
          p.value <= constraints.valueRange.max
        )
      };

      const unconstrained = await generator.mapToAudioParameters(filteredStream);
      expect(audioParams).toEqual(unconstrained);
    });
  });
});
