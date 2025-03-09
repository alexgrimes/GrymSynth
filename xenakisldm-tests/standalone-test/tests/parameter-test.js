const ParameterProcessor = require('../lib/parameter-processor');
const XenakisLDMPipeline = require('../lib/xenakis-pipeline');
const Logger = require('../lib/logger');
const TestHelpers = require('../lib/test-helpers');

async function testParameters() {
    Logger.section('Parameter Processing and Pipeline Tests');

    const testCases = [
        {
            name: 'Basic Sieve Configuration',
            params: {
                duration: 0.5,
                sieve: {
                    intervals: [0, 7, 12],
                    modulo: 12,
                    density: 0.8,
                    fields: {
                        strength: 1.2
                    }
                }
            },
            expectSuccess: true
        },
        {
            name: 'Complex Transformation Chain',
            params: {
                duration: 1.0,
                sieve: {
                    intervals: [0, 4, 7],
                    modulo: 12,
                    density: 0.9,
                    fields: {
                        strength: 1.5,
                        interaction: 0.8,
                        evolution: 0.4
                    },
                    spectral: {
                        minFreq: 50,
                        maxFreq: 15000,
                        resolution: 4096
                    }
                },
                stochastic: {
                    variance: 0.1,
                    distribution: {
                        type: 'gaussian',
                        mean: 0,
                        spread: 1.2
                    }
                }
            },
            expectSuccess: true
        },
        {
            name: 'Edge Case Handling',
            params: {
                duration: -1,      // Should be normalized to minimum
                sieve: {
                    intervals: null,  // Should use defaults
                    modulo: -5,      // Should be normalized
                    density: 1.5,    // Should be clamped
                    fields: {
                        strength: 3.0 // Should be clamped
                    }
                },
                stochastic: {
                    variance: 2.0     // Should be clamped
                }
            },
            expectSuccess: true
        },
        {
            name: 'Minimal Configuration',
            params: {
                sieve: {
                    intervals: [0, 12]
                }
            },
            expectSuccess: true
        }
    ];

    const results = [];

    // Test parameter processing
    Logger.section('1. Parameter Processing Tests');

    for (const test of testCases) {
        try {
            Logger.section(`Test Case: ${test.name}`);
            Logger.info('Input Parameters:', test.params);

            const processed = ParameterProcessor.validateAndNormalize(test.params);

            // Compare original and processed parameters
            const changes = TestHelpers.compareParameters(test.params, processed);

            Logger.info('\nValidation Summary:');
            Logger.info(`- Changes applied: ${changes.length}`);
            Logger.info(`- Major modifications: ${
                changes.filter(c => c.kind === 'clamped_down' || c.kind === 'clamped_up').length
            }`);

            results.push({
                name: `Parameter Processing: ${test.name}`,
                passed: true,
                changes
            });
        } catch (error) {
            Logger.info(`Error in ${test.name}:`, error.message);
            results.push({
                name: `Parameter Processing: ${test.name}`,
                passed: !test.expectSuccess,
                error: error.message
            });
        }
    }

    // Test pipeline integration
    Logger.section('2. Pipeline Integration Tests');
    const pipeline = new XenakisLDMPipeline({
        enableVisualization: true
    });

    for (const test of testCases) {
        try {
            Logger.section(`Pipeline Test: ${test.name}`);

            const { rawAudio, processedAudio, parameters } =
                await pipeline.generate('test tone', test.params);

            // Compare audio characteristics
            TestHelpers.compareAudioCharacteristics(
                rawAudio,
                processedAudio,
                `${test.name} - `
            );

            // Compare original and final parameters
            TestHelpers.compareParameters(
                test.params,
                parameters,
                'Final '
            );

            results.push({
                name: `Pipeline Integration: ${test.name}`,
                passed: true
            });
        } catch (error) {
            Logger.info(`Pipeline error in ${test.name}:`, error.message);
            results.push({
                name: `Pipeline Integration: ${test.name}`,
                passed: !test.expectSuccess,
                error: error.message
            });
        }
    }

    // Print summary
    Logger.section('Test Summary');

    let passed = 0, failed = 0;
    let totalChanges = 0;

    results.forEach(result => {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        Logger.info(`${status} ${result.name}`);

        if (!result.passed) {
            Logger.info(`  Error: ${result.error}`);
            failed++;
        } else {
            passed++;
            if (result.changes) {
                totalChanges += result.changes.length;
            }
        }
    });

    Logger.info('\nFinal Results:');
    Logger.info(`Total Tests: ${results.length}`);
    Logger.info(`Passed: ${passed}`);
    Logger.info(`Failed: ${failed}`);
    Logger.info(`Total Parameter Changes: ${totalChanges}`);

    return failed === 0;
}

// Run tests if this is the main module
if (require.main === module) {
    testParameters()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testParameters };
