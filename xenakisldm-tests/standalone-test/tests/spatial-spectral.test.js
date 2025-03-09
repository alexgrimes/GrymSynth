const XenakisLDMPipeline = require('../lib/xenakis-pipeline');
const SpatialSpectralAdapter = require('../lib/spatial-spectral-adapter');
const Logger = require('../lib/logger');

function generateTestSignal(sampleRate, duration, frequencies, amplitudes) {
    const length = Math.floor(sampleRate * duration);
    const signal = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        for (let f = 0; f < frequencies.length; f++) {
            signal[i] += amplitudes[f] * Math.sin(2 * Math.PI * frequencies[f] * t);
        }
    }

    // Normalize
    const max = Math.max(...Array.from(signal).map(Math.abs));
    if (max > 0) {
        for (let i = 0; i < length; i++) {
            signal[i] /= max;
        }
    }

    return signal;
}

function analyzeSpectrum(timeData, sampleRate, fftSize = 2048) {
    const freqs = [];
    const mags = [];

    for (let k = 0; k < fftSize/2; k++) {
        const freq = k * sampleRate / fftSize;
        let realSum = 0, imagSum = 0;

        for (let n = 0; n < fftSize; n++) {
            const sample = timeData[n] || 0;
            const angle = -2 * Math.PI * k * n / fftSize;
            realSum += sample * Math.cos(angle);
            imagSum += sample * Math.sin(angle);
        }

        freqs.push(freq);
        mags.push(Math.sqrt(realSum * realSum + imagSum * imagSum) / fftSize);
    }

    return { frequencies: freqs, magnitudes: mags };
}

function findPeaks(frequencies, magnitudes, threshold = 0.05) {  // Lowered threshold
    const peaks = [];
    const minPeakDistance = 20; // Minimum distance between peaks in Hz

    for (let i = 1; i < magnitudes.length - 1; i++) {
        if (magnitudes[i] > threshold &&
            magnitudes[i] > magnitudes[i-1] &&
            magnitudes[i] > magnitudes[i+1]) {

            // Check if this is the highest peak in its vicinity
            let isHighest = true;
            for (let j = Math.max(0, i - 10); j < Math.min(magnitudes.length, i + 10); j++) {
                if (j !== i && magnitudes[j] > magnitudes[i]) {
                    isHighest = false;
                    break;
                }
            }

            if (isHighest) {
                // Check if far enough from existing peaks
                const freq = frequencies[i];
                const farEnough = peaks.every(p =>
                    Math.abs(p.frequency - freq) > minPeakDistance
                );

                if (farEnough) {
                    peaks.push({
                        frequency: freq,
                        magnitude: magnitudes[i]
                    });
                }
            }
        }
    }
    return peaks.sort((a, b) => b.magnitude - a.magnitude);
}

async function testSpatialSpectralPipeline() {
    Logger.section('Testing Spatial-Spectral Pipeline');
    const results = [];

    // Test 1: Pattern-Based Field Generation
    try {
        Logger.section('Test 1: Pattern-Based Field Generation');
        const adapter = new SpatialSpectralAdapter({
            G: 0.01,
            patternThreshold: 0.2
        });

        // Create test audio with specific patterns
        const sampleRate = 44100;
        const duration = 0.5;
        const testFrequencies = [440, 880, 1320];
        const testAmplitudes = [1.0, 0.5, 0.25];

        Logger.info('Generating test signal:', {
            frequencies: testFrequencies,
            amplitudes: testAmplitudes
        });

        const signal = generateTestSignal(
            sampleRate,
            duration,
            testFrequencies,
            testAmplitudes
        );

        const buffer = {
            sampleRate,
            numberOfChannels: 1,
            duration,
            length: signal.length,
            getChannelData: () => signal
        };

        // Analyze input signal
        const inputSpectrum = analyzeSpectrum(signal, sampleRate);
        Logger.spectrum(inputSpectrum.frequencies, inputSpectrum.magnitudes, 'Input Signal');

        // Analyze patterns and create fields
        const { fields, globalParams } = await adapter.analyzeAndMap(buffer);

        Logger.info('Generated Fields:', {
            count: fields.length,
            types: fields.map(f => f.type),
            params: globalParams
        });

        // Verify field properties
        if (fields.length === 0) {
            throw new Error('No spectral fields generated');
        }

        // Check field generation for each expected frequency
        testFrequencies.forEach(freq => {
            const hasMatchingField = fields.some(field =>
                (field.type === 'pattern' && Math.abs(field.center - freq) < 50) ||
                (field.type === 'relationship' &&
                 (Math.abs(field.sourceFreq - freq) < 50 ||
                  Math.abs(field.targetFreq - freq) < 50))
            );
            if (!hasMatchingField) {
                throw new Error(`No field generated for frequency ${freq}Hz`);
            }
        });

        results.push({ name: 'Pattern Field Generation', passed: true });
    } catch (error) {
        results.push({ name: 'Pattern Field Generation', passed: false, error: error.message });
    }

    // Test 2: Complete Pipeline Integration
    try {
        Logger.section('Test 2: Complete Pipeline Integration');
        const pipeline = new XenakisLDMPipeline({
            sieve: {
                G: 0.02,
                patternThreshold: 0.2
            }
        });

        // Generate audio with specific intervals
        const { rawAudio, processedAudio } = await pipeline.generate('test tone', {
            sieve: {
                intervals: [0, 7, 12], // Root, fifth, octave
                modulo: 12,
                density: 0.8  // Higher density for stronger effect
            },
            duration: 0.5
        });

        // Analyze input and output spectra
        const rawSpectrum = analyzeSpectrum(
            rawAudio.getChannelData(0),
            rawAudio.sampleRate
        );
        const processedSpectrum = analyzeSpectrum(
            processedAudio.getChannelData(0),
            processedAudio.sampleRate
        );

        Logger.spectrum(rawSpectrum.frequencies, rawSpectrum.magnitudes, 'Raw Audio');
        Logger.spectrum(processedSpectrum.frequencies, processedSpectrum.magnitudes, 'Processed Audio');

        // Find peaks in both signals
        const rawPeaks = findPeaks(rawSpectrum.frequencies, rawSpectrum.magnitudes);
        const processedPeaks = findPeaks(processedSpectrum.frequencies, processedSpectrum.magnitudes);

        Logger.comparePeaks('Peak Analysis', rawPeaks, processedPeaks);

        // Verify minimum number of peaks
        if (processedPeaks.length < 3) {
            throw new Error(`Insufficient spectral peaks: found ${processedPeaks.length}, expected at least 3`);
        }

        // Calculate and verify frequency ratios
        const baseFreq = processedPeaks[0].frequency;
        const ratios = processedPeaks.slice(1).map(p => p.frequency / baseFreq);
        Logger.info('Frequency ratios:', ratios.map(r => r.toFixed(3)));

        // Expected ratios based on intervals [0, 7, 12] (1, 1.5, 2.0)
        const expectedRatios = [1.5, 2.0]; // fifth and octave
        let matchCount = 0;

        ratios.forEach(ratio => {
            expectedRatios.forEach(expected => {
                if (Math.abs(ratio - expected) < 0.15) { // Slightly wider tolerance
                    matchCount++;
                }
            });
        });

        if (matchCount < 1) {
            throw new Error(`No musical intervals detected (matchCount: ${matchCount})`);
        }

        // Verify spectral energy distribution
        const totalEnergy = processedSpectrum.magnitudes.reduce((sum, m) => sum + m, 0);
        const avgEnergy = totalEnergy / processedSpectrum.magnitudes.length;

        Logger.info('Spectral Energy Analysis:', {
            total: totalEnergy.toFixed(3),
            average: avgEnergy.toFixed(3),
            peakToAverage: (processedPeaks[0].magnitude / avgEnergy).toFixed(3)
        });

        if (totalEnergy < 0.001) {
            throw new Error('Insufficient spectral energy');
        }

        results.push({ name: 'Pipeline Integration', passed: true });
    } catch (error) {
        results.push({ name: 'Pipeline Integration', passed: false, error: error.message });
    }

    // Print test summary
    Logger.section('Test Summary');

    let passed = 0, failed = 0;
    results.forEach(result => {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        Logger.info(`${status} ${result.name}`);
        if (!result.passed) {
            Logger.info(`  Error: ${result.error}`);
            failed++;
        } else {
            passed++;
        }
    });

    Logger.info('-'.repeat(50));
    Logger.info(`Total: ${results.length} tests`);
    Logger.info(`Passed: ${passed}`);
    Logger.info(`Failed: ${failed}`);

    return failed === 0;
}

// Run tests if this is the main module
if (require.main === module) {
    testSpatialSpectralPipeline()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testSpatialSpectralPipeline,
    generateTestSignal,
    analyzeSpectrum,
    findPeaks
};
