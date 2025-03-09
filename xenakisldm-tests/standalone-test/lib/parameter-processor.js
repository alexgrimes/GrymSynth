/**
 * Parameter processing and validation for XenakisLDM
 */
class ParameterProcessor {
    static validateAndNormalize(params = {}) {
        return {
            // Duration parameter
            duration: this._normalizeDuration(params.duration),

            // Sieve parameters
            sieve: this._normalizeSieve(params.sieve),

            // Stochastic parameters
            stochastic: this._normalizeStochastic(params.stochastic),

            // Cellular parameters
            cellular: this._normalizeCellular(params.cellular)
        };
    }

    static _normalizeDuration(duration) {
        if (typeof duration !== 'number' || duration <= 0) {
            return 1.0; // Default duration
        }
        return Math.min(Math.max(duration, 0.1), 10.0); // Clamp between 0.1 and 10 seconds
    }

    static _normalizeSieve(sieve) {
        if (!sieve) return null;

        return {
            // Default to major scale intervals if none provided
            intervals: Array.isArray(sieve.intervals) ?
                      sieve.intervals : [0, 2, 4, 5, 7, 9, 11],

            // Default to chromatic modulo
            modulo: typeof sieve.modulo === 'number' ?
                   Math.max(1, Math.floor(sieve.modulo)) : 12,

            // Normalize density between 0 and 1
            density: typeof sieve.density === 'number' ?
                    Math.min(Math.max(sieve.density, 0), 1) : 1.0,

            // Field configuration
            fields: {
                strength: typeof sieve.fields?.strength === 'number' ?
                         Math.min(Math.max(sieve.fields.strength, 0), 2) : 1.0,

                interaction: typeof sieve.fields?.interaction === 'number' ?
                           Math.min(Math.max(sieve.fields.interaction, 0), 1) : 0.5,

                evolution: typeof sieve.fields?.evolution === 'number' ?
                          Math.min(Math.max(sieve.fields.evolution, 0), 1) : 0.3
            },

            // Spectral configuration
            spectral: {
                minFreq: typeof sieve.spectral?.minFreq === 'number' ?
                        Math.max(20, sieve.spectral.minFreq) : 20,

                maxFreq: typeof sieve.spectral?.maxFreq === 'number' ?
                        Math.min(20000, sieve.spectral.maxFreq) : 20000,

                resolution: typeof sieve.spectral?.resolution === 'number' ?
                          Math.pow(2, Math.floor(Math.log2(
                              Math.max(512, Math.min(8192, sieve.spectral.resolution))
                          ))) : 2048
            }
        };
    }

    static _normalizeStochastic(stochastic) {
        if (!stochastic) return null;

        return {
            // Normalize variance between 0 and 1
            variance: typeof stochastic.variance === 'number' ?
                     Math.min(Math.max(stochastic.variance, 0), 1) : 0.1,

            // Distribution parameters
            distribution: {
                type: typeof stochastic.distribution?.type === 'string' ?
                      stochastic.distribution.type : 'gaussian',

                mean: typeof stochastic.distribution?.mean === 'number' ?
                      stochastic.distribution.mean : 0,

                spread: typeof stochastic.distribution?.spread === 'number' ?
                       Math.max(0, stochastic.distribution.spread) : 1
            }
        };
    }

    static _normalizeCellular(cellular) {
        if (!cellular) return null;

        return {
            // Default to Rule 110 if not specified
            rule: typeof cellular.rule === 'number' ?
                  Math.floor(Math.max(0, Math.min(255, cellular.rule))) : 110,

            // Default to 1D
            dimensions: typeof cellular.dimensions === 'number' ?
                      Math.floor(Math.max(1, Math.min(2, cellular.dimensions))) : 1,

            // Interaction parameters
            interaction: {
                strength: typeof cellular.interaction?.strength === 'number' ?
                         Math.min(Math.max(cellular.interaction.strength, 0), 1) : 0.5,

                radius: typeof cellular.interaction?.radius === 'number' ?
                       Math.max(1, Math.floor(cellular.interaction.radius)) : 1
            }
        };
    }

    /**
     * Test parameter processing
     */
    static test() {
        const testCases = [
            {
                name: 'Empty Parameters',
                input: {},
                expectValid: true
            },
            {
                name: 'Basic Sieve',
                input: {
                    sieve: {
                        intervals: [0, 4, 7],
                        modulo: 12
                    }
                },
                expectValid: true
            },
            {
                name: 'Invalid Values',
                input: {
                    duration: -1,
                    sieve: {
                        intervals: 'invalid',
                        modulo: -5
                    }
                },
                expectValid: true // Should normalize invalid values
            },
            {
                name: 'Complex Configuration',
                input: {
                    sieve: {
                        intervals: [0, 3, 7],
                        modulo: 12,
                        fields: {
                            strength: 1.5,
                            interaction: 0.7
                        },
                        spectral: {
                            resolution: 4096
                        }
                    },
                    stochastic: {
                        variance: 0.2,
                        distribution: {
                            type: 'gaussian',
                            spread: 1.5
                        }
                    }
                },
                expectValid: true
            }
        ];

        console.log('Testing Parameter Processor\n');
        const results = [];

        testCases.forEach(test => {
            try {
                console.log(`Test Case: ${test.name}`);
                console.log('Input:', JSON.stringify(test.input, null, 2));

                const processed = this.validateAndNormalize(test.input);
                console.log('Output:', JSON.stringify(processed, null, 2));

                results.push({ name: test.name, passed: true });
            } catch (error) {
                console.error(`Error in ${test.name}:`, error);
                results.push({
                    name: test.name,
                    passed: !test.expectValid,
                    error: error.message
                });
            }
        });

        // Print summary
        console.log('\nTest Summary:');
        console.log('-'.repeat(50));
        results.forEach(result => {
            const status = result.passed ? '✓ PASS' : '✗ FAIL';
            console.log(`${status} ${result.name}`);
            if (!result.passed) {
                console.log(`  Error: ${result.error}`);
            }
        });
    }
}

module.exports = ParameterProcessor;
