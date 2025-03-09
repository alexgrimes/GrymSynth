const XenakisLDMPipeline = require('../lib/xenakis-pipeline');

// Analysis utilities
function analyzeAudio(buffer) {
    const result = {
        channels: []
    };

    for (let c = 0; c < buffer.numberOfChannels; c++) {
        const data = buffer.getChannelData(c);
        let min = Infinity, max = -Infinity;
        let sum = 0, sumSquares = 0;
        let zeroCrossings = 0;
        let prevSample = data[0];
        let nonZeroCount = 0;

        for (let i = 0; i < data.length; i++) {
            const sample = data[i];
            min = Math.min(min, sample);
            max = Math.max(max, sample);
            sum += sample;
            sumSquares += sample * sample;

            if (i > 0 && Math.sign(sample) !== Math.sign(prevSample)) {
                zeroCrossings++;
            }
            if (Math.abs(sample) > 0.0001) {
                nonZeroCount++;
            }
            prevSample = sample;
        }

        result.channels.push({
            min,
            max,
            mean: sum / data.length,
            rms: Math.sqrt(sumSquares / data.length),
            zeroCrossings,
            nonZeroRatio: nonZeroCount / data.length
        });
    }

    return result;
}

async function runTests() {
    console.log('Running XenakisLDM Integration Tests\n');
    const results = [];

    // Test 1: Basic Pipeline Flow
    try {
        console.log('Test 1: Basic Pipeline Flow');
        const pipeline = new XenakisLDMPipeline();
        const basePrompt = 'generate atmospheric texture';
        const parameters = {
            stochastic: {
                distribution: 'gaussian',
                variance: 0.1
            },
            duration: 1.0
        };

        const { prompt, rawAudio, processedAudio } = await pipeline.generate(
            basePrompt,
            parameters
        );

        // Verify prompt enhancement
        console.log('Enhanced prompt:', prompt);
        if (!prompt.includes('gaussian distribution')) {
            throw new Error('Prompt enhancement failed');
        }

        // Verify audio generation and processing
        const rawAnalysis = analyzeAudio(rawAudio);
        const processedAnalysis = analyzeAudio(processedAudio);

        console.log('\nRaw audio analysis:', JSON.stringify(rawAnalysis, null, 2));
        console.log('Processed audio analysis:', JSON.stringify(processedAnalysis, null, 2));

        // Verify stochastic processing effect
        for (let c = 0; c < rawAudio.numberOfChannels; c++) {
            const rmsChange = Math.abs(
                processedAnalysis.channels[c].rms - rawAnalysis.channels[c].rms
            );
            if (rmsChange < 0.001) {
                throw new Error(`Channel ${c}: Insufficient stochastic effect (RMS change: ${rmsChange})`);
            }
        }

        results.push({ name: 'Basic Pipeline', passed: true });
    } catch (error) {
        results.push({ name: 'Basic Pipeline', passed: false, error: error.message });
    }

    // Test 2: Complex Parameter Combination
    try {
        console.log('\nTest 2: Complex Parameter Combination');
        const pipeline = new XenakisLDMPipeline();
        const parameters = {
            stochastic: {
                distribution: 'gaussian',
                variance: 0.2
            },
            sieve: {
                intervals: [2, 3, 5]
            },
            cellular: {
                rule: 110
            },
            duration: 0.5
        };

        const { prompt, rawAudio, processedAudio } = await pipeline.generate(
            'create complex texture',
            parameters
        );

        // Verify prompt enhancement
        const requiredTerms = ['gaussian', 'sieve', 'CA rule'];
        for (const term of requiredTerms) {
            if (!prompt.includes(term)) {
                throw new Error(`Missing ${term} in enhanced prompt`);
            }
        }

        // Analyze audio transformations
        const rawAnalysis = analyzeAudio(rawAudio);
        const processedAnalysis = analyzeAudio(processedAudio);

        console.log('\nRaw Audio Analysis:', JSON.stringify(rawAnalysis, null, 2));
        console.log('Processed Audio Analysis:', JSON.stringify(processedAnalysis, null, 2));

        // Verify sieve effect
        for (let c = 0; c < processedAudio.numberOfChannels; c++) {
            const nonZeroRatio = processedAnalysis.channels[c].nonZeroRatio;
            console.log(`Channel ${c} non-zero ratio: ${nonZeroRatio.toFixed(3)}`);

            // Expect significant reduction in non-zero samples due to sieve
            if (nonZeroRatio > 0.8) {
                throw new Error(`Channel ${c}: Sieve effect not detected (non-zero ratio: ${nonZeroRatio})`);
            }
        }

        // Verify cellular automata effect through pattern changes
        const patternChanges = countPatternTransitions(processedAudio.getChannelData(0));
        console.log('Pattern transitions:', patternChanges);

        if (patternChanges < 10) {
            throw new Error(`Insufficient pattern variation (changes: ${patternChanges})`);
        }

        results.push({ name: 'Complex Parameters', passed: true });
    } catch (error) {
        results.push({ name: 'Complex Parameters', passed: false, error: error.message });
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

// Helper function to count pattern transitions
function countPatternTransitions(samples, windowSize = 10) {
    let transitions = 0;
    let prevSum = 0;

    for (let i = 0; i < samples.length - windowSize; i++) {
        const sum = samples.slice(i, i + windowSize).reduce((a, b) => a + Math.abs(b), 0);
        if (Math.abs(sum - prevSum) > 0.1) {
            transitions++;
        }
        prevSum = sum;
    }

    return transitions;
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
    analyzeAudio,
    countPatternTransitions,
    runTests
};
