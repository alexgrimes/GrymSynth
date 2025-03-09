/**
 * Preset Library for XenakisLDM
 *
 * This module provides a library of presets that demonstrate different combinations
 * of musical concepts and parameters across frameworks, showcasing the system's capabilities.
 * Each preset is designed to represent a specific musical aesthetic or transformation approach.
 */

const MusicalConceptMapper = require('./musical-concept-mapper');
const UnifiedParameterSpace = require('./unified-parameter-space');

class PresetLibrary {
    /**
     * Create a new Preset Library
     *
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            debug: false,
            ...config
        };

        this.mapper = new MusicalConceptMapper();

        // Initialize preset definitions
        this.presets = {
            // Presets based on musical aesthetics
            'crystalline': {
                description: 'Clear, transparent textures with precise spectral relationships',
                tags: ['bright', 'clear', 'precise', 'transparent'],
                musicalStyle: 'Ambient, Minimalist, Contemporary Classical',
                concepts: {
                    'harmonic density': 0.3,
                    'timbral brightness': 0.8,
                    'spectral space': 0.7,
                    'grain density': 0.2,
                    'grain duration': 0.7,
                    'aural mimetic balance': 0.2
                }
            },

            'textural-clouds': {
                description: 'Dense, evolving textures with granular characteristics',
                tags: ['dense', 'evolving', 'granular', 'atmospheric'],
                musicalStyle: 'Ambient, Drone, Experimental',
                concepts: {
                    'textural complexity': 0.8,
                    'grain density': 0.9,
                    'grain duration': 0.2,
                    'grain distribution': 0.7,
                    'spectral space': 0.6,
                    'dynamic evolution': 0.7
                }
            },

            'spectral-flux': {
                description: 'Continuously morphing spectral content with fluid motion',
                tags: ['morphing', 'fluid', 'spectral', 'motion'],
                musicalStyle: 'Spectral Music, Electroacoustic',
                concepts: {
                    'spectral motion': 0.8,
                    'dynamic evolution': 0.9,
                    'spectral space': 0.7,
                    'gesture texture balance': 0.4,
                    'contextual discourse': 0.6
                }
            },

            'rhythmic-chaos': {
                description: 'Complex, unpredictable rhythmic patterns with emergent structures',
                tags: ['rhythmic', 'complex', 'unpredictable', 'emergent'],
                musicalStyle: 'IDM, Glitch, Experimental Electronic',
                concepts: {
                    'rhythmic chaos': 0.9,
                    'grain distribution': 0.8,
                    'grain density': 0.7,
                    'grain duration': 0.3,
                    'gesture texture balance': 0.2
                }
            },

            'harmonic-fields': {
                description: 'Rich harmonic structures with spectral resonance',
                tags: ['harmonic', 'resonant', 'spectral', 'rich'],
                musicalStyle: 'Spectral Music, Drone, Modern Classical',
                concepts: {
                    'harmonic density': 0.8,
                    'spectral space': 0.6,
                    'aural mimetic balance': 0.3,
                    'abstract syntax level': 0.4,
                    'timbral brightness': 0.5
                }
            },

            // Presets based on theoretical frameworks
            'smalley-spectromorphology': {
                description: 'Focused on spectral morphology and gestural-textural relationships',
                tags: ['spectral', 'morphological', 'gestural', 'textural'],
                musicalStyle: 'Electroacoustic, Acousmatic',
                concepts: {
                    'spectral motion': 0.8,
                    'spectral space': 0.7,
                    'gesture texture balance': 0.4,
                    'dynamic evolution': 0.6,
                    'contextual discourse': 0.5
                }
            },

            'roads-granular': {
                description: 'Microsound textures based on granular synthesis principles',
                tags: ['granular', 'microsound', 'textural', 'particulate'],
                musicalStyle: 'Microsound, Glitch, Experimental Electronic',
                concepts: {
                    'grain density': 0.8,
                    'grain duration': 0.3,
                    'grain distribution': 0.7,
                    'textural complexity': 0.6,
                    'dynamic evolution': 0.5
                }
            },

            'emmerson-language': {
                description: 'Explores the aural-mimetic discourse and abstract-abstracted syntax',
                tags: ['discourse', 'syntax', 'aural', 'mimetic'],
                musicalStyle: 'Electroacoustic, Sound Art',
                concepts: {
                    'aural mimetic balance': 0.6,
                    'abstract syntax level': 0.7,
                    'contextual discourse': 0.8,
                    'spectral motion': 0.5,
                    'harmonic density': 0.4
                }
            },

            // Presets based on musical genres
            'ambient-spaces': {
                description: 'Expansive, evolving textures with subtle harmonic movement',
                tags: ['ambient', 'atmospheric', 'evolving', 'spacious'],
                musicalStyle: 'Ambient, Drone',
                concepts: {
                    'spectral space': 0.8,
                    'dynamic evolution': 0.4,
                    'grain density': 0.3,
                    'grain duration': 0.8,
                    'harmonic density': 0.5,
                    'textural complexity': 0.6
                }
            },

            'glitch-textures': {
                description: 'Fragmented, granular textures with complex micro-rhythms',
                tags: ['glitch', 'fragmented', 'granular', 'micro-rhythmic'],
                musicalStyle: 'Glitch, IDM, Experimental Electronic',
                concepts: {
                    'grain density': 0.7,
                    'grain duration': 0.2,
                    'grain distribution': 0.9,
                    'rhythmic chaos': 0.8,
                    'textural complexity': 0.7,
                    'abstract syntax level': 0.6
                }
            },

            'spectral-orchestral': {
                description: 'Rich, orchestral textures with spectral harmonic relationships',
                tags: ['orchestral', 'spectral', 'harmonic', 'rich'],
                musicalStyle: 'Spectral Music, Contemporary Classical',
                concepts: {
                    'harmonic density': 0.7,
                    'spectral space': 0.8,
                    'spectral motion': 0.6,
                    'aural mimetic balance': 0.4,
                    'contextual discourse': 0.5,
                    'timbral brightness': 0.6
                }
            }
        };
    }

    /**
     * Get all available preset names
     *
     * @returns {Array} - Array of preset names
     */
    getAvailablePresets() {
        return Object.keys(this.presets);
    }

    /**
     * Get detailed information about a specific preset
     *
     * @param {string} presetName - The name of the preset
     * @returns {Object} - Detailed information about the preset
     * @throws {Error} - If the preset is unknown
     */
    getPresetInfo(presetName) {
        if (!this.presets[presetName]) {
            throw new Error(`Unknown preset: ${presetName}`);
        }

        return {
            name: presetName,
            ...this.presets[presetName]
        };
    }

    /**
     * Get parameters for a specific preset
     *
     * @param {string} presetName - The name of the preset
     * @returns {Object} - Parameters for the preset
     * @throws {Error} - If the preset is unknown
     */
    getPresetParameters(presetName) {
        if (!this.presets[presetName]) {
            throw new Error(`Unknown preset: ${presetName}`);
        }

        // Map musical concepts to parameters
        const concepts = this.presets[presetName].concepts;
        const mappedParams = this.mapper.mapMultipleConcepts(concepts);

        // Get default parameters
        const defaultParams = UnifiedParameterSpace.createDefaultParameters();

        // Merge mapped parameters with defaults
        const mergedParams = { ...defaultParams };
        Object.entries(mappedParams).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                mergedParams[key] = { ...mergedParams[key], ...value };
            } else {
                mergedParams[key] = value;
            }
        });

        // Validate and normalize parameters
        return UnifiedParameterSpace.validateAndNormalize(mergedParams);
    }

    /**
     * Get presets by tag
     *
     * @param {string} tag - The tag to search for
     * @returns {Array} - Array of preset names that match the tag
     */
    getPresetsByTag(tag) {
        return Object.entries(this.presets)
            .filter(([_, preset]) => preset.tags.includes(tag.toLowerCase()))
            .map(([name, _]) => name);
    }

    /**
     * Get presets by musical style
     *
     * @param {string} style - The musical style to search for
     * @returns {Array} - Array of preset names that match the style
     */
    getPresetsByStyle(style) {
        return Object.entries(this.presets)
            .filter(([_, preset]) => preset.musicalStyle.toLowerCase().includes(style.toLowerCase()))
            .map(([name, _]) => name);
    }

    /**
     * Create a custom preset from musical concepts
     *
     * @param {string} name - The name for the custom preset
     * @param {Object} concepts - Object with concept names as keys and values (0-1)
     * @param {Object} metadata - Additional metadata for the preset (description, tags, musicalStyle)
     * @returns {Object} - The created preset
     */
    createCustomPreset(name, concepts, metadata = {}) {
        if (this.presets[name]) {
            throw new Error(`Preset already exists: ${name}`);
        }

        // Create the new preset
        this.presets[name] = {
            description: metadata.description || 'Custom preset',
            tags: metadata.tags || ['custom'],
            musicalStyle: metadata.musicalStyle || 'Custom',
            concepts
        };

        return this.getPresetInfo(name);
    }
}

module.exports = PresetLibrary;
