#!/usr/bin/env node
const path = require('path');
const fs = require('fs').promises;
const Logger = require('./lib/logger');
const { testParameters } = require('./tests/parameter-test');
const { testSpatialSpectralPipeline } = require('./tests/spatial-spectral.test');
const { testFieldEvolution } = require('./tests/field-evolution.test');
const { runAllTests: runIntegratedTests } = require('./tests/integrated-framework.test');

async function runAllTests() {
    Logger.section('XenakisLDM Spatial-Spectral Test Suite');
    const startTime = process.hrtime.bigint();
    const results = {
        parameters: null,
        pipeline: null,
        evolution: null,
        integrated: null,
        performance: {
            duration: 0,
            memory: 0
        }
    };

    try {
        // Record initial memory
        const initialMemory = process.memoryUsage();

        // Run all test suites
        Logger.section('1. Parameter Tests');
        results.parameters = await testParameters();

        Logger.section('2. Pipeline Tests');
        results.pipeline = await testSpatialSpectralPipeline();

        Logger.section('3. Field Evolution Tests');
        results.evolution = await testFieldEvolution();

        Logger.section('4. Integrated Framework Tests');
        results.integrated = await runIntegratedTests();

        // Calculate performance metrics
        const endTime = process.hrtime.bigint();
        results.performance.duration = Number(endTime - startTime) / 1e6; // ms
        results.performance.memory = (
            process.memoryUsage().heapUsed - initialMemory.heapUsed
        ) / 1024 / 1024; // MB

        // Generate report
        await generateTestReport(results);

        // Return overall success
        return Object.values(results)
            .filter(r => typeof r === 'boolean')
            .every(r => r);
    } catch (error) {
        Logger.info('Test execution failed:', error);
        return false;
    }
}

async function generateTestReport(results) {
    const report = [
        '# XenakisLDM Test Report',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## Test Results',
        '',
        '### Parameter Processing',
        `Status: ${results.parameters ? '✓ PASS' : '✗ FAIL'}`,
        '',
        '### Pipeline Integration',
        `Status: ${results.pipeline ? '✓ PASS' : '✗ FAIL'}`,
        '',
        '### Field Evolution',
        `Status: ${results.evolution ? '✓ PASS' : '✗ FAIL'}`,
        '',
        '### Integrated Mathematical Frameworks',
        `Status: ${results.integrated ? '✓ PASS' : '✗ FAIL'}`,
        '',
        '## Performance Metrics',
        `- Total Duration: ${results.performance.duration.toFixed(2)}ms`,
        `- Memory Usage: ${results.performance.memory.toFixed(2)}MB`,
        '',
        '## System Information',
        `- Node.js: ${process.version}`,
        `- Platform: ${process.platform}`,
        `- Architecture: ${process.arch}`,
        `- CPU Cores: ${require('os').cpus().length}`,
        '',
        '## Test Coverage',
        '- Parameter validation and normalization',
        '- Spectral field generation and evolution',
        '- Pipeline integration and transformation',
        '- Mathematical framework integration',
        '- Performance and memory management',
        '',
        '## Notes',
        '1. Parameter processing validates all input configurations',
        '2. Pipeline tests verify end-to-end transformation',
        '3. Evolution tests check field interaction and temporal development',
        '4. Integrated framework tests verify the combination of multiple mathematical approaches',
        '5. Performance metrics include all test execution overhead',
        '',
        '## Next Steps',
        `${getNextSteps(results)}`,
        '',
        '## Conclusion',
        `${getConclusion(results)}`
    ].join('\n');

    // Save report
    const reportPath = path.join(__dirname, 'reports', 'test-report.md');
    await fs.mkdir(path.join(__dirname, 'reports'), { recursive: true });
    await fs.writeFile(reportPath, report);

    Logger.info(`\nTest report generated: ${reportPath}`);
}

function getNextSteps(results) {
    const steps = [];

    if (!results.parameters) {
        steps.push('- Improve parameter validation and normalization');
    }
    if (!results.pipeline) {
        steps.push('- Enhance pipeline integration and stability');
    }
    if (!results.evolution) {
        steps.push('- Refine field evolution and interaction models');
    }
    if (!results.integrated) {
        steps.push('- Fix issues with mathematical framework integration');
    }

    if (results.performance.duration > 1000) {
        steps.push('- Optimize test execution performance');
    }
    if (results.performance.memory > 100) {
        steps.push('- Improve memory efficiency');
    }

    if (steps.length === 0) {
        steps.push(
            '- Implement real-time processing capabilities',
            '- Add advanced visualization features',
            '- Enhance field interaction models',
            '- Create user interface components',
            '- Implement feedback mechanisms between mathematical frameworks',
            '- Add parameter mapping for musical concepts'
        );
    }

    return steps.join('\n');
}

function getConclusion(results) {
    const allPassed = Object.values(results)
        .filter(r => typeof r === 'boolean')
        .every(r => r);

    if (allPassed) {
        return [
            'All tests passed successfully, demonstrating the stability and',
            'correctness of the implementation. The system shows good performance',
            'characteristics and proper integration of multiple mathematical frameworks,',
            'including spatial-spectral sieve, stochastic processes, cellular automata,',
            'and game theory.'
        ].join(' ');
    } else {
        return [
            'Some tests failed, indicating areas needing improvement in the',
            'implementation. Review the test results above for specific',
            'components requiring attention.'
        ].join(' ');
    }
}

// Run if this is the main module
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests };
