const {
    assert,
    assertCloseTo,
    createTestBuffer,
    generateSineWave,
    logTestResult,
    saveTestResults,
    measurePerformance
} = require('../utils/test-utils');

// Audio processing utilities
function calculateRMS(samples) {
    const sum = samples.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / samples.length);
}

function calculateSpectrum(samples, sampleRate) {
    const fft = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        fft[i] = samples[i];
    }

    // Simple DFT implementation for spectrum analysis
    const spectrum = new Float32Array(samples.length / 2);
    for (let f = 0; f < samples.length / 2; f++) {
        let real = 0, imag = 0;
        for (let t = 0; t < samples.length; t++) {
            const angle = 2 * Math.PI * f * t / samples.length;
            real += samples[t] * Math.cos(angle);
            imag += samples[t] * Math.sin(angle);
        }
        spectrum[f] = Math.sqrt(real * real + imag * imag);
    }
    return spectrum;
}

// Post-processing implementations
class AudioPostProcessor {
    static applyStochastic(buffer, params) {
        const { distribution, mean = 0, variance = 1 } = params;
        const result = createTestBuffer(buffer.sampleRate, buffer.duration, buffer.numberOfChannels);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const input = buffer.getChannelData(channel);
            const output = result.getChannelData(channel);

            for (let i = 0; i < input.length; i++) {
                // Box-Muller transform for Gaussian noise
                const u1 = Math.random();
                const u2 = Math.random();
                const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                output[i] = input[i] + noise * Math.sqrt(variance) + mean;
            }
        }

        return result;
    }

    static applySieveTheory(buffer, params) {
        const { intervals } = params;
        const result = createTestBuffer(buffer.sampleRate, buffer.duration, buffer.numberOfChannels);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const input = buffer.getChannelData(channel);
            const output = result.getChannelData(channel);

            for (let i = 0; i < input.length; i++) {
                output[i] = intervals.some(interval => i % interval === 0) ? input[i] : 0;
            }
        }

        return result;
    }

    static applyCellularAutomata(buffer, params) {
        const { rule } = params;
        const result = createTestBuffer(buffer.sampleRate, buffer.duration, buffer.numberOfChannels);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const input = buffer.getChannelData(channel);
            const output = result.getChannelData(channel);
            const state = new Uint8Array(input.length);

            // Initialize state from input
            for (let i = 0; i < input.length; i++) {
                state[i] = input[i] > 0 ? 1 : 0;
            }

            // Apply cellular automata rule
            for (let i = 1; i < input.length - 1; i++) {
                const pattern = (state[i-1] << 2) | (state[i] << 1) | state[i+1];
                state[i] = (rule >> pattern) & 1;
                output[i] = state[i] * 2 - 1; // Convert to [-1, 1] range
            }
        }

        return result;
    }
}

async function runTests() {
    const results = [];
    console.log('\nRunning Post-Processing Tests...\n');

    // Test 1: Stochastic Processing
    try {
        const sampleRate = 44100;
        const duration = 1.0;
        const frequency = 440;

        const buffer = createTestBuffer(sampleRate, duration, 1);
        const sineWave = generateSineWave(frequency, sampleRate, duration);
        buffer.getChannelData(0).set(sineWave);

        const perf = measurePerformance(() => {
            const processed = AudioPostProcessor.applyStochastic(buffer, {
                distribution: 'gaussian',
                mean: 0,
                variance: 0.1
            });

            // Verify basic properties
            assert(processed.sampleRate === sampleRate, 'Sample rate mismatch');
            assert(processed.duration === duration, 'Duration mismatch');

            // Verify signal characteristics
            const processedData = processed.getChannelData(0);
            const originalRMS = calculateRMS(sineWave);
            const processedRMS = calculateRMS(processedData);

            // RMS should be different but within reasonable bounds
            assert(Math.abs(processedRMS - originalRMS) < 0.5, 'RMS deviation too large');
        });

        results.push(logTestResult('Stochastic Processing', true));
        console.log(`  Performance: ${perf.duration.toFixed(2)}ms`);
    } catch (error) {
        results.push(logTestResult('Stochastic Processing', false, error));
    }

    // Test 2: Sieve Theory Processing
    try {
        const buffer = createTestBuffer(44100, 1.0, 1);
        buffer.getChannelData(0).set(generateSineWave(440, 44100, 1.0));

        const processed = AudioPostProcessor.applySieveTheory(buffer, {
            intervals: [2, 3, 5]
        });

        // Verify selective passing of samples
        const data = processed.getChannelData(0);
        let nonZeroCount = 0;
        for (let i = 0; i < 100; i++) {
            if (data[i] !== 0) nonZeroCount++;
        }

        // Should have fewer non-zero samples due to sieve
        assert(nonZeroCount < 100, 'Sieve not filtering samples');
        results.push(logTestResult('Sieve Theory Processing', true));
    } catch (error) {
        results.push(logTestResult('Sieve Theory Processing', false, error));
    }

    // Test 3: Cellular Automata Processing
    try {
        const buffer = createTestBuffer(44100, 1.0, 1);
        buffer.getChannelData(0).set(generateSineWave(440, 44100, 1.0));

        const processed = AudioPostProcessor.applyCellularAutomata(buffer, {
            rule: 110 // Rule 110 is universal
        });

        // Verify output characteristics
        const data = processed.getChannelData(0);
        let transitions = 0;
        for (let i = 1; i < 100; i++) {
            if (Math.sign(data[i]) !== Math.sign(data[i-1])) {
                transitions++;
            }
        }

        // Should have some sign transitions due to CA evolution
        assert(transitions > 0, 'No pattern evolution detected');
        results.push(logTestResult('Cellular Automata Processing', true));
    } catch (error) {
        results.push(logTestResult('Cellular Automata Processing', false, error));
    }

    // Test 4: Multiple Transformations
    try {
        const buffer = createTestBuffer(44100, 1.0, 1);
        buffer.getChannelData(0).set(generateSineWave(440, 44100, 1.0));

        let processed = buffer;
        processed = AudioPostProcessor.applyStochastic(processed, {
            distribution: 'gaussian',
            variance: 0.1
        });
        processed = AudioPostProcessor.applySieveTheory(processed, {
            intervals: [2, 3]
        });
        processed = AudioPostProcessor.applyCellularAutomata(processed, {
            rule: 110
        });

        // Verify the combined effect
        const spectrum = calculateSpectrum(processed.getChannelData(0), 44100);
        assert(spectrum.length > 0, 'Spectrum calculation failed');

        results.push(logTestResult('Multiple Transformations', true));
    } catch (error) {
        results.push(logTestResult('Multiple Transformations', false, error));
    }

    // Save test results
    const filename = saveTestResults('post-processing', results);
    console.log(`\nResults saved to ${filename}`);

    // Return overall success/failure
    return !results.some(r => !r.passed);
}

// Run tests
if (require.main === module) {
    runTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = {
    AudioPostProcessor,
    runTests,
    calculateRMS,
    calculateSpectrum
};
