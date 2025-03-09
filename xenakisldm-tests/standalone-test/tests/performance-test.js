/**
 * Performance Test for XenakisLDM
 *
 * This file demonstrates the performance optimizations in the XenakisLDM system,
 * including buffer pooling, parallel processing, and FFT optimization.
 */

const {
    PerformanceOptimizer,
    IntegratedPipeline,
    PresetLibrary
} = require('../lib');

// Create a mock audio buffer for testing
const createMockAudioBuffer = (length = 4096) => {
    const buffer = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        buffer[i] = Math.sin(2 * Math.PI * i / 32) +
                    Math.sin(2 * Math.PI * i / 64) * 0.5 +
                    Math.sin(2 * Math.PI * i / 128) * 0.25;
    }
    return buffer;
};

// Test different optimization configurations
const runPerformanceTests = async () => {
    console.log('=== XENAKISLDM PERFORMANCE TESTS ===\n');

    // Create test audio data
    console.log('Creating test audio data...');
    const audioBuffer = createMockAudioBuffer(8192);
    console.log(`Created ${audioBuffer.length} samples of test audio data\n`);

    // Test configurations
    const configurations = [
        {
            name: 'No Optimizations',
            config: {
                useBufferPool: false,
                useParallelProcessing: false,
                useWebAudio: false
            }
        },
        {
            name: 'Buffer Pool Only',
            config: {
                useBufferPool: true,
                useParallelProcessing: false,
                useWebAudio: false
            }
        },
        {
            name: 'Parallel Processing Only',
            config: {
                useBufferPool: false,
                useParallelProcessing: true,
                useWebAudio: false
            }
        },
        {
            name: 'Buffer Pool + Parallel Processing',
            config: {
                useBufferPool: true,
                useParallelProcessing: true,
                useWebAudio: false
            }
        },
        {
            name: 'All Optimizations',
            config: {
                useBufferPool: true,
                useParallelProcessing: true,
                useWebAudio: true
            }
        }
    ];

    // Run tests for each configuration
    for (const { name, config } of configurations) {
        console.log(`\nTesting configuration: ${name}`);
        console.log('Configuration:', JSON.stringify(config, null, 2));

        // Create performance optimizer
        const optimizer = new PerformanceOptimizer({
            ...config,
            debug: true
        });

        // Test FFT performance
        console.log('\nTesting FFT performance...');
        const fftIterations = 10;
        const fftStartTime = performance.now();

        for (let i = 0; i < fftIterations; i++) {
            const fftResult = await optimizer.performFFT(audioBuffer);
            console.log(`  Iteration ${i + 1}: Processed ${fftResult.magnitudes.length} frequency bins`);
        }

        const fftEndTime = performance.now();
        const fftTotalTime = fftEndTime - fftStartTime;
        const fftAverageTime = fftTotalTime / fftIterations;

        console.log(`FFT Performance: ${fftAverageTime.toFixed(2)}ms per iteration (${fftTotalTime.toFixed(2)}ms total)`);

        // Test buffer pool if enabled
        if (config.useBufferPool) {
            console.log('\nTesting buffer pool performance...');
            const bufferSizes = [1024, 2048, 4096, 8192];
            const bufferIterations = 100;

            const bufferStartTime = performance.now();
            const buffers = [];

            // Acquire buffers
            for (let i = 0; i < bufferIterations; i++) {
                const size = bufferSizes[i % bufferSizes.length];
                buffers.push(optimizer.acquireBuffer(size));
            }

            // Release buffers
            for (const buffer of buffers) {
                optimizer.releaseBuffer(buffer);
            }

            const bufferEndTime = performance.now();
            const bufferTotalTime = bufferEndTime - bufferStartTime;

            console.log(`Buffer Pool Performance: ${bufferTotalTime.toFixed(2)}ms for ${bufferIterations} buffer operations`);
            console.log('Buffer Pool Stats:', JSON.stringify(optimizer.getMetrics().bufferPoolStats, null, 2));
        }

        // Get overall performance metrics
        console.log('\nPerformance Metrics:');
        console.log(JSON.stringify(optimizer.getMetrics(), null, 2));
    }

    // Test pipeline performance with different presets
    console.log('\n=== PIPELINE PERFORMANCE TESTS ===\n');

    // Create preset library
    const presetLibrary = new PresetLibrary();
    const presets = [
        'crystalline',
        'textural-clouds',
        'spectral-flux',
        'rhythmic-chaos'
    ];

    // Create performance optimizer with all optimizations
    const optimizer = new PerformanceOptimizer({
        useBufferPool: true,
        useParallelProcessing: true,
        useWebAudio: true
    });

    // Test each preset
    for (const preset of presets) {
        console.log(`\nTesting pipeline with preset: ${preset}`);

        // Get preset parameters
        const params = presetLibrary.getPresetParameters(preset);

        // Create pipeline
        const pipeline = new IntegratedPipeline({
            params,
            performanceOptimizer: optimizer
        });

        // Test processing performance
        console.log('Processing test audio...');
        const startTime = performance.now();

        try {
            const outputBuffer = pipeline.process(audioBuffer);
            const endTime = performance.now();
            const processingTime = endTime - startTime;

            console.log(`Processed ${audioBuffer.length} samples in ${processingTime.toFixed(2)}ms`);
            console.log(`Processing rate: ${(audioBuffer.length / processingTime * 1000).toFixed(2)} samples per second`);
            console.log(`Output buffer length: ${outputBuffer.length} samples`);
        } catch (error) {
            console.log(`Error processing audio: ${error.message}`);
        }
    }

    console.log('\n=== PERFORMANCE TESTS COMPLETE ===');
};

// Run the performance tests
runPerformanceTests().catch(error => {
    console.error('Error running performance tests:', error);
});
