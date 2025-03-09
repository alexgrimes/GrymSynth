/**
 * Unified Parameter Space for XenakisLDM
 *
 * This module provides a unified parameter space for all mathematical frameworks
 * used in the XenakisLDM system, ensuring consistent parameter handling and validation.
 */

class UnifiedParameterSpace {
    /**
     * Validate and normalize parameters for all mathematical frameworks
     *
     * @param {Object} params - Raw parameters from user input
     * @returns {Object} - Normalized parameters
     */
    static validateAndNormalize(params = {}) {
        return {
            // Duration parameter
            duration: this._normalizeDuration(params.duration),

            // Spatial-spectral parameters
            spatial: this._normalizeSpatial(params.spatial),

            // Stochastic parameters
            stochastic: this._normalizeStochastic(params.stochastic),

            // Cellular automata parameters
            cellular: this._normalizeCellular(params.cellular),

            // Game theory parameters
            gameTheory: this._normalizeGameTheory(params.gameTheory),

            // Framework integration parameters
            integration: this._normalizeIntegration(params.integration)
        };
    }

    /**
     * Normalize duration parameter
     */
    static _normalizeDuration(duration) {
        if (typeof duration !== 'number' || duration <= 0) {
            return 1.0; // Default duration
        }
        return Math.min(Math.max(duration, 0.1), 10.0); // Clamp between 0.1 and 10 seconds
    }

    /**
     * Normalize spatial-spectral parameters
     */
    static _normalizeSpatial(spatial) {
        if (!spatial) return null;

        return {
            // Gravitational constant
            G: typeof spatial.G === 'number' ?
               Math.max(0, spatial.G) : 0.01,

            // Gravitational fields
            fields: Array.isArray(spatial.fields) ?
                   spatial.fields : [],

            // Undulation rate (temporal variation in field strength)
            undulationRate: typeof spatial.undulationRate === 'number' ?
                           Math.min(Math.max(spatial.undulationRate, 0), 1) : 0.3,

            // Spatial hallucination (non-linear spatial effects)
            spatialHallucination: typeof spatial.spatialHallucination === 'number' ?
                                 Math.min(Math.max(spatial.spatialHallucination, 0), 1) : 0.5,

            // Phase influence (how much fields affect phase)
            phaseInfluence: typeof spatial.phaseInfluence === 'number' ?
                           Math.min(Math.max(spatial.phaseInfluence, 0), 1) : 0.2,

            // Frequency pull (how much fields shift frequencies)
            frequencyPull: typeof spatial.frequencyPull === 'number' ?
                          Math.min(Math.max(spatial.frequencyPull, 0), 1) : 0.1,

            // Magnitude influence (how much fields affect magnitude)
            magnitudeInfluence: typeof spatial.magnitudeInfluence === 'number' ?
                               Math.min(Math.max(spatial.magnitudeInfluence, 0), 2) : 1.0,

            // Spectral configuration
            spectral: {
                minFreq: typeof spatial.spectral?.minFreq === 'number' ?
                        Math.max(20, spatial.spectral.minFreq) : 20,

                maxFreq: typeof spatial.spectral?.maxFreq === 'number' ?
                        Math.min(20000, spatial.spectral.maxFreq) : 20000,

                resolution: typeof spatial.spectral?.resolution === 'number' ?
                          Math.pow(2, Math.floor(Math.log2(
                              Math.max(512, Math.min(8192, spatial.spectral.resolution))
                          ))) : 2048
            },

            // Musical intervals
            intervals: Array.isArray(spatial.intervals) ?
                      spatial.intervals : [0, 2, 4, 5, 7, 9, 11],

            // Modulo for interval calculations
            modulo: typeof spatial.modulo === 'number' ?
                   Math.max(1, Math.floor(spatial.modulo)) : 12,

            // Density of spectral transformation
            density: typeof spatial.density === 'number' ?
                    Math.min(Math.max(spatial.density, 0), 1) : 1.0
        };
    }

    /**
     * Normalize stochastic parameters
     */
    static _normalizeStochastic(stochastic) {
        if (!stochastic) return null;

        return {
            // Variance of stochastic processes
            variance: typeof stochastic.variance === 'number' ?
                     Math.min(Math.max(stochastic.variance, 0), 1) : 0.1,

            // Distribution parameters
            distribution: {
                // Distribution type
                type: typeof stochastic.distribution?.type === 'string' ?
                      stochastic.distribution.type : 'gaussian',

                // Mean value
                mean: typeof stochastic.distribution?.mean === 'number' ?
                      stochastic.distribution.mean : 0,

                // Spread/variance
                spread: typeof stochastic.distribution?.spread === 'number' ?
                       Math.max(0, stochastic.distribution.spread) : 1
            },

            // Frequency modulation (how frequency affects stochastic processes)
            frequencyModulation: typeof stochastic.frequencyModulation === 'number' ?
                               Math.max(1, stochastic.frequencyModulation) : 1000,

            // Frequency dependence (strength of frequency modulation)
            frequencyDependence: typeof stochastic.frequencyDependence === 'number' ?
                                Math.min(Math.max(stochastic.frequencyDependence, 0), 1) : 0.3,

            // Phase variance (how much stochastic processes affect phase)
            phaseVariance: typeof stochastic.phaseVariance === 'number' ?
                          Math.min(Math.max(stochastic.phaseVariance, 0), 1) : 0.2,

            // Pitch shift (how much stochastic processes shift frequency)
            pitchShift: typeof stochastic.pitchShift === 'number' ?
                       Math.min(Math.max(stochastic.pitchShift, 0), 0.1) : 0.01,

            // Markov parameters (for Markov chain processes)
            markov: {
                order: typeof stochastic.markov?.order === 'number' ?
                      Math.max(1, Math.floor(stochastic.markov.order)) : 1,

                states: typeof stochastic.markov?.states === 'number' ?
                       Math.max(2, Math.floor(stochastic.markov.states)) : 4,

                // Transition matrix (if provided)
                transitionMatrix: Array.isArray(stochastic.markov?.transitionMatrix) ?
                                 stochastic.markov.transitionMatrix : null
            }
        };
    }

    /**
     * Normalize cellular automata parameters
     */
    static _normalizeCellular(cellular) {
        if (!cellular) return null;

        return {
            // CA rule number
            rule: typeof cellular.rule === 'number' ?
                  Math.floor(Math.max(0, Math.min(255, cellular.rule))) : 110,

            // Dimensions (1D or 2D)
            dimensions: typeof cellular.dimensions === 'number' ?
                       Math.floor(Math.max(1, Math.min(2, cellular.dimensions))) : 1,

            // Grid size
            gridSize: typeof cellular.gridSize === 'number' ?
                     Math.max(8, Math.min(256, Math.floor(cellular.gridSize))) : 128,

            // Initial state type
            initialState: typeof cellular.initialState === 'string' ?
                         cellular.initialState : 'random',

            // Number of iterations
            iterations: typeof cellular.iterations === 'number' ?
                       Math.max(1, Math.floor(cellular.iterations)) : 4,

            // Interaction parameters
            interaction: {
                // Effect strength
                strength: typeof cellular.interaction?.strength === 'number' ?
                         Math.min(Math.max(cellular.interaction.strength, 0), 1) : 0.5,

                // Neighborhood radius
                radius: typeof cellular.interaction?.radius === 'number' ?
                       Math.max(1, Math.floor(cellular.interaction.radius)) : 1,

                // Boundary condition
                boundary: typeof cellular.interaction?.boundary === 'string' ?
                         cellular.interaction.boundary : 'wrap'
            }
        };
    }

    /**
     * Normalize game theory parameters
     */
    static _normalizeGameTheory(gameTheory) {
        if (!gameTheory) return null;

        return {
            // Number of agents
            agentCount: typeof gameTheory.agentCount === 'number' ?
                       Math.max(2, Math.floor(gameTheory.agentCount)) : 4,

            // Strategy space type
            strategySpace: typeof gameTheory.strategySpace === 'string' ?
                          gameTheory.strategySpace : 'discrete',

            // Learning rate
            learningRate: typeof gameTheory.learningRate === 'number' ?
                         Math.min(Math.max(gameTheory.learningRate, 0), 1) : 0.1,

            // Competition factor (0 = pure cooperation, 1 = pure competition)
            competitionFactor: typeof gameTheory.competitionFactor === 'number' ?
                              Math.min(Math.max(gameTheory.competitionFactor, 0), 1) : 0.5,

            // Payoff matrix (if provided)
            payoffMatrix: Array.isArray(gameTheory.payoffMatrix) ?
                         gameTheory.payoffMatrix : null,

            // Effect parameters
            magnitudeInfluence: typeof gameTheory.magnitudeInfluence === 'number' ?
                               Math.min(Math.max(gameTheory.magnitudeInfluence, 0), 1) : 0.5,

            phaseInfluence: typeof gameTheory.phaseInfluence === 'number' ?
                           Math.min(Math.max(gameTheory.phaseInfluence, 0), 1) : 0.3,

            frequencyInfluence: typeof gameTheory.frequencyInfluence === 'number' ?
                               Math.min(Math.max(gameTheory.frequencyInfluence, 0), 1) : 0.2
        };
    }

    /**
     * Normalize integration parameters
     */
    static _normalizeIntegration(integration) {
        if (!integration) {
            // Default to balanced integration
            return {
                weights: {
                    spatialSpectral: 1.0,
                    stochastic: 0.7,
                    cellular: 0.5,
                    gameTheory: 0.3
                },
                blendMode: 'weighted'
            };
        }

        return {
            // Framework weights
            weights: {
                spatialSpectral: typeof integration.weights?.spatialSpectral === 'number' ?
                                Math.max(0, integration.weights.spatialSpectral) : 1.0,

                stochastic: typeof integration.weights?.stochastic === 'number' ?
                           Math.max(0, integration.weights.stochastic) : 0.7,

                cellular: typeof integration.weights?.cellular === 'number' ?
                         Math.max(0, integration.weights.cellular) : 0.5,

                gameTheory: typeof integration.weights?.gameTheory === 'number' ?
                           Math.max(0, integration.weights.gameTheory) : 0.3
            },

            // Blend mode
            blendMode: typeof integration.blendMode === 'string' ?
                      integration.blendMode : 'weighted'
        };
    }

    /**
     * Create a default parameter set with all frameworks enabled
     */
    static createDefaultParameters() {
        return this.validateAndNormalize({
            duration: 3.0,

            spatial: {
                G: 0.01,
                undulationRate: 0.3,
                spatialHallucination: 0.5,
                intervals: [0, 3, 7], // Minor triad
                modulo: 12,
                density: 0.8
            },

            stochastic: {
                variance: 0.1,
                distribution: {
                    type: 'gaussian',
                    mean: 0,
                    spread: 1
                },
                frequencyDependence: 0.3
            },

            cellular: {
                rule: 110,
                dimensions: 1,
                iterations: 4,
                interaction: {
                    strength: 0.4,
                    radius: 1
                }
            },

            gameTheory: {
                agentCount: 4,
                strategySpace: 'discrete',
                learningRate: 0.1,
                competitionFactor: 0.5
            },

            integration: {
                weights: {
                    spatialSpectral: 1.0,
                    stochastic: 0.7,
                    cellular: 0.5,
                    gameTheory: 0.3
                },
                blendMode: 'weighted'
            }
        });
    }

    /**
     * Create a parameter preset for a specific style
     */
    static createPreset(presetName) {
        switch (presetName.toLowerCase()) {
            case 'harmonic':
                return this.validateAndNormalize({
                    spatial: {
                        intervals: [0, 4, 7, 12], // Major triad with octave
                        density: 0.9,
                        undulationRate: 0.2
                    },
                    stochastic: {
                        variance: 0.05
                    },
                    integration: {
                        weights: {
                            spatialSpectral: 1.0,
                            stochastic: 0.3,
                            cellular: 0.2,
                            gameTheory: 0.1
                        }
                    }
                });

            case 'chaotic':
                return this.validateAndNormalize({
                    spatial: {
                        spatialHallucination: 0.8,
                        undulationRate: 0.7
                    },
                    stochastic: {
                        variance: 0.3,
                        distribution: {
                            type: 'cauchy'
                        }
                    },
                    cellular: {
                        rule: 30,
                        interaction: {
                            strength: 0.7
                        }
                    },
                    integration: {
                        weights: {
                            spatialSpectral: 0.7,
                            stochastic: 1.0,
                            cellular: 0.8,
                            gameTheory: 0.5
                        }
                    }
                });

            case 'evolving':
                return this.validateAndNormalize({
                    spatial: {
                        undulationRate: 0.8
                    },
                    cellular: {
                        rule: 110,
                        iterations: 8
                    },
                    gameTheory: {
                        learningRate: 0.3
                    },
                    integration: {
                        weights: {
                            spatialSpectral: 0.6,
                            stochastic: 0.5,
                            cellular: 1.0,
                            gameTheory: 0.7
                        }
                    }
                });

            case 'minimal':
                return this.validateAndNormalize({
                    spatial: {
                        intervals: [0, 7, 12], // Perfect fifth and octave
                        density: 0.5
                    },
                    stochastic: {
                        variance: 0.05
                    },
                    integration: {
                        weights: {
                            spatialSpectral: 1.0,
                            stochastic: 0.2,
                            cellular: 0.0,
                            gameTheory: 0.0
                        }
                    }
                });

            default:
                return this.createDefaultParameters();
        }
    }
}

module.exports = UnifiedParameterSpace;
