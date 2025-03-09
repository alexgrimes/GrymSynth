const { generateSineWave } = require('./sine-wave-debug');
const AudioLDMMock = require('../mocks/audioldm-service');

/**
 * Test utilities
 */
function analyzeAudio(buffer) {
    const channel0 = buffer.getChannelData(0);

    // Calculate basic statistics
    let min = Infinity, max = -Infinity, sum = 0;
    let zeroCrossings = 0;

    for (let i = 0; i < channel0.length; i++) {
        min = Math.min(min, channel0[i]);
        max = Math.max(max, channel0[i]);
        sum += channel0[i];
        if (i > 0 && Math.sign(channel0[i]) !== Math.sign(channel0[i-1])) {
            zeroCrossings++;
        }
    }

    return {
        min,
        max,
        average: sum / channel0.length,
        zeroCrossings,
        length: channel0.length
    };
}

async function runTests() {
    console.log('Running AudioLDM Mock Tests\n');
    const results = [];

    // Test 1: Basic Audio Generation
    try {
        console.log('Test 1: Basic Audio Generation');
        const audioldm = new AudioLDMMock();
        const prompt = 'test sine wave';

        const buffer = await audioldm.generateAudio(prompt);

        // Verify buffer properties
        console.log('Verifying buffer properties...');
        if (buffer.sampleRate !== 44100) throw new Error('Invalid sample rate');
        if (buffer.numberOfChannels !== 2) throw new Error('Invalid channel count');
        if (buffer.duration !== 5.0) throw new Error('Invalid duration');

        // Analyze audio content
        const analysis = analyzeAudio(buffer);
        console.log('Audio analysis:', {
            min: analysis.min.toFixed(3),
            max: analysis.max.toFixed(3),
            zeroCrossings: analysis.zeroCrossings
        });

        // Verify bounds
        if (analysis.min < -1 || analysis.max > 1) {
            throw new Error('Audio exceeds amplitude bounds');
        }

        // Verify there is actual content
        if (analysis.zeroCrossings < 100) {
            throw new Error('Too few zero crossings - audio may be empty');
        }

        results.push({ name: 'Basic Audio Generation', passed: true });
        console.log('✓ Basic audio generation test passed\n');
    } catch (error) {
        results.push({ name: 'Basic Audio Generation', passed: false, error: error.message });
        console.error('✗ Basic audio generation test failed:', error.message, '\n');
    }

    // Test 2: Prompt Influence
    try {
        console.log('Test 2: Prompt Influence');
        const audioldm = new AudioLDMMock();
        const prompt1 = 'low frequency drone';
        const prompt2 = 'high frequency tone';

        const buffer1 = await audioldm.generateAudio(prompt1);
        const buffer2 = await audioldm.generateAudio(prompt2);

        const analysis1 = analyzeAudio(buffer1);
        const analysis2 = analyzeAudio(buffer2);

        console.log('Comparing audio characteristics:');
        console.log('First prompt zero crossings:', analysis1.zeroCrossings);
        console.log('Second prompt zero crossings:', analysis2.zeroCrossings);

        if (Math.abs(analysis1.zeroCrossings - analysis2.zeroCrossings) < 100) {
            throw new Error('Different prompts produced too similar output');
        }

        results.push({ name: 'Prompt Influence', passed: true });
        console.log('✓ Prompt influence test passed\n');
    } catch (error) {
        results.push({ name: 'Prompt Influence', passed: false, error: error.message });
        console.error('✗ Prompt influence test failed:', error.message, '\n');
    }

    // Test 3: Error Handling
    try {
        console.log('Test 3: Error Handling');
        const audioldm = new AudioLDMMock({ errorRate: 1.0 }); // Force errors

        try {
            await audioldm.generateAudio('test');
            throw new Error('Should have thrown an error');
        } catch (error) {
            if (!error.message.includes('failed')) {
                throw new Error('Unexpected error message');
            }
        }

        const logs = audioldm.getLogs({ type: 'error' });
        if (logs.length !== 1) throw new Error('Error not logged properly');

        results.push({ name: 'Error Handling', passed: true });
        console.log('✓ Error handling test passed\n');
    } catch (error) {
        results.push({ name: 'Error Handling', passed: false, error: error.message });
        console.error('✗ Error handling test failed:', error.message, '\n');
    }

    // Test 4: Performance Metrics
    try {
        console.log('Test 4: Performance Metrics');
        const audioldm = new AudioLDMMock({ baseLatency: 50 });

        // Generate multiple samples
        const prompts = ['test1', 'test2', 'test3'];
        for (const prompt of prompts) {
            await audioldm.generateAudio(prompt);
        }

        const metrics = audioldm.getMetrics();
        console.log('Performance metrics:', metrics);

        if (metrics.totalRequests !== prompts.length) {
            throw new Error('Incorrect request count');
        }

        if (metrics.successRate !== 1.0) {
            throw new Error('Unexpected failures');
        }

        if (metrics.averageLatency < 40 || metrics.averageLatency > 100) {
            throw new Error('Latency outside expected range');
        }

        results.push({ name: 'Performance Metrics', passed: true });
        console.log('✓ Performance metrics test passed\n');
    } catch (error) {
        results.push({ name: 'Performance Metrics', passed: false, error: error.message });
        console.error('✗ Performance metrics test failed:', error.message, '\n');
    }

    // Print summary
    console.log('\nTest Summary:');
    console.log('-'.repeat(50));
    results.forEach(result => {
        const status = result.passed ? '✓' : '✗';
        console.log(`${status} ${result.name}`);
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
    runTests,
    analyzeAudio
};
