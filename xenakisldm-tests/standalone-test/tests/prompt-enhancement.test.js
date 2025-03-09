/**
 * Prompt enhancement for XenakisLDM pipeline
 */
class XenakisPromptEnhancer {
    constructor(config = {}) {
        this.config = {
            debug: true,
            ...config
        };
    }

    enhance(basePrompt, parameters) {
        try {
            const enhancements = [];

            // Handle sieve parameters
            if (parameters.sieve) {
                const sieveDesc = this._describeSieve(parameters.sieve);
                if (sieveDesc) enhancements.push(sieveDesc);
            }

            // Handle stochastic parameters
            if (parameters.stochastic) {
                const stochDesc = this._describeStochastic(parameters.stochastic);
                if (stochDesc) enhancements.push(stochDesc);
            }

            // Handle cellular automata parameters
            if (parameters.cellular) {
                const cellDesc = this._describeCellular(parameters.cellular);
                if (cellDesc) enhancements.push(cellDesc);
            }

            // Combine enhancements
            const enhancementText = enhancements.join(', with ');
            if (this.config.debug) {
                console.log('Parameters:', parameters);
                console.log('Base prompt:', basePrompt);
                console.log('sieve enhancement:', enhancementText);
            }

            // Return enhanced prompt
            return enhancementText ? `${basePrompt} ${enhancementText}` : basePrompt;
        } catch (error) {
            console.error('Prompt enhancement error:', error);
            return basePrompt; // Fall back to base prompt on error
        }
    }

    _describeSieve(sieve) {
        if (!sieve || !Array.isArray(sieve.intervals)) {
            return null;
        }

        const descriptions = [];

        // Describe intervals
        descriptions.push(`using sieve intervals [${sieve.intervals.join(', ')}]`);

        // Add modulo if specified
        if (sieve.modulo) {
            descriptions.push(`mod ${sieve.modulo}`);
        }

        // Add density if specified
        if (typeof sieve.density === 'number') {
            descriptions.push(`with density ${sieve.density.toFixed(2)}`);
        }

        return descriptions.join(' ');
    }

    _describeStochastic(stochastic) {
        if (!stochastic) return null;

        const descriptions = [];

        if (typeof stochastic.variance === 'number') {
            descriptions.push(`with stochastic variance ${stochastic.variance.toFixed(2)}`);
        }

        return descriptions.join(' ');
    }

    _describeCellular(cellular) {
        if (!cellular) return null;

        const descriptions = [];

        if (typeof cellular.rule === 'number') {
            descriptions.push(`using cellular automata rule ${cellular.rule}`);
        }

        if (typeof cellular.dimensions === 'number') {
            descriptions.push(`in ${cellular.dimensions}D`);
        }

        return descriptions.join(' ');
    }

    /**
     * Test the prompt enhancement functionality
     */
    static test() {
        console.log('Testing XenakisPromptEnhancer\n');
        const enhancer = new XenakisPromptEnhancer({ debug: true });
        const testCases = [
            {
                name: 'Basic Sieve',
                prompt: 'test tone',
                params: {
                    sieve: {
                        intervals: [0, 7, 12],
                        modulo: 12
                    }
                }
            },
            {
                name: 'Complex Parameters',
                prompt: 'ambient texture',
                params: {
                    sieve: {
                        intervals: [0, 4, 7],
                        modulo: 12,
                        density: 0.8
                    },
                    stochastic: {
                        variance: 0.1
                    },
                    cellular: {
                        rule: 110,
                        dimensions: 1
                    }
                }
            },
            {
                name: 'Error Handling',
                prompt: 'test signal',
                params: {
                    sieve: {
                        intervals: null // Should handle this gracefully
                    }
                }
            }
        ];

        const results = [];
        testCases.forEach(test => {
            try {
                console.log(`\nTest Case: ${test.name}`);
                const enhanced = enhancer.enhance(test.prompt, test.params);
                console.log('Result:', enhanced);
                results.push({ name: test.name, passed: true });
            } catch (error) {
                console.error(`Error in ${test.name}:`, error);
                results.push({ name: test.name, passed: false, error: error.message });
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

// Run tests if this is the main module
if (require.main === module) {
    XenakisPromptEnhancer.test();
}

module.exports = { XenakisPromptEnhancer };
