const SpectralSieve = require('../lib/spectral-sieve');
const SpatialSpectralAdapter = require('../lib/spatial-spectral-adapter');
const SpectralVisualizer = require('../lib/spectral-visualizer');
const Logger = require('../lib/logger');

/**
 * Generate test signal with specific harmonic content
 */
function generateTestSignal(sampleRate, duration, fundamentalFreq = 440) {
    const length = Math.floor(sampleRate * duration);
    const signal = new Float32Array(length);

    // Generate harmonics with decreasing amplitude
    const harmonics = [1, 2, 3, 4, 5]; // Fundamental and overtones

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        for (const harmonic of harmonics) {
            const freq = fundamentalFreq * harmonic;
            const amplitude = 1 / harmonic; // Decreasing amplitude for higher harmonics
            signal[i] += amplitude * Math.sin(2 * Math.PI * freq * t);
        }
    }

    // Normalize
    const max = Math.max(...Array.from(signal).map(Math.abs));
    for (let i = 0; i < length; i++) {
        signal[i] /= max;
    }

    return signal;
}

async function runSpectralAnalysis() {
    Logger.section('Spectral Analysis Test');

    try {
        // Create test signal
        const sampleRate = 44100;
        const duration = 0.5;
        const signal = generateTestSignal(sampleRate, duration);

        const buffer = {
            sampleRate,
            numberOfChannels: 1,
            duration,
            length: signal.length,
            getChannelData: () => signal
        };

        // Create spectral sieve with visualization
        const sieve = new SpectralSieve({
            visualization: true,
            resolution: 4096,
            windowSize: 2048,
            overlapFactor: 4
        });

        // Test different interval configurations
        const testCases = [
            {
                name: "Simple Harmonic Series",
                params: {
                    intervals: [0, 12, 19], // Root, octave, compound
                    modulo: 12,
                    density: 1.0
                }
            },
            {
                name: "Musical Fifth and Third",
                params: {
                    intervals: [0, 4, 7], // Root, major third, fifth
                    modulo: 12,
                    density: 0.8
                }
            },
            {
                name: "Wide Intervals",
                params: {
                    intervals: [0, 24, 36], // Multiple octaves
                    modulo: 12,
                    density: 0.6
                }
            }
        ];

        for (const test of testCases) {
            Logger.section(`Test Case: ${test.name}`);
            Logger.info('Parameters:', test.params);

            // Process audio
            const result = await sieve.transform(buffer, test.params);

            // Analyze output
            const inputSignal = buffer.getChannelData(0);
            const outputSignal = result.getChannelData(0);

            // Calculate signal statistics
            const inputRMS = Math.sqrt(
                inputSignal.reduce((sum, x) => sum + x * x, 0) / inputSignal.length
            );
            const outputRMS = Math.sqrt(
                outputSignal.reduce((sum, x) => sum + x * x, 0) / outputSignal.length
            );

            Logger.info('\nSignal Statistics:', {
                inputRMS: inputRMS.toFixed(3),
                outputRMS: outputRMS.toFixed(3),
                rmsRatio: (outputRMS / inputRMS).toFixed(3)
            });

            // Calculate zero-crossing rates
            const inputZC = countZeroCrossings(inputSignal) / inputSignal.length;
            const outputZC = countZeroCrossings(outputSignal) / outputSignal.length;

            Logger.info('Zero-Crossing Analysis:', {
                inputRate: inputZC.toFixed(3),
                outputRate: outputZC.toFixed(3),
                rateRatio: (outputZC / inputZC).toFixed(3)
            });

            // Verify the transformation had a significant effect
            if (Math.abs(outputZC / inputZC - 1.0) < 0.1) {
                console.warn('Warning: Small spectral modification detected');
            }
        }

        Logger.section('Analysis Complete');
        return true;
    } catch (error) {
        console.error('Analysis failed:', error);
        return false;
    }
}

/**
 * Count zero crossings in signal
 */
function countZeroCrossings(signal) {
    let count = 0;
    for (let i = 1; i < signal.length; i++) {
        if (signal[i] * signal[i-1] < 0) {
            count++;
        }
    }
    return count;
}

// Run analysis if this is the main module
if (require.main === module) {
    runSpectralAnalysis()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { runSpectralAnalysis, generateTestSignal };
