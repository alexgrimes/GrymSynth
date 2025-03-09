const fs = require('fs');

// Utility function to save debug data
function saveDebugData(name, data) {
    const filename = `debug-${name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Debug data saved to ${filename}`);
    return filename;
}

// Sine wave generator with detailed validation
function generateSineWave(frequency, sampleRate, duration, debug = false) {
    // Input validation
    if (!Number.isFinite(frequency) || frequency <= 0) {
        throw new Error(`Invalid frequency: ${frequency}`);
    }
    if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
        throw new Error(`Invalid sample rate: ${sampleRate}`);
    }
    if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error(`Invalid duration: ${duration}`);
    }

    // Calculate parameters
    const length = Math.floor(sampleRate * duration);
    const samples = new Float32Array(length);
    const debug_info = debug ? {
        params: { frequency, sampleRate, duration, length },
        keyPoints: {},
        statistics: { min: Infinity, max: -Infinity, zeroCrossings: 0 }
    } : null;

    // Generate samples
    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const angle = 2 * Math.PI * frequency * t;
        samples[i] = Math.sin(angle);

        if (debug) {
            // Track statistics
            debug_info.statistics.min = Math.min(debug_info.statistics.min, samples[i]);
            debug_info.statistics.max = Math.max(debug_info.statistics.max, samples[i]);
            if (i > 0 && Math.sign(samples[i]) !== Math.sign(samples[i-1])) {
                debug_info.statistics.zeroCrossings++;
            }
        }
    }

    if (debug) {
        // Calculate key points
        const samplesPerCycle = sampleRate / frequency;
        debug_info.keyPoints = {
            quarterCycle: Math.floor(samplesPerCycle / 4),
            halfCycle: Math.floor(samplesPerCycle / 2),
            fullCycle: Math.floor(samplesPerCycle)
        };

        // Add sample values at key points
        debug_info.keyPoints.values = {
            start: samples[0],
            quarter: samples[debug_info.keyPoints.quarterCycle],
            half: samples[debug_info.keyPoints.halfCycle],
            full: samples[debug_info.keyPoints.fullCycle]
        };

        // Expected values
        debug_info.expected = {
            frequency,
            samplesPerCycle,
            expectedZeroCrossings: Math.floor(length / (samplesPerCycle / 2)),
            expectedQuarterCycleValue: 1.0,  // sin(π/2)
            expectedHalfCycleValue: 0.0      // sin(π)
        };
    }

    return { samples, debug_info };
}

// Test runner
async function runTests() {
    console.log('Running Sine Wave Generation Debug Tests\n');
    const results = [];

    // Test 1: Basic sine wave generation
    try {
        console.log('Test 1: Basic Sine Wave Generation');
        const { samples, debug_info } = generateSineWave(440, 44100, 1.0, true);

        // Save debug info
        const debugFile = saveDebugData('basic-sine', debug_info);

        // Validate basic properties
        if (samples.length !== 44100) {
            throw new Error(`Invalid sample count: ${samples.length}`);
        }

        // Check amplitude bounds
        const maxAmplitude = Math.max(...Array.from(samples).map(Math.abs));
        if (maxAmplitude > 1.0) {
            throw new Error(`Amplitude exceeds bounds: ${maxAmplitude}`);
        }

        // Verify key points
        const quarterCycleValue = Math.abs(debug_info.keyPoints.values.quarter);
        if (Math.abs(quarterCycleValue - 1.0) > 0.01) {
            throw new Error(`Quarter cycle value incorrect: ${quarterCycleValue}`);
        }

        // Verify zero crossings
        const zeroCrossingsError = Math.abs(
            debug_info.statistics.zeroCrossings - debug_info.expected.expectedZeroCrossings
        );
        if (zeroCrossingsError > 2) { // Allow small margin of error due to rounding
            throw new Error(`Incorrect zero crossing count: ${debug_info.statistics.zeroCrossings}`);
        }

        console.log('✓ Basic sine wave generation passed');
        console.log(`  Max amplitude: ${maxAmplitude.toFixed(6)}`);
        console.log(`  Zero crossings: ${debug_info.statistics.zeroCrossings}`);
        console.log(`  Debug data saved to: ${debugFile}`);
        results.push({ name: 'Basic Sine Wave', passed: true });
    } catch (error) {
        console.error('✗ Basic sine wave generation failed:', error.message);
        results.push({ name: 'Basic Sine Wave', passed: false, error: error.message });
    }

    // Test 2: Frequency accuracy
    try {
        console.log('\nTest 2: Frequency Accuracy');
        const frequency = 440;
        const sampleRate = 44100;
        const { samples, debug_info } = generateSineWave(frequency, sampleRate, 0.1, true);

        // Calculate actual frequency from zero crossings
        const duration = samples.length / sampleRate;
        const measuredFrequency = (debug_info.statistics.zeroCrossings / 2) / duration;
        const frequencyError = Math.abs(measuredFrequency - frequency);

        if (frequencyError > 1.0) { // Allow 1 Hz error margin
            throw new Error(
                `Frequency inaccurate. Expected: ${frequency}Hz, Measured: ${measuredFrequency.toFixed(2)}Hz`
            );
        }

        console.log('✓ Frequency accuracy test passed');
        console.log(`  Measured frequency: ${measuredFrequency.toFixed(2)}Hz`);
        results.push({ name: 'Frequency Accuracy', passed: true });
    } catch (error) {
        console.error('✗ Frequency accuracy test failed:', error.message);
        results.push({ name: 'Frequency Accuracy', passed: false, error: error.message });
    }

    // Print summary
    console.log('\nTest Summary:');
    console.log('-'.repeat(50));
    results.forEach(result => {
        console.log(`${result.passed ? '✓' : '✗'} ${result.name}`);
        if (!result.passed) {
            console.log(`  Error: ${result.error}`);
        }
    });

    return !results.some(r => !r.passed);
}

// Run tests if this is the main module
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
    generateSineWave,
    runTests
};
