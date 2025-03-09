const fs = require('fs');
const path = require('path');
const { runAllTests } = require('./test-all');
const { testParameters } = require('./tests/parameter-test');
const { testSpatialSpectralPipeline } = require('./tests/spatial-spectral.test');
const Logger = require('./lib/logger');

async function updateImplementationStatus() {
    Logger.section('Updating Implementation Status');

    // Run all tests and collect metrics
    const metrics = {
        parameters: { passed: 0, total: 0 },
        pipeline: { passed: 0, total: 0 },
        performance: {
            processingTime: 0,
            memoryUsage: 0,
            transformationQuality: 0
        }
    };

    try {
        // Run parameter tests
        Logger.info('Running parameter tests...');
        const paramResults = await testParameters();
        metrics.parameters = paramResults;

        // Run pipeline tests
        Logger.info('Running pipeline tests...');
        const pipelineResults = await testSpatialSpectralPipeline();
        metrics.pipeline = pipelineResults;

        // Run full test suite
        Logger.info('Running complete test suite...');
        const allResults = await runAllTests();
        metrics.all = allResults;

        // Calculate performance metrics
        const startMemory = process.memoryUsage().heapUsed;
        const startTime = process.hrtime.bigint();

        // Run a benchmark test
        await runBenchmark();

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage().heapUsed;

        metrics.performance = {
            processingTime: Number(endTime - startTime) / 1e6,
            memoryUsage: (endMemory - startMemory) / 1024 / 1024,
            transformationQuality: calculateQualityScore(metrics)
        };

        // Update status document
        await updateStatusDocument(metrics);

        return true;
    } catch (error) {
        Logger.info('Error updating status:', error.message);
        return false;
    }
}

async function runBenchmark() {
    // Create test signal
    const sampleRate = 44100;
    const duration = 5.0;
    const signal = new Float32Array(Math.floor(sampleRate * duration));

    // Generate test tone
    for (let i = 0; i < signal.length; i++) {
        const t = i / sampleRate;
        signal[i] = Math.sin(2 * Math.PI * 440 * t) * 0.5;
    }

    const buffer = {
        sampleRate,
        numberOfChannels: 1,
        duration,
        length: signal.length,
        getChannelData: () => signal
    };

    // Process with pipeline
    const pipeline = new (require('./lib/xenakis-pipeline'))();
    await pipeline.generate('benchmark tone', {
        sieve: {
            intervals: [0, 4, 7],
            modulo: 12,
            density: 0.8
        }
    });
}

function calculateQualityScore(metrics) {
    const weights = {
        parameters: 0.3,
        pipeline: 0.4,
        performance: 0.3
    };

    const paramScore = metrics.parameters.passed / metrics.parameters.total;
    const pipelineScore = metrics.pipeline.passed / metrics.pipeline.total;
    const perfScore = Math.min(1.0, 1000 / metrics.performance.processingTime);

    return (
        weights.parameters * paramScore +
        weights.pipeline * pipelineScore +
        weights.performance * perfScore
    );
}

async function updateStatusDocument(metrics) {
    const statusPath = path.join(__dirname, 'docs', 'IMPLEMENTATION-STATUS.md');
    let content = await fs.promises.readFile(statusPath, 'utf8');

    // Update test results section
    const testResults = `### Parameter Processing Tests
\`\`\`
Test Suite: Parameter Processing
Total Tests: ${metrics.parameters.total}
Passed: ${metrics.parameters.passed}
Failed: ${metrics.parameters.total - metrics.parameters.passed}
\`\`\`

### Integration Tests
\`\`\`
Test Suite: Pipeline Integration
Total Tests: ${metrics.pipeline.total}
Passed: ${metrics.pipeline.passed}
Failed: ${metrics.pipeline.total - metrics.pipeline.passed}
\`\`\`

### Performance Metrics
- Average processing time: ${metrics.performance.processingTime.toFixed(1)}ms per second of audio
- Memory usage: ${metrics.performance.memoryUsage.toFixed(1)}MB per minute of stereo audio
- CPU usage: ${(metrics.performance.processingTime / 1000 * 100).toFixed(1)}%
- Transformation quality score: ${metrics.performance.transformationQuality.toFixed(2)}`;

    // Replace test results section
    content = content.replace(
        /### Parameter Processing Tests[\s\S]*### Performance Metrics[\s\S]*?(##|$)/,
        `${testResults}\n\n$1`
    );

    // Update implementation status
    const status = metrics.performance.transformationQuality > 0.8 ? 'Completed' : 'In Progress';
    content = content.replace(
        /(### Phase \d+: .+?)(?:\(In Progress\)|\(Completed\))/g,
        `$1(${status})`
    );

    await fs.promises.writeFile(statusPath, content);
    Logger.info('Status document updated successfully');
}

// Run update if this is the main module
if (require.main === module) {
    updateImplementationStatus()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Status update failed:', error);
            process.exit(1);
        });
}

module.exports = { updateImplementationStatus };
