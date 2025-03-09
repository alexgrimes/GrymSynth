const { testSpatialSpectralPipeline } = require('./tests/spatial-spectral.test');
const { runSpectralAnalysis } = require('./tests/spectral-analysis');
const SpectralVisualizer = require('./lib/spectral-visualizer');
const Logger = require('./lib/logger');

async function runTestSuite() {
    Logger.section('XenakisLDM Spatial-Spectral Test Suite');

    const results = {
        spectralAnalysis: false,
        integrationTests: false,
        performanceMetrics: {
            processingTime: 0,
            memoryUsage: 0,
            transformationQuality: 0
        }
    };

    try {
        // Record initial memory usage
        const initialMemory = process.memoryUsage();
        const startTime = process.hrtime.bigint();

        // Run spectral analysis tests
        Logger.section('Running Spectral Analysis Tests');
        results.spectralAnalysis = await runSpectralAnalysis();

        // Run integration tests
        Logger.section('Running Integration Tests');
        results.integrationTests = await testSpatialSpectralPipeline();

        // Calculate performance metrics
        const endTime = process.hrtime.bigint();
        const finalMemory = process.memoryUsage();

        results.performanceMetrics = {
            processingTime: Number(endTime - startTime) / 1e6, // Convert to milliseconds
            memoryUsage: (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024, // MB
            transformationQuality: results.spectralAnalysis && results.integrationTests ? 1.0 : 0.0
        };

        // Print test summary
        Logger.section('Test Results Summary');
        console.log('Spectral Analysis:', results.spectralAnalysis ? '✓ PASS' : '✗ FAIL');
        console.log('Integration Tests:', results.integrationTests ? '✓ PASS' : '✗ FAIL');

        Logger.section('Performance Metrics');
        console.log('Processing Time:', results.performanceMetrics.processingTime.toFixed(2), 'ms');
        console.log('Memory Usage:', results.performanceMetrics.memoryUsage.toFixed(2), 'MB');
        console.log('Quality Score:', results.performanceMetrics.transformationQuality.toFixed(2));

        // Generate test report
        generateTestReport(results);

        return results.spectralAnalysis && results.integrationTests;
    } catch (error) {
        console.error('Test suite execution failed:', error);
        return false;
    }
}

function generateTestReport(results) {
    const report = [
        '# Spatial-Spectral Test Report',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## Test Results',
        `- Spectral Analysis: ${results.spectralAnalysis ? 'PASS' : 'FAIL'}`,
        `- Integration Tests: ${results.integrationTests ? 'PASS' : 'FAIL'}`,
        '',
        '## Performance Metrics',
        `- Processing Time: ${results.performanceMetrics.processingTime.toFixed(2)} ms`,
        `- Memory Usage: ${results.performanceMetrics.memoryUsage.toFixed(2)} MB`,
        `- Transformation Quality: ${results.performanceMetrics.transformationQuality.toFixed(2)}`,
        '',
        '## System Information',
        `- Node Version: ${process.version}`,
        `- Platform: ${process.platform}`,
        `- CPU Architecture: ${process.arch}`,
        '',
        '## Notes',
        '- Processing time includes all test executions',
        '- Memory usage shows heap allocation change',
        '- Quality score is based on test success rate',
        ''
    ].join('\n');

    // Save report
    const fs = require('fs');
    const reportPath = './reports/spectral-test-report.md';

    try {
        fs.mkdirSync('./reports', { recursive: true });
        fs.writeFileSync(reportPath, report);
        console.log(`\nTest report generated: ${reportPath}`);
    } catch (error) {
        console.error('Failed to save test report:', error);
    }
}

// Run test suite if this is the main module
if (require.main === module) {
    runTestSuite()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { runTestSuite };
