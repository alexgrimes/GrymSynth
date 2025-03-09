/**
 * Integrated Mathematical Framework Test for XenakisLDM
 *
 * This test demonstrates the integration of multiple mathematical frameworks:
 * - Spatial-spectral sieve
 * - Stochastic processes
 * - Cellular automata
 * - Game theory
 */

const IntegratedPipeline = require('../lib/integrated-pipeline');
const UnifiedParameterSpace = require('../lib/unified-parameter-space');
const Logger = require('../lib/logger');

// Mock audio buffer for testing
function createMockAudioBuffer(duration = 1, sampleRate = 44100, channels = 1) {
    const length = Math.floor(duration * sampleRate);
    const buffer = {
        sampleRate,
        numberOfChannels: channels,
        duration,
        length,
        _channels: []
    };

    for (let i = 0; i < channels; i++) {
        const channelData = new Float32Array(length);
        // Generate a simple sine wave
        for (let j = 0; j < length; j++) {
            channelData[j] = Math.sin(2 * Math.PI * 440 * j / sampleRate);
        }
        buffer._channels[i] = channelData;
    }

    buffer.getChannelData = function(channel) {
        if (channel >= this.numberOfChannels) {
            throw new Error('Invalid channel index');
        }
        return this._channels[channel];
    };

    return buffer;
}

// Test the integrated pipeline
async function testIntegratedPipeline() {
    Logger.section('INTEGRATED MATHEMATICAL FRAMEWORK TEST');

    try {
        // Create pipeline
        const pipeline = new IntegratedPipeline({
            enableVisualization: true
        });

        // Create test parameters with all frameworks
        const testParams = {
            duration: 2.0,

            // Spatial-spectral parameters
            spatial: {
                G: 0.01,
                undulationRate: 0.4,
                spatialHallucination: 0.6,
                intervals: [0, 3, 7], // Minor triad
                modulo: 12,
                density: 0.8
            },

            // Stochastic parameters
            stochastic: {
                variance: 0.15,
                distribution: {
                    type: 'gaussian',
                    mean: 0,
                    spread: 1
                },
                frequencyDependence: 0.4
            },

            // Cellular automata parameters
            cellular: {
                rule: 110,
                dimensions: 1,
                iterations: 4,
                interaction: {
                    strength: 0.3,
                    radius: 1
                }
            },

            // Game theory parameters
            gameTheory: {
                agentCount: 4,
                strategySpace: 'discrete',
                learningRate: 0.1,
                competitionFactor: 0.6
            },

            // Integration parameters
            integration: {
                weights: {
                    spatialSpectral: 1.0,
                    stochastic: 0.7,
                    cellular: 0.5,
                    gameTheory: 0.3
                },
                blendMode: 'weighted'
            }
        };

        // Generate audio with the integrated pipeline
        Logger.info('Generating audio with integrated pipeline...');
        const result = await pipeline.generate(
            'Ambient texture with evolving harmonics and subtle noise',
            testParams
        );

        Logger.info('Generation complete!');
        Logger.info('Enhanced prompt:', result.prompt);

        // Analyze the result
        analyzeResult(result);

        // Test with different presets
        await testPresets();

        return true;
    } catch (error) {
        Logger.error('Test failed:', error);
        return false;
    }
}

// Analyze the generation result
function analyzeResult(result) {
    Logger.section('RESULT ANALYSIS');

    // Check if we have valid audio
    if (!result.processedAudio || !result.processedAudio.getChannelData) {
        Logger.error('Invalid processed audio');
        return;
    }

    // Basic audio analysis
    const channels = result.processedAudio.numberOfChannels;
    const duration = result.processedAudio.duration;
    const sampleRate = result.processedAudio.sampleRate;

    Logger.info('Processed Audio:');
    Logger.info(`- Channels: ${channels}`);
    Logger.info(`- Duration: ${duration.toFixed(2)}s`);
    Logger.info(`- Sample Rate: ${sampleRate}Hz`);

    // Analyze each channel
    for (let c = 0; c < channels; c++) {
        const data = result.processedAudio.getChannelData(c);

        // Calculate basic statistics
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        let sumSquared = 0;

        for (let i = 0; i < data.length; i++) {
            const sample = data[i];
            min = Math.min(min, sample);
            max = Math.max(max, sample);
            sum += sample;
            sumSquared += sample * sample;
        }

        const mean = sum / data.length;
        const rms = Math.sqrt(sumSquared / data.length);

        Logger.info(`\nChannel ${c} Statistics:`);
        Logger.info(`- Min: ${min.toFixed(4)}`);
        Logger.info(`- Max: ${max.toFixed(4)}`);
        Logger.info(`- Mean: ${mean.toFixed(4)}`);
        Logger.info(`- RMS: ${rms.toFixed(4)}`);
    }
}

// Test different presets
async function testPresets() {
    Logger.section('PRESET TESTS');

    const presets = ['harmonic', 'chaotic', 'evolving', 'minimal'];

    for (const preset of presets) {
        Logger.info(`\nTesting "${preset}" preset...`);

        // Create preset pipeline
        const pipeline = IntegratedPipeline.createPreset(preset, {
            enableVisualization: true
        });

        // Generate with preset parameters
        try {
            const result = await pipeline.generate(
                `${preset} texture with mathematical transformations`,
                pipeline.presetParams
            );

            Logger.info(`${preset} preset generation complete!`);
            Logger.info('Enhanced prompt:', result.prompt);

            // Basic analysis
            if (result.processedAudio) {
                Logger.info(`Duration: ${result.processedAudio.duration.toFixed(2)}s`);
                Logger.info(`Channels: ${result.processedAudio.numberOfChannels}`);
            }
        } catch (error) {
            Logger.error(`${preset} preset test failed:`, error);
        }
    }
}

// Test parameter space
function testParameterSpace() {
    Logger.section('PARAMETER SPACE TEST');

    // Test default parameters
    const defaultParams = UnifiedParameterSpace.createDefaultParameters();
    Logger.info('Default Parameters:', defaultParams);

    // Test parameter normalization
    const testParams = {
        spatial: {
            G: -1, // Invalid negative value
            intervals: 'invalid', // Invalid type
            density: 2.5 // Out of range
        },
        stochastic: {
            variance: 'high' // Invalid type
        }
    };

    const normalizedParams = UnifiedParameterSpace.validateAndNormalize(testParams);
    Logger.info('Normalized Parameters:', normalizedParams);

    // Verify normalization corrected the issues
    const issues = [];

    if (normalizedParams.spatial.G <= 0) {
        issues.push('Failed to normalize negative G value');
    }

    if (!Array.isArray(normalizedParams.spatial.intervals)) {
        issues.push('Failed to handle invalid intervals type');
    }

    if (normalizedParams.spatial.density > 1) {
        issues.push('Failed to clamp density to valid range');
    }

    if (typeof normalizedParams.stochastic?.variance !== 'number') {
        issues.push('Failed to handle invalid variance type');
    }

    if (issues.length > 0) {
        Logger.error('Parameter normalization issues:', issues);
        return false;
    }

    Logger.info('Parameter space test passed!');
    return true;
}

// Run all tests
async function runAllTests() {
    Logger.section('INTEGRATED FRAMEWORK TESTS');

    // Test parameter space
    const paramSpaceResult = testParameterSpace();
    Logger.info(`Parameter Space Test: ${paramSpaceResult ? 'PASSED' : 'FAILED'}`);

    // Test integrated pipeline
    const pipelineResult = await testIntegratedPipeline();
    Logger.info(`Integrated Pipeline Test: ${pipelineResult ? 'PASSED' : 'FAILED'}`);

    return paramSpaceResult && pipelineResult;
}

// Export test functions
module.exports = {
    testIntegratedPipeline,
    testParameterSpace,
    runAllTests,
    createMockAudioBuffer
};

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().then(success => {
        if (success) {
            console.log('All tests passed!');
            process.exit(0);
        } else {
            console.error('Some tests failed!');
            process.exit(1);
        }
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}
