const SpectralSieve = require('../lib/spectral-sieve');
const XenakisLDMPipeline = require('../lib/xenakis-pipeline');

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

function analyzeSpectrum(timeData, sampleRate) {
    const fftSize = 2048;
    const frequencies = [];
    const magnitudes = [];

    // Calculate spectrum using simple DFT
    for (let k = 0; k < fftSize/2; k++) {
        const freq = k * sampleRate / fftSize;
        let realSum = 0, imagSum = 0;

        for (let n = 0; n < fftSize; n++) {
            const sample = timeData[n] || 0;
            const angle = -2 * Math.PI * k * n / fftSize;
            realSum += sample * Math.cos(angle);
            imagSum += sample * Math.sin(angle);
        }

        frequencies.push(freq);
        magnitudes.push(Math.sqrt(realSum * realSum + imagSum * imagSum) / fftSize);
    }

    return { frequencies, magnitudes };
}

function findPeaks(magnitudes, threshold = 0.1) {
    const peaks = [];
    for (let i = 1; i < magnitudes.length - 1; i++) {
        if (magnitudes[i] > threshold &&
            magnitudes[i] > magnitudes[i-1] &&
            magnitudes[i] > magnitudes[i+1]) {
            peaks.push(i);
        }
    }
    return peaks;
}

async function testSpectralSieve() {
    console.log('Testing Spectral Sieve Implementation\n');
    const results = [];

    // Test 1: Basic Gravitational Field
    try {
        console.log('Test 1: Basic Gravitational Field');
        const sieve = new SpectralSieve({ G: 0.01 });

        const attractors = [
            { frequency: 440, strength: 1.0 },
            { frequency: 880, strength: 0.5 }
        ];

        const testFreqs = [220, 440, 660, 880, 1100];
        console.log('\nField strengths at test frequencies:');
        testFreqs.forEach(freq => {
            const field = sieve.calculateField(freq, attractors);
            console.log(`${freq}Hz: ${field.toFixed(6)}`);
        });

        // Verify field properties
        const field440 = sieve.calculateField(440, attractors);
        const field880 = sieve.calculateField(880, attractors);

        if (Math.abs(field440) < Math.abs(field880)) {
            throw new Error('Primary attractor should have stronger field');
        }

        results.push({ name: 'Gravitational Field', passed: true });
    } catch (error) {
        results.push({ name: 'Gravitational Field', passed: false, error: error.message });
    }

    // Test 2: Spectral Transformation
    try {
        console.log('\nTest 2: Spectral Transformation');
        const sampleRate = 44100;
        const duration = 0.1;

        // Create test signal with specific frequencies
        const inputFreqs = [440, 880, 1320];
        const inputAmps = [1.0, 0.5, 0.25];
        const signal = generateTestSignal(sampleRate, duration, inputFreqs, inputAmps);

        // Create test buffer
        const buffer = {
            sampleRate,
            numberOfChannels: 1,
            duration,
            length: signal.length,
            getChannelData: () => signal
        };

        // Apply spectral sieve
        const sieve = new SpectralSieve();
        const result = sieve.transform(buffer, {
            intervals: [0, 12, 19], // Root, octave, and compound interval
            strengths: [1.0, 0.5, 0.25]
        });

        // Analyze input and output spectra
        const inputSpectrum = analyzeSpectrum(signal, sampleRate);
        const outputSpectrum = analyzeSpectrum(result.getChannelData(0), sampleRate);

        console.log('\nSpectral Analysis:');
        console.log('Input peaks:', findPeaks(inputSpectrum.magnitudes)
            .map(i => `${inputSpectrum.frequencies[i].toFixed(1)}Hz`)
            .join(', '));
        console.log('Output peaks:', findPeaks(outputSpectrum.magnitudes)
            .map(i => `${outputSpectrum.frequencies[i].toFixed(1)}Hz`)
            .join(', '));

        // Verify spectral changes
        const energyChange = outputSpectrum.magnitudes.reduce((sum, m) => sum + m, 0) /
                           inputSpectrum.magnitudes.reduce((sum, m) => sum + m, 0);

        console.log('\nEnergy ratio:', energyChange.toFixed(3));

        if (Math.abs(energyChange - 1.0) < 0.001) {
            throw new Error('Spectral transformation had no effect');
        }

        results.push({ name: 'Spectral Transformation', passed: true });
    } catch (error) {
        results.push({ name: 'Spectral Transformation', passed: false, error: error.message });
    }

    // Test 3: Integration with Pipeline
    try {
        console.log('\nTest 3: Pipeline Integration');
        const pipeline = new XenakisLDMPipeline({
            sieve: { G: 0.02, hallucination: 0.1 }
        });

        const { processedAudio } = await pipeline.generate('test tone', {
            sieve: {
                intervals: [0, 7, 12], // Root, fifth, octave
                modulo: 12
            },
            duration: 0.1
        });

        // Analyze processed audio
        const spectrum = analyzeSpectrum(processedAudio.getChannelData(0), 44100);
        const peaks = findPeaks(spectrum.magnitudes);

        console.log('\nProcessed Audio Analysis:');
        console.log('Peak frequencies:',
            peaks.map(i => `${spectrum.frequencies[i].toFixed(1)}Hz`).join(', ')
        );

        if (peaks.length < 2) {
            throw new Error('Insufficient spectral complexity');
        }

        results.push({ name: 'Pipeline Integration', passed: true });
    } catch (error) {
        results.push({ name: 'Pipeline Integration', passed: false, error: error.message });
    }

    // Print test summary
    console.log('\nTest Summary:');
    console.log('-'.repeat(50));

    let passed = 0, failed = 0;
    results.forEach(result => {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`${status} ${result.name}`);
        if (!result.passed) {
            console.log(`  Error: ${result.error}`);
            failed++;
        } else {
            passed++;
        }
    });

    console.log('-'.repeat(50));
    console.log(`Total: ${results.length} tests`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    return failed === 0;
}

// Run tests if this is the main module
if (require.main === module) {
    testSpectralSieve()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testSpectralSieve,
    generateTestSignal,
    analyzeSpectrum,
    findPeaks
};
