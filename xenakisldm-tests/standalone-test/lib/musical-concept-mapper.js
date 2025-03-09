/**
 * Musical Concept Mapper for XenakisLDM
 *
 * This module provides a mapping system that translates high-level musical concepts
 * to low-level mathematical parameters, making the system more accessible to musicians.
 *
 * The mapper incorporates several important theoretical frameworks:
 *
 * 1. Denis Smalley's Spectromorphology - A framework for describing and analyzing
 *    sound materials and structures in terms of spectral and morphological thinking.
 *    Concepts like gesture, motion, growth, texture, and spectral space are mapped
 *    to mathematical parameters.
 *
 * 2. Curtis Roads' Granular Synthesis Research - Concepts from microsound and
 *    granular synthesis are incorporated, including grain density, duration,
 *    and distribution, mapped to appropriate mathematical parameters.
 *
 * 3. Simon Emmerson's Language Grid - The distinction between aural and mimetic
 *    discourse, and abstract and abstracted syntax are incorporated into the
 *    mapping system to provide a contextual understanding of the transformations.
 */

class MusicalConceptMapper {
    /**
     * Create a new Musical Concept Mapper
     *
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            debug: false,
            visualizationEnabled: true,
            ...config
        };

        // Initialize concept mappings
        this.conceptMappings = {
            // Harmonic density - affects spatial density and intervals
            "harmonic density": [
                {
                    target: "spatial.density",
                    mapping: value => Math.pow(value, 1.5), // Non-linear mapping for more intuitive control
                    description: "Controls the density of spectral transformations"
                },
                {
                    target: "spatial.intervals",
                    mapping: value => {
                        // Dense harmonics use more intervals
                        if (value < 0.3) return [0, 7, 12]; // Open (fifth + octave)
                        if (value < 0.6) return [0, 4, 7, 12]; // Major (triad + octave)
                        if (value < 0.8) return [0, 3, 7, 10, 12]; // Seventh chord + octave
                        return [0, 2, 3, 5, 7, 8, 10, 12]; // Dense (chromatic clusters)
                    },
                    description: "Determines the harmonic intervals used in the transformation"
                }
            ],

            // Textural complexity - affects stochastic variance and cellular automata rules
            "textural complexity": [
                {
                    target: "stochastic.variance",
                    mapping: value => value * 0.3, // Linear mapping with scaling
                    description: "Controls the amount of randomness in the texture"
                },
                {
                    target: "cellular.rule",
                    mapping: value => {
                        // Different CA rules create different textural patterns
                        if (value < 0.25) return 90; // Simple, regular patterns
                        if (value < 0.5) return 30; // More complex patterns
                        if (value < 0.75) return 110; // Complex but structured patterns
                        return 184; // Very complex patterns
                    },
                    description: "Determines the cellular automata rule used for texture generation"
                }
            ],

            // Rhythmic chaos - affects game theory competition and cellular iterations
            "rhythmic chaos": [
                {
                    target: "gameTheory.competitionFactor",
                    mapping: value => value * 0.8 + 0.2, // Range from 0.2 to 1.0
                    description: "Controls the level of competition between frequency bands"
                },
                {
                    target: "cellular.iterations",
                    mapping: value => Math.floor(value * 7) + 1, // 1 to 8 iterations
                    description: "Determines how many iterations of cellular automata are applied"
                }
            ],

            // Timbral brightness - affects frequency pull and stochastic frequency dependence
            "timbral brightness": [
                {
                    target: "spatial.frequencyPull",
                    mapping: value => {
                        // Non-linear mapping for more intuitive control
                        // Higher values create more brightness by pulling frequencies upward
                        return Math.pow(value, 2) * 0.2;
                    },
                    description: "Controls how much frequencies are shifted upward"
                },
                {
                    target: "stochastic.frequencyDependence",
                    mapping: value => value * 0.5 + 0.1, // Range from 0.1 to 0.6
                    description: "Determines how much the stochastic processes depend on frequency"
                }
            ],

            // Dynamic evolution - affects undulation rate and evolution parameters
            "dynamic evolution": [
                {
                    target: "spatial.undulationRate",
                    mapping: value => value * 0.8, // Linear mapping with scaling
                    description: "Controls the rate of temporal variation in field strength"
                },
                {
                    target: "integration.weights.cellular",
                    mapping: value => value * 0.8, // Linear mapping with scaling
                    description: "Increases the influence of cellular automata for more evolution"
                },
                {
                    target: "integration.weights.gameTheory",
                    mapping: value => value * 0.6, // Linear mapping with scaling
                    description: "Increases the influence of game theory for more evolution"
                }
            ],

            // ---- DENIS SMALLEY'S SPECTROMORPHOLOGY CONCEPTS ----

            // Spectral motion - based on Smalley's motion typology
            "spectral motion": [
                {
                    target: "spatial.undulationRate",
                    mapping: value => value * 0.9, // Higher values create more dynamic motion
                    description: "Controls the rate and type of spectral motion (unidirectional, reciprocal, cyclic/centric)"
                },
                {
                    target: "stochastic.distribution.type",
                    mapping: value => {
                        // Different distribution types create different motion characteristics
                        if (value < 0.25) return "uniform"; // Flat, stable motion
                        if (value < 0.5) return "gaussian"; // Balanced, centered motion
                        if (value < 0.75) return "exponential"; // Directional motion
                        return "cauchy"; // Extreme, unpredictable motion
                    },
                    description: "Determines the statistical distribution affecting spectral motion"
                },
                {
                    target: "spatial.phaseInfluence",
                    mapping: value => value * 0.4, // Controls phase relationships
                    description: "Influences the phase coherence in spectral motion"
                }
            ],

            // Spectral space - based on Smalley's spectral space concept
            "spectral space": [
                {
                    target: "spatial.spectral.minFreq",
                    mapping: value => 20 + (1 - value) * 980, // 20Hz to 1000Hz
                    description: "Sets the lower boundary of the spectral space"
                },
                {
                    target: "spatial.spectral.maxFreq",
                    mapping: value => 1000 + value * 19000, // 1000Hz to 20000Hz
                    description: "Sets the upper boundary of the spectral space"
                },
                {
                    target: "spatial.fields",
                    mapping: value => {
                        // Create spectral fields based on Smalley's spectral space concepts
                        const fields = [];
                        // Number of fields increases with value
                        const fieldCount = Math.floor(value * 5) + 1;

                        for (let i = 0; i < fieldCount; i++) {
                            const position = i / (fieldCount - 1 || 1);
                            fields.push({
                                type: "pattern",
                                center: 100 + position * 10000, // Distribute across frequency range
                                bandwidth: 500 + value * 1500, // Wider bandwidth with higher values
                                strength: 0.5 + value * 0.5, // Stronger fields with higher values
                                modulation: value * 0.3 // More modulation with higher values
                            });
                        }

                        return fields;
                    },
                    description: "Creates spectral fields that define the spectral space"
                }
            ],

            // Gesture-texture continuum - based on Smalley's gesture-texture continuum
            "gesture texture balance": [
                {
                    target: "gameTheory.competitionFactor",
                    mapping: value => value, // Direct mapping
                    description: "Controls the balance between gestural (event-oriented) and textural (continuous) behavior"
                },
                {
                    target: "stochastic.variance",
                    mapping: value => (1 - value) * 0.3, // Inverse relationship - less variance for more gesture
                    description: "Affects the stochastic variance to create more gestural or textural behavior"
                },
                {
                    target: "cellular.iterations",
                    mapping: value => Math.floor((1 - value) * 7) + 1, // More iterations for textural, fewer for gestural
                    description: "Controls cellular automata iterations to support gesture-texture balance"
                }
            ],

            // ---- CURTIS ROADS' GRANULAR SYNTHESIS CONCEPTS ----

            // Grain density - based on Roads' granular synthesis research
            "grain density": [
                {
                    target: "spatial.density",
                    mapping: value => Math.pow(value, 1.2), // Non-linear mapping
                    description: "Controls the density of spectral grains"
                },
                {
                    target: "stochastic.variance",
                    mapping: value => (1 - Math.sqrt(value)) * 0.3, // Inverse non-linear relationship
                    description: "Affects the variance between grains - higher density means more consistent grains"
                },
                {
                    target: "cellular.rule",
                    mapping: value => {
                        // Different CA rules create different grain patterns
                        if (value < 0.2) return 30; // Sparse, chaotic grains
                        if (value < 0.4) return 90; // Regular, sparse grains
                        if (value < 0.6) return 110; // Medium density, structured grains
                        if (value < 0.8) return 184; // Dense, regular grains
                        return 225; // Very dense, uniform grains
                    },
                    description: "Determines the cellular automata rule affecting grain patterns"
                }
            ],

            // Grain duration - based on Roads' microsound time scales
            "grain duration": [
                {
                    target: "spatial.G",
                    mapping: value => 0.001 + (1 - value) * 0.099, // Inverse mapping - smaller G for longer grains
                    description: "Controls the effective duration of spectral grains through gravitational constant"
                },
                {
                    target: "stochastic.frequencyModulation",
                    mapping: value => 100 + (1 - value) * 1900, // Inverse mapping
                    description: "Affects the frequency modulation rate - related to grain duration"
                }
            ],

            // Grain distribution - based on Roads' asynchronous granular synthesis
            "grain distribution": [
                {
                    target: "stochastic.distribution.type",
                    mapping: value => {
                        // Different distribution types for different grain distributions
                        if (value < 0.25) return "uniform"; // Even distribution
                        if (value < 0.5) return "gaussian"; // Centered, normal distribution
                        if (value < 0.75) return "exponential"; // Exponential distribution
                        return "cauchy"; // Heavy-tailed distribution
                    },
                    description: "Determines the statistical distribution of grains"
                },
                {
                    target: "stochastic.distribution.spread",
                    mapping: value => 0.5 + value * 2.5, // Range from 0.5 to 3.0
                    description: "Controls the spread parameter of the grain distribution"
                },
                {
                    target: "gameTheory.strategySpace",
                    mapping: value => value < 0.5 ? "discrete" : "continuous",
                    description: "Affects whether grain distribution is discrete or continuous"
                }
            ],

            // ---- SIMON EMMERSON'S LANGUAGE GRID CONCEPTS ----

            // Aural-mimetic discourse balance - based on Emmerson's language grid
            "aural mimetic balance": [
                {
                    target: "spatial.spatialHallucination",
                    mapping: value => value, // Direct mapping
                    description: "Controls the balance between abstract (aural) and concrete (mimetic) sound qualities"
                },
                {
                    target: "integration.weights.spatialSpectral",
                    mapping: value => 0.4 + (1 - value) * 0.6, // Higher for more aural (abstract)
                    description: "Weights the spatial-spectral framework more heavily for aural discourse"
                },
                {
                    target: "integration.weights.stochastic",
                    mapping: value => 0.4 + value * 0.6, // Higher for more mimetic (concrete)
                    description: "Weights the stochastic framework more heavily for mimetic discourse"
                }
            ],

            // Abstract-abstracted syntax - based on Emmerson's language grid
            "abstract syntax level": [
                {
                    target: "integration.blendMode",
                    mapping: value => value < 0.5 ? "weighted" : "multiplicative",
                    description: "Determines how mathematical frameworks are combined - relates to syntax abstraction"
                },
                {
                    target: "integration.weights.gameTheory",
                    mapping: value => value * 0.8, // Higher for more abstracted syntax
                    description: "Weights the game theory framework more heavily for abstracted syntax"
                },
                {
                    target: "integration.weights.cellular",
                    mapping: value => (1 - value) * 0.8, // Higher for more abstract syntax
                    description: "Weights the cellular automata framework more heavily for abstract syntax"
                }
            ],

            // Contextual discourse - based on Emmerson's contextual/dialectic discourse
            "contextual discourse": [
                {
                    target: "spatial.fields",
                    mapping: value => {
                        // Create relationship fields based on contextual discourse level
                        const fields = [];
                        // Number of relationship fields increases with value
                        const fieldCount = Math.floor(value * 3) + 1;

                        for (let i = 0; i < fieldCount; i++) {
                            fields.push({
                                type: "relationship",
                                sourceFreq: 100 + i * 200,
                                targetFreq: 300 + i * 400,
                                bandwidth: 200 + value * 300,
                                strength: 0.3 + value * 0.7,
                                correlation: 0.5 + value * 0.5
                            });
                        }

                        return fields;
                    },
                    description: "Creates relationship fields that define contextual discourse between frequencies"
                },
                {
                    target: "gameTheory.payoffMatrix",
                    mapping: value => {
                        // Create payoff matrix based on contextual discourse level
                        // Higher values create more complex relationships between agents
                        const size = Math.floor(value * 2) + 2; // 2x2 to 4x4 matrix
                        const matrix = [];

                        for (let i = 0; i < size; i++) {
                            matrix[i] = [];
                            for (let j = 0; j < size; j++) {
                                if (i === j) {
                                    // Cooperation payoff
                                    matrix[i][j] = 0.5 + value * 0.5;
                                } else {
                                    // Competition payoff
                                    matrix[i][j] = value * 0.5;
                                }
                            }
                        }

                        return matrix;
                    },
                    description: "Defines the payoff matrix for game theory, affecting contextual relationships"
                }
            ]
        };

        // Initialize visualization data
        this.visualizationData = {};
        this._generateVisualizationData();
    }

    /**
     * Map a musical concept to mathematical parameters
     *
     * @param {string} concept - The musical concept to map
     * @param {number} value - The value of the concept (0-1)
     * @returns {Object} - The mapped parameters
     * @throws {Error} - If the concept is unknown
     */
    mapConcept(concept, value) {
        if (!this.conceptMappings[concept]) {
            throw new Error(`Unknown musical concept: ${concept}`);
        }

        // Ensure value is in the valid range
        value = Math.min(Math.max(value, 0), 1);

        const result = {};
        this.conceptMappings[concept].forEach(mapping => {
            const path = mapping.target.split('.');
            let current = result;

            // Create nested structure
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    current[path[i]] = {};
                }
                current = current[path[i]];
            }

            // Set final value
            current[path[path.length - 1]] = mapping.mapping(value);
        });

        return result;
    }

    /**
     * Map multiple musical concepts simultaneously
     *
     * @param {Object} concepts - Object with concept names as keys and values (0-1)
     * @returns {Object} - The combined mapped parameters
     */
    mapMultipleConcepts(concepts) {
        const result = {};

        // Process each concept
        Object.entries(concepts).forEach(([concept, value]) => {
            try {
                const conceptParams = this.mapConcept(concept, value);
                this._mergeParams(result, conceptParams);
            } catch (error) {
                if (this.config.debug) {
                    console.warn(`Error mapping concept "${concept}": ${error.message}`);
                }
            }
        });

        return result;
    }

    /**
     * Get all available musical concepts
     *
     * @returns {Array} - Array of concept names
     */
    getAvailableConcepts() {
        return Object.keys(this.conceptMappings);
    }

    /**
     * Get detailed information about a specific concept
     *
     * @param {string} concept - The concept name
     * @returns {Object} - Detailed information about the concept
     * @throws {Error} - If the concept is unknown
     */
    getConceptInfo(concept) {
        if (!this.conceptMappings[concept]) {
            throw new Error(`Unknown musical concept: ${concept}`);
        }

        return {
            name: concept,
            parameters: this.conceptMappings[concept].map(mapping => ({
                target: mapping.target,
                description: mapping.description
            })),
            visualizationData: this.visualizationData[concept]
        };
    }

    /**
     * Get visualization data for a concept
     *
     * @param {string} concept - The concept name
     * @returns {Object} - Visualization data for the concept
     * @throws {Error} - If the concept is unknown or visualization is disabled
     */
    getVisualizationData(concept) {
        if (!this.config.visualizationEnabled) {
            throw new Error('Visualization is disabled');
        }

        if (!this.visualizationData[concept]) {
            throw new Error(`No visualization data for concept: ${concept}`);
        }

        return this.visualizationData[concept];
    }

    /**
     * Generate visualization data for all concepts
     *
     * @private
     */
    _generateVisualizationData() {
        if (!this.config.visualizationEnabled) {
            return;
        }

        // Generate visualization data for each concept
        Object.keys(this.conceptMappings).forEach(concept => {
            const samples = 11; // 0.0, 0.1, 0.2, ..., 1.0
            const samplePoints = Array.from({ length: samples }, (_, i) => i / (samples - 1));

            const mappingResults = samplePoints.map(value => {
                const result = {};

                // Map the concept at this value
                this.conceptMappings[concept].forEach(mapping => {
                    const path = mapping.target.split('.');
                    let current = result;

                    // Create nested structure
                    for (let i = 0; i < path.length - 1; i++) {
                        if (!current[path[i]]) {
                            current[path[i]] = {};
                        }
                        current = current[path[i]];
                    }

                    // Set final value
                    const mappedValue = mapping.mapping(value);
                    current[path[path.length - 1]] = mappedValue;

                    // Store the raw mapping for visualization
                    if (!result._raw) {
                        result._raw = {};
                    }
                    result._raw[mapping.target] = mappedValue;
                });

                return result;
            });

            // Store the visualization data
            this.visualizationData[concept] = {
                samplePoints,
                mappingResults
            };
        });
    }

    /**
     * Merge parameter objects, handling nested structures
     *
     * @param {Object} target - The target object to merge into
     * @param {Object} source - The source object to merge from
     * @private
     */
    _mergeParams(target, source) {
        Object.keys(source).forEach(key => {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                // Handle nested objects
                if (!target[key]) {
                    target[key] = {};
                }
                this._mergeParams(target[key], source[key]);
            } else {
                // Handle primitive values and arrays
                target[key] = source[key];
            }
        });
    }

    /**
     * Create a simple visualization of the mapping between a musical concept and parameters
     *
     * @param {string} concept - The musical concept to visualize
     * @param {Object} options - Visualization options
     * @returns {string} - ASCII visualization of the mapping
     */
    createSimpleVisualization(concept, options = {}) {
        if (!this.conceptMappings[concept]) {
            throw new Error(`Unknown musical concept: ${concept}`);
        }

        const width = options.width || 60;
        const height = options.height || 10;

        let visualization = `\n=== ${concept.toUpperCase()} MAPPING ===\n\n`;

        // For each parameter mapping
        this.conceptMappings[concept].forEach(mapping => {
            visualization += `${mapping.target} (${mapping.description}):\n`;

            // Create a simple ASCII graph
            const samples = width;
            const samplePoints = Array.from({ length: samples }, (_, i) => i / (samples - 1));

            // Get mapped values
            let mappedValues = samplePoints.map(value => {
                const result = mapping.mapping(value);
                if (Array.isArray(result)) {
                    return result.length; // For arrays, show the length
                }
                return result;
            });

            // Normalize values for display
            const min = Math.min(...mappedValues);
            const max = Math.max(...mappedValues);
            const range = max - min;

            if (range > 0) {
                mappedValues = mappedValues.map(v => Math.floor((v - min) / range * (height - 1)));
            } else {
                mappedValues = mappedValues.map(() => 0);
            }

            // Create the graph
            for (let y = height - 1; y >= 0; y--) {
                let line = '';
                for (let x = 0; x < samples; x++) {
                    if (mappedValues[x] >= y) {
                        line += '█';
                    } else {
                        line += ' ';
                    }
                }
                visualization += `${line}\n`;
            }

            // Add axis
            let axis = '';
            for (let x = 0; x < samples; x++) {
                if (x === 0 || x === samples - 1 || x === Math.floor(samples / 2)) {
                    axis += '|';
                } else {
                    axis += '-';
                }
            }
            visualization += `${axis}\n`;
            visualization += `0${' '.repeat(Math.floor(samples / 2) - 1)}0.5${' '.repeat(Math.floor(samples / 2) - 1)}1\n\n`;
        });

        return visualization;
    }
}

module.exports = MusicalConceptMapper;
