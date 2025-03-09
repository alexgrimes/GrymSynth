const SpectralFieldEvolution = require('../lib/spectral-field-evolution');
const Logger = require('../lib/logger');
const EvolutionVisualizer = require('../lib/evolution-visualizer');

async function testFieldEvolution() {
    Logger.section('Testing Spectral Field Evolution');

    const testCases = [
        {
            name: 'Harmonic Series Evolution',
            fields: [
                {
                    frequency: 440,  // A4 (fundamental)
                    strength: 1.0,
                    bandwidth: 20,
                    evolution: 0.3
                },
                {
                    frequency: 880,  // A5 (2:1 - octave)
                    strength: 0.7,
                    bandwidth: 30,
                    evolution: 0.4
                },
                {
                    frequency: 660,  // E5 (3:2 - perfect fifth)
                    strength: 0.5,
                    bandwidth: 25,
                    evolution: 0.35
                }
            ],
            timeSteps: [0, 0.25, 0.5, 0.75, 1.0],
            expectStrengthening: true
        },
        {
            name: 'Dissonant Interaction',
            fields: [
                {
                    frequency: 440,   // A4
                    strength: 1.0,
                    bandwidth: 20,
                    evolution: 0.3
                },
                {
                    frequency: 466.16, // Bb4 (dissonant minor second)
                    strength: 0.7,
                    bandwidth: 25,
                    evolution: 0.4
                }
            ],
            timeSteps: [0, 0.5, 1.0],
            expectStrengthening: false
        },
        {
            name: 'Complex Harmonic Structure',
            fields: [
                {
                    frequency: 440,   // A4 (fundamental)
                    strength: 1.0,
                    bandwidth: 20,
                    evolution: 0.3
                },
                {
                    frequency: 880,   // A5 (2nd harmonic)
                    strength: 0.6,
                    bandwidth: 30,
                    evolution: 0.4
                },
                {
                    frequency: 1320,  // E6 (3rd harmonic)
                    strength: 0.4,
                    bandwidth: 40,
                    evolution: 0.5
                },
                {
                    frequency: 1760,  // A6 (4th harmonic)
                    strength: 0.3,
                    bandwidth: 50,
                    evolution: 0.6
                }
            ],
            timeSteps: [0, 0.33, 0.66, 1.0],
            expectStrengthening: true
        }
    ];

    const results = [];
    const evolution = new SpectralFieldEvolution({
        evolutionRate: 0.3,
        interactionStrength: 0.6,
        harmonicThreshold: 0.1
    });

    for (const test of testCases) {
        try {
            Logger.section(`Test Case: ${test.name}`);

            // Show initial field configuration
            Logger.info('\nInitial Field Configuration:');
            EvolutionVisualizer.visualizeFieldDistribution(test.fields);

            // Track field evolution
            const evolutionData = [];

            for (const time of test.timeSteps) {
                const evolvedFields = evolution.evolveFields(
                    test.fields,
                    time,
                    {
                        spectralDensity: 0.8,
                        temporalEvolution: 0.4,
                        structuralStability: 0.9
                    }
                );

                const metrics = evolution.getEvolutionMetrics(evolvedFields);
                evolutionData.push({ time, fields: evolvedFields, metrics });
            }

            // Visualize evolution over time
            EvolutionVisualizer.visualizeEvolution(evolutionData);

            // Show final field configuration
            Logger.info('\nFinal Field Configuration:');
            EvolutionVisualizer.visualizeFieldDistribution(
                evolutionData[evolutionData.length - 1].fields
            );

            // Verify evolution characteristics
            const initialStrength = evolutionData[0].metrics.averageStrength;
            const finalStrength = evolutionData[evolutionData.length - 1].metrics.averageStrength;
            const strengthChange = (finalStrength - initialStrength) / initialStrength;

            Logger.info('\nStrength Evolution:');
            Logger.info(`Initial: ${initialStrength.toFixed(3)}`);
            Logger.info(`Final: ${finalStrength.toFixed(3)}`);
            Logger.info(`Change: ${(strengthChange * 100).toFixed(1)}%`);

            // Check harmonic relationships
            let hasHarmonicInteraction = false;
            evolutionData.forEach(({ fields }) => {
                for (let i = 0; i < fields.length; i++) {
                    for (let j = i + 1; j < fields.length; j++) {
                        const ratio = fields[i].frequency / fields[j].frequency;
                        if (Math.abs(Math.round(ratio * 2) / 2 - ratio) < 0.1) {
                            hasHarmonicInteraction = true;
                            break;
                        }
                    }
                }
            });

            // Verify expectations
            const strengtheningOccurred = strengthChange > 0.05;
            if (strengtheningOccurred !== test.expectStrengthening) {
                throw new Error(
                    `Unexpected strength evolution: ${strengthChange > 0 ? 'increased' : 'decreased'} ` +
                    `when ${test.expectStrengthening ? 'increase' : 'decrease'} expected`
                );
            }

            if (test.expectStrengthening && !hasHarmonicInteraction) {
                throw new Error('Expected harmonic interaction not detected');
            }

            results.push({ name: test.name, passed: true });
        } catch (error) {
            Logger.info(`Error in ${test.name}:`, error.message);
            results.push({ name: test.name, passed: false, error: error.message });
        }
    }

    // Print summary
    Logger.section('Test Summary');
    let passed = 0, failed = 0;

    results.forEach(result => {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        Logger.info(`${status} ${result.name}`);
        if (!result.passed) {
            Logger.info(`  Error: ${result.error}`);
            failed++;
        } else {
            passed++;
        }
    });

    Logger.info('\nFinal Results:');
    Logger.info(`Total Tests: ${results.length}`);
    Logger.info(`Passed: ${passed}`);
    Logger.info(`Failed: ${failed}`);

    return failed === 0;
}

// Run tests if this is the main module
if (require.main === module) {
    testFieldEvolution()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testFieldEvolution };
