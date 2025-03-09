import { SetTheoryGenerator } from '../../generators/set';
import { SetTheoryConfig, ParameterStream } from '../../types';

type PitchClassSet = number[];

describe('SetTheoryGenerator', () => {
  let generator: SetTheoryGenerator;
  let config: SetTheoryConfig;

  beforeEach(() => {
    config = {
      type: 'set',
      duration: 1,
      sampleRate: 44100,
      initialSet: [0, 4, 7], // C major triad
      operations: ['transpose', 'invert'],
      transformationSequence: ['transpose:5', 'invert']
    };
    generator = new SetTheoryGenerator(config);
  });

  describe('validation', () => {
    it('should validate correct configuration', () => {
      const result = generator.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject empty initial set', () => {
      config.initialSet = [];
      generator = new SetTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial set cannot be empty');
    });

    it('should reject non-integer pitch classes', () => {
      config.initialSet = [0, 4.5, 7];
      generator = new SetTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All pitch classes must be integers');
    });

    it('should reject invalid transformation operations', () => {
      config.transformationSequence = ['invalid:5'];
      generator = new SetTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid transformation operation at index 0: invalid');
    });

    it('should reject invalid transposition values', () => {
      config.transformationSequence = ['transpose:xyz'];
      generator = new SetTheoryGenerator(config);
      const result = generator.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid transposition value at index 0: xyz');
    });
  });

  describe('set operations', () => {
    it('should correctly transpose sets', async () => {
      config.transformationSequence = ['transpose:5'];
      generator = new SetTheoryGenerator(config);
      const stream = await generator.generate();

      // C major triad transposed up 5 semitones
      const expectedPitches = [5, 9, 0]; // F major triad (mod 12)
      const finalPitches = stream.parameters
        .slice(-3)
        .map(p => Math.round(p.value * 12))
        .sort((a, b) => a - b);

      expect(finalPitches).toEqual(expectedPitches);
    });

    it('should correctly invert sets', async () => {
      config.transformationSequence = ['invert'];
      generator = new SetTheoryGenerator(config);
      const stream = await generator.generate();

      // C major triad inverted
      const expectedPitches = [0, 8, 5]; // Inverted C major triad (mod 12)
      const finalPitches = stream.parameters
        .slice(-3)
        .map(p => Math.round(p.value * 12))
        .sort((a, b) => a - b);

      expect(finalPitches).toEqual(expectedPitches);
    });

    it('should correctly retrograde sets', async () => {
      config.transformationSequence = ['retrograde'];
      generator = new SetTheoryGenerator(config);
      const stream = await generator.generate();

      // Original set in reverse order
      const expectedOrder = [7, 4, 0];
      const finalPitches = stream.parameters
        .slice(-3)
        .map(p => Math.round(p.value * 12));

      expect(finalPitches).toEqual(expectedOrder);
    });

    it('should handle compound transformations', async () => {
      config.transformationSequence = ['transpose:7', 'invert', 'retrograde'];
      generator = new SetTheoryGenerator(config);
      const stream = await generator.generate();

      // Verify the transformation sequence was applied correctly
      const transformedPitches = stream.parameters
        .slice(-3)
        .map(p => Math.round(p.value * 12));

      expect(transformedPitches.length).toBe(3);
      // Result should be different from original and maintain set-class properties
      expect(transformedPitches).not.toEqual([0, 4, 7]);
    });
  });

  describe('parameter generation', () => {
    it('should normalize pitch classes to [0,1] range', async () => {
      const stream = await generator.generate();
      const allNormalized = stream.parameters.every(p =>
        p.value >= 0 && p.value <= 1
      );
      expect(allNormalized).toBe(true);
    });

    it('should maintain temporal sequence of transformations', async () => {
      const stream = await generator.generate();
      const timePoints = new Set(stream.parameters.map(p => p.time));
      const sortedTimes = Array.from(timePoints).sort();

      // Each transformation should occur at a different time
      expect(sortedTimes.length).toBe(config.transformationSequence.length + 1);

      // Times should be evenly spaced
      const timeDiffs = sortedTimes.slice(1).map((t, i) => t - sortedTimes[i]);
      const allEqual = timeDiffs.every(diff => Math.abs(diff - timeDiffs[0]) < 0.001);
      expect(allEqual).toBe(true);
    });

    it('should preserve set-class relationships', async () => {
      const stream = await generator.generate();
      const sets: PitchClassSet[] = [];
      const timePoints = new Set(stream.parameters.map(p => p.time));

      // Group pitches by time point to get each set
      timePoints.forEach(time => {
        const pitches = stream.parameters
          .filter(p => p.time === time)
          .map(p => Math.round(p.value * 12));
        sets.push(pitches);
      });

      // All sets should have same cardinality as initial set
      expect(sets.every(set => set.length === config.initialSet.length)).toBe(true);

      // All sets should maintain intervallic relationships (mod 12)
      const initialIntervals = getIntervals(config.initialSet);
      sets.forEach(set => {
        const intervals = getIntervals(set);
        expect(intervals).toEqual(initialIntervals);
      });
    });
  });

  describe('visualization', () => {
    it('should generate valid visualization data', async () => {
      const viz = await generator.visualize(100, 100);
      expect(viz.type).toBe('matrix');
      expect(viz.data.length).toBe(12); // One row per pitch class
      expect(viz.dimensions).toEqual({ width: 100, height: 100 });
    });

    it('should show set evolution over time', async () => {
      const viz = await generator.visualize(100, 100);

      // Each transformation should be visible in the visualization
      const activePitches = viz.data
        .map(row => row.some(val => val > 0))
        .filter(Boolean)
        .length;

      // Should have same number of active pitch classes as initial set
      expect(activePitches).toBe(config.initialSet.length);
    });
  });

  describe('audio parameter mapping', () => {
    it('should map set properties to audio parameters', async () => {
      const stream = await generator.generate();
      const audioParams = await generator.mapToAudioParameters(stream);

      expect(audioParams.guidanceScale).toBeDefined();
      expect(audioParams.guidanceScale).toBeGreaterThanOrEqual(1);
      expect(audioParams.guidanceScale).toBeLessThanOrEqual(7);

      expect(audioParams.diffusionSteps).toBeDefined();
      expect(audioParams.diffusionSteps).toBeGreaterThanOrEqual(10);
      expect(audioParams.diffusionSteps).toBeLessThanOrEqual(50);
    });

    it('should reflect set complexity in parameters', async () => {
      // Use a more complex set
      config.initialSet = [0, 1, 4, 6, 7, 9]; // Whole tone + chromatic mixture
      generator = new SetTheoryGenerator(config);
      const stream = await generator.generate();
      const audioParams = await generator.mapToAudioParameters(stream);

      // More complex set should result in higher diffusion steps
      expect(audioParams.diffusionSteps).toBeGreaterThan(30);
    });
  });
});

function getIntervals(pitches: PitchClassSet): number[] {
  const intervals = [];
  for (let i = 0; i < pitches.length - 1; i++) {
    for (let j = i + 1; j < pitches.length; j++) {
      intervals.push(((pitches[j] - pitches[i]) + 12) % 12);
    }
  }
  return intervals.sort((a, b) => a - b);
}
