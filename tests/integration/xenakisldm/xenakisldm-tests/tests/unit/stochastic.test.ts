import { describe, expect, test } from '@jest/globals';

interface StochasticParameters {
    distribution: 'gaussian' | 'poisson' | 'uniform';
    mean?: number;
    variance?: number;
    lambda?: number;
    min?: number;
    max?: number;
}

// Mock audio buffer for testing
class MockAudioBuffer {
    private data: Float32Array;

    constructor(
        public readonly length: number,
        public readonly numberOfChannels: number = 1,
        public readonly sampleRate: number = 44100
    ) {
        this.data = new Float32Array(length);
    }

    get duration(): number {
        return this.length / this.sampleRate;
    }

    getChannelData(channel: number): Float32Array {
        if (channel >= this.numberOfChannels) {
            throw new Error('Channel index out of bounds');
        }
        return this.data;
    }
}

describe('Stochastic Audio Generation', () => {
    test('should generate audio with Gaussian distribution', () => {
        const params: StochasticParameters = {
            distribution: 'gaussian',
            mean: 0,
            variance: 1
        };

        const buffer = new MockAudioBuffer(44100); // 1 second
        const data = buffer.getChannelData(0);

        // Fill buffer with normally distributed values
        for (let i = 0; i < buffer.length; i++) {
            // Box-Muller transform for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            data[i] = z * Math.sqrt(params.variance!) + params.mean!;
        }

        // Calculate actual mean and variance
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += data[i];
        }
        const actualMean = sum / buffer.length;

        let sumSquaredDiff = 0;
        for (let i = 0; i < buffer.length; i++) {
            sumSquaredDiff += Math.pow(data[i] - actualMean, 2);
        }
        const actualVariance = sumSquaredDiff / buffer.length;

        // Test that mean and variance are within expected ranges
        expect(actualMean).toBeWithinRange(
            params.mean! - 0.1,
            params.mean! + 0.1
        );
        expect(actualVariance).toBeWithinRange(
            params.variance! * 0.8,
            params.variance! * 1.2
        );
    });

    test('should have valid audio format', () => {
        const buffer = new MockAudioBuffer(44100);
        expect(buffer).toHaveValidAudioFormat();
        expect(buffer.duration).toBe(1);
        expect(buffer.sampleRate).toBe(44100);
        expect(buffer.numberOfChannels).toBe(1);
    });

    test('should handle parameter validation', () => {
        expect(() => {
            const buffer = new MockAudioBuffer(-1);
        }).toThrow();

        expect(() => {
            const buffer = new MockAudioBuffer(44100);
            buffer.getChannelData(1);
        }).toThrow();
    });
});
