const {
    assert,
    assertCloseTo,
    assertArraysEqual,
    createTestBuffer,
    generateSineWave,
    logTestResult,
    saveTestResults,
    measurePerformance
} = require('../utils/test-utils');

const AudioLDMMock = require('../mocks/audioldm-mock');

async function runTests() {
    const results = [];
    console.log('\nRunning Audio Generation Tests...\n');

    // Test 1: Basic Sine Wave Generation
    try {
        const sampleRate = 44100;
        const frequency = 440; // A4 note
        const duration = 1.0;

        const perf = measurePerformance(() => {
            const samples = generateSineWave(frequency, sampleRate, duration);

            // Test wave properties
            assert(samples.length === sampleRate * duration, 'Incorrect sample count');
            assertCloseTo(samples[0], 0, 1e-6, 'First sample should be ~0');

            // Test quarter period (should be near maximum amplitude)
            const quarterPeriod = Math.floor(sampleRate / (frequency * 4));
            assertCloseTo(Math.abs(samples[quarterPeriod]), 1.0, 0.01);

            // Test zero crossings
            const halfPeriod = Math.floor(sampleRate / (frequency * 2));
            assertCloseTo(samples[halfPeriod], 0, 0.01);
        });

        results.push(logTestResult('Sine Wave Generation', true));
        console.log(`  Performance: ${perf.duration.toFixed(2)}ms`);
    } catch (error) {
        results.push(logTestResult('Sine Wave Generation', false, error));
    }

    // Test 2: AudioLDM Mock Basic Functionality
    try {
        const audioldm = new AudioLDMMock();
        const prompt = 'test sine wave';

        const perf = measurePerformance(async () => {
            const buffer = await audioldm.generateAudio(prompt);

            // Verify buffer properties
            assert(buffer.sampleRate === 44100, 'Incorrect sample rate');
            assert(buffer.numberOfChannels === 2, 'Incorrect channel count');
            assert(buffer.duration === 5.0, 'Incorrect duration');

            // Verify channel data
            const channel0 = buffer.getChannelData(0);
            const channel1 = buffer.getChannelData(1);

            assert(channel0 instanceof Float32Array, 'Invalid channel 0 data type');
            assert(channel1 instanceof Float32Array, 'Invalid channel 1 data type');

            // Verify signal bounds
            const checkBounds = (data) => {
                for (let i = 0; i < 100; i++) {
                    assert(Math.abs(data[i]) <= 1.0, 'Signal exceeds bounds');
                }
            };

            checkBounds(channel0);
            checkBounds(channel1);
        });

        results.push(logTestResult('AudioLDM Mock Generation', true));
        console.log(`  Performance: ${perf.duration.toFixed(2)}ms`);
    } catch (error) {
        results.push(logTestResult('AudioLDM Mock Generation', false, error));
    }

    // Test 3: AudioLDM Mock Error Handling
    try {
        const audioldm = new AudioLDMMock({ errorRate: 1.0 }); // Force errors
        const prompt = 'test error handling';

        let errorCaught = false;
        try {
            await audioldm.generateAudio(prompt);
        } catch (error) {
            errorCaught = true;
            assert(error.message === 'AudioLDM generation failed', 'Unexpected error message');
        }

        assert(errorCaught, 'Error was not thrown as expected');
        const logs = audioldm.getLogs({ type: 'error' });
        assert(logs.length === 1, 'Error was not logged');

        results.push(logTestResult('AudioLDM Error Handling', true));
    } catch (error) {
        results.push(logTestResult('AudioLDM Error Handling', false, error));
    }

    // Test 4: Prompt-Dependent Output
    try {
        const audioldm = new AudioLDMMock();
        const prompt1 = 'test prompt 1';
        const prompt2 = 'test prompt 2';

        const buffer1 = await audioldm.generateAudio(prompt1);
        const buffer2 = await audioldm.generateAudio(prompt2);

        const data1 = buffer1.getChannelData(0);
        const data2 = buffer2.getChannelData(0);

        let differences = 0;
        for (let i = 0; i < 1000; i++) {
            if (Math.abs(data1[i] - data2[i]) > 0.01) {
                differences++;
            }
        }

        assert(differences > 100, 'Different prompts should produce different outputs');
        results.push(logTestResult('Prompt-Dependent Output', true));
    } catch (error) {
        results.push(logTestResult('Prompt-Dependent Output', false, error));
    }

    // Save test results
    const filename = saveTestResults('audio-generation', results);
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

module.exports = { runTests };
