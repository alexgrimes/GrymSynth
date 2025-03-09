const { XenakisPromptEnhancer } = require('./tests/prompt-enhancement.test');
const { testSpatialSpectralPipeline } = require('./tests/spatial-spectral.test');
const { runSpectralAnalysis } = require('./tests/spectral-analysis');
const Logger = require('./lib/logger');
const SpectralVisualizer = require('./lib/spectral-visualizer');

async function runAllTests() {
    Logger.section('XenakisLDM Complete Test Suite');
    const results = {
        prompts: [],
        spectralAnalysis: false,
        pipeline: false
    };

    try {
        // Test 1: Prompt Enhancement
        Logger.section('1. Testing Prompt Enhancement');
        const enhancer = new XenakisPromptEnhancer({ debug: true });

        const testPrompts = [
            {
                name: 'Basic Intervals',
                prompt: 'drone tone',
                params: {
                    sieve: {
                        intervals: [0, 7, 12],
                        modulo: 12,
                        density: 1.0
                    }
                }
            },
            {
                name: 'Complex Transform',
                prompt: 'ambient texture',
                params: {
                    sieve: {
                        intervals: [0, 3, 7, 10],
                        modulo: 12,
                        density: 0.8
                    },
                    stochastic: {
                        variance: 0.1
                    }
                }
            }
        ];

        testPrompts.forEach(test => {
            try {
                const enhanced = enhancer.enhance(test.prompt, test.params);
                Logger.info(`\nTest: ${test.name}`);
                Logger.info('Input:', { prompt: test.prompt, params: test.params });
                Logger.info('Enhanced:', enhanced);
                results.prompts.push({ name: test.name, passed: true });
            } catch (error) {
                Logger.info(`Error in ${test.name}:`, error.message);
                results.prompts.push({ name: test.name, passed: false, error: error.message });
            }
        });

        // Test 2: Spectral Analysis
        Logger.section('2. Testing Spectral Analysis');
        results.spectralAnalysis = await runSpectralAnalysis();

        // Test 3: Pipeline Integration
        Logger.section('3. Testing Pipeline Integration');
        results.pipeline = await testSpatialSpectralPipeline();

        // Print summary
        Logger.section('Test Summary');

        Logger.info('\nPrompt Enhancement Tests:');
        results.prompts.forEach(result => {
            const status = result.passed ? '✓ PASS' : '✗ FAIL';
            Logger.info(`${status} ${result.name}`);
            if (!result.passed) {
                Logger.info(`  Error: ${result.error}`);
            }
        });

        Logger.info('\nSpectral Analysis:', results.spectralAnalysis ? '✓ PASS' : '✗ FAIL');
        Logger.info('Pipeline Integration:', results.pipeline ? '✓ PASS' : '✗ FAIL');

        // Calculate overall success
        const promptSuccess = results.prompts.every(r => r.passed);
        const overallSuccess = promptSuccess && results.spectralAnalysis && results.pipeline;

        Logger.info('\nOverall Result:', overallSuccess ? '✓ PASS' : '✗ FAIL');

        // Generate report
        generateTestReport(results);

        return overallSuccess;
    } catch (error) {
        Logger.info('Test suite execution failed:', error);
        return false;
    }
}

function generateTestReport(results) {
    const report = [
        '# XenakisLDM Test Report',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## Test Results',
        '',
        '### 1. Prompt Enhancement',
        ...results.prompts.map(r => `- ${r.name}: ${r.passed ? 'PASS' : 'FAIL'}${r.error ? ` (${r.error})` : ''}`),
        '',
        '### 2. Spectral Analysis',
        `Result: ${results.spectralAnalysis ? 'PASS' : 'FAIL'}`,
        '',
        '### 3. Pipeline Integration',
        `Result: ${results.pipeline ? 'PASS' : 'FAIL'}`,
        '',
        '## System Information',
        `- Node Version: ${process.version}`,
        `- Platform: ${process.platform}`,
        `- Architecture: ${process.arch}`,
        '',
        '## Notes',
        '- Prompt enhancement tests verify parameter handling',
        '- Spectral analysis tests verify transformation accuracy',
        '- Pipeline tests verify end-to-end functionality',
        ''
    ].join('\n');

    // Save report
    const fs = require('fs');
    const reportPath = './reports/test-report.md';

    try {
        fs.mkdirSync('./reports', { recursive: true });
        fs.writeFileSync(reportPath, report);
        console.log(`\nTest report generated: ${reportPath}`);
    } catch (error) {
        console.error('Failed to save test report:', error);
    }
}

// Run tests if this is the main module
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
