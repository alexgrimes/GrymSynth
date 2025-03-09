/**
 * Integrated Pipeline for XenakisLDM
 *
 * This pipeline integrates all mathematical frameworks:
 * - Spatial-spectral sieve
 * - Stochastic processes
 * - Cellular automata
 * - Game theory
 */

const AudioLDMMock = require('../mocks/audioldm-service');
const { XenakisPromptEnhancer } = require('../tests/prompt-enhancement.test');
const IntegratedSpectralSieve = require('./integrated-spectral-sieve');
const UnifiedParameterSpace = require('./unified-parameter-space');
const Logger = require('./logger');
const SpectralFieldEvolution = require('./spectral-field-evolution');

class IntegratedPipeline {
    constructor(config = {}) {
        this.config = {
            debug: true,
            enableVisualization: true,
            ...config
        };

        // Initialize components
        this.audioldm = new AudioLDMMock(config.audioldm);
        this.enhancer = new XenakisPromptEnhancer();
        this.spectralSieve = new IntegratedSpectralSieve({
            ...config.sieve,
            visualization: this.config.enableVisualization
        });

        // Initialize field evolution if available
        try {
            this.fieldEvolution = new SpectralFieldEvolution(config.evolution);
        } catch (error) {
            Logger.info('Field evolution not available:', error.message);
            this.fieldEvolution = null;
        }
    }

    /**
     * Generate audio using the integrated pipeline
     *
     * @param {string} basePrompt - Base text prompt
     * @param {Object} parameters - Raw parameters
     * @returns {Object} - Generation result
     */
    async generate(basePrompt, parameters) {
        try {
            Logger.section('Integrated XenakisLDM Pipeline');

            // Validate and normalize parameters using unified parameter space
            const unifiedParams = UnifiedParameterSpace.validateAndNormalize(parameters);
            Logger.info('Unified parameters:', unifiedParams);

            // Step 1: Enhance prompt with mathematical parameters
            const enhancedPrompt = this._enhancePrompt(basePrompt, unifiedParams);
            Logger.info('Enhanced prompt:', enhancedPrompt);

            // Step 2: Generate audio using enhanced prompt
            Logger.info('Generating base audio...');
            const rawAudio = await this.audioldm.generateAudio(enhancedPrompt, {
                duration: unifiedParams.duration
            });

            if (!rawAudio || !rawAudio.getChannelData) {
                throw new Error('Invalid audio generated by AudioLDM');
            }

            // Step 3: Apply integrated mathematical transformations
            Logger.info('Applying integrated mathematical transformations...');
            const processedAudio = await this._applyIntegratedTransformations(rawAudio, unifiedParams);

            return {
                prompt: enhancedPrompt,
                rawAudio,
                processedAudio,
                parameters: unifiedParams
            };
        } catch (error) {
            Logger.info('Pipeline error:', error.message);
            throw error;
        }
    }

    /**
     * Enhance the prompt with mathematical parameters
     */
    _enhancePrompt(basePrompt, unifiedParams) {
        // Extract relevant parameters for prompt enhancement
        const enhancementParams = {
            // Spatial parameters
            spatial: unifiedParams.spatial ? {
                density: unifiedParams.spatial.density,
                intervals: unifiedParams.spatial.intervals,
                spatialHallucination: unifiedParams.spatial.spatialHallucination
            } : null,

            // Stochastic parameters
            stochastic: unifiedParams.stochastic ? {
                variance: unifiedParams.stochastic.variance,
                distribution: unifiedParams.stochastic.distribution?.type
            } : null,

            // Cellular parameters
            cellular: unifiedParams.cellular ? {
                rule: unifiedParams.cellular.rule,
                dimensions: unifiedParams.cellular.dimensions
            } : null,

            // Game theory parameters
            gameTheory: unifiedParams.gameTheory ? {
                competitionFactor: unifiedParams.gameTheory.competitionFactor
            } : null
        };

        return this.enhancer.enhance(basePrompt, enhancementParams);
    }

    /**
     * Apply integrated mathematical transformations
     */
    async _applyIntegratedTransformations(buffer, unifiedParams) {
        try {
            let audio = this._cloneAudioBuffer(buffer);

            // Apply integrated spectral sieve transformation
            Logger.info('Applying integrated spectral transformation...');
            audio = await this.spectralSieve.transform(audio, unifiedParams);

            if (!audio || !audio.getChannelData) {
                throw new Error('Invalid audio after integrated transformation');
            }

            // Apply field evolution if available and enabled
            if (this.fieldEvolution && unifiedParams.spatial?.undulationRate > 0) {
                Logger.info('Applying field evolution...');
                audio = this.fieldEvolution.evolveSync(audio, unifiedParams);

                if (!audio || !audio.getChannelData) {
                    throw new Error('Invalid audio after field evolution');
                }
            }

            return audio;
        } catch (error) {
            Logger.info('Transformation error:', error.message);
            throw error;
        }
    }

    /**
     * Process audio directly using the mathematical frameworks
     *
     * @param {Float32Array|AudioBuffer} audioData - Raw audio data to process
     * @param {Object} parameters - Optional parameters to override the default ones
     * @returns {Float32Array|AudioBuffer} - Processed audio data
     */
    process(audioData, parameters = {}) {
        Logger.section('Processing Audio with XenakisLDM Pipeline');

        try {
            // Validate and normalize parameters
            const unifiedParams = parameters.spatial || parameters.stochastic || parameters.cellular || parameters.gameTheory ?
                UnifiedParameterSpace.validateAndNormalize(parameters) :
                this.presetParams || UnifiedParameterSpace.createDefaultParameters();

            Logger.info('Using parameters:', unifiedParams);

            // Convert Float32Array to AudioBuffer-like object if needed
            let audioBuffer;
            if (audioData instanceof Float32Array) {
                audioBuffer = {
                    sampleRate: 44100, // Default sample rate
                    numberOfChannels: 1,
                    duration: audioData.length / 44100,
                    length: audioData.length,
                    _channels: [audioData],
                    getChannelData: function(channel) {
                        if (channel >= this.numberOfChannels) {
                            throw new Error('Invalid channel index');
                        }
                        return this._channels[channel];
                    }
                };
            } else {
                audioBuffer = audioData;
            }

            // Apply integrated transformations synchronously
            Logger.info('Applying mathematical transformations...');
            const processedAudio = this._applyIntegratedTransformationsSync(audioBuffer, unifiedParams);

            // Return in the same format as input
            if (audioData instanceof Float32Array && processedAudio && processedAudio.getChannelData) {
                return processedAudio.getChannelData(0);
            }

            return processedAudio;
        } catch (error) {
            Logger.error('Processing error:', error.message);
            throw error;
        }
    }

    /**
     * Synchronous version of _applyIntegratedTransformations
     */
    _applyIntegratedTransformationsSync(buffer, unifiedParams) {
        try {
            let audio = this._cloneAudioBuffer(buffer);

            // Apply integrated spectral sieve transformation
            Logger.info('Applying integrated spectral transformation...');
            // Use transformSync instead of transform if available
            if (typeof this.spectralSieve.transformSync === 'function') {
                audio = this.spectralSieve.transformSync(audio, unifiedParams);
            } else {
                // Fallback to using transform as synchronous
                audio = this.spectralSieve.transform(audio, unifiedParams);
            }

            if (!audio || !audio.getChannelData) {
                throw new Error('Invalid audio after integrated transformation');
            }

            // Apply field evolution if available and enabled
            if (this.fieldEvolution && unifiedParams.spatial?.undulationRate > 0) {
                Logger.info('Applying field evolution...');
                // Use evolveSync instead of evolve if available
                if (typeof this.fieldEvolution.evolveSync === 'function') {
                    audio = this.fieldEvolution.evolveSync(audio, unifiedParams);
                } else {
                    // Fallback to using evolve as synchronous
                    audio = this.fieldEvolution.evolve(audio, unifiedParams);
                }

                if (!audio || !audio.getChannelData) {
                    throw new Error('Invalid audio after field evolution');
                }
            }

            return audio;
        } catch (error) {
            Logger.error('Transformation error:', error.message);
            throw error;
        }
    }

    /**
     * Clone an audio buffer
     */
    _cloneAudioBuffer(buffer) {
        if (!buffer || typeof buffer.numberOfChannels !== 'number') {
            throw new Error('Invalid audio buffer');
        }

        const result = {
            sampleRate: buffer.sampleRate,
            numberOfChannels: buffer.numberOfChannels,
            duration: buffer.duration,
            length: buffer.length,
            _channels: []
        };

        for (let i = 0; i < buffer.numberOfChannels; i++) {
            const channelData = buffer.getChannelData(i);
            if (!channelData || !channelData.length) {
                throw new Error(`Invalid channel data for channel ${i}`);
            }
            result._channels[i] = new Float32Array(channelData);
        }

        result.getChannelData = function(channel) {
            if (channel >= this.numberOfChannels) {
                throw new Error('Invalid channel index');
            }
            return this._channels[channel];
        };

        return result;
    }

    /**
     * Create a preset pipeline with specific configuration
     */
    static createPreset(presetName, config = {}) {
        // Create preset parameters
        const presetParams = UnifiedParameterSpace.createPreset(presetName);

        // Create pipeline with preset-specific configuration
        const pipelineConfig = { ...config };

        switch (presetName.toLowerCase()) {
            case 'harmonic':
                pipelineConfig.sieve = {
                    ...pipelineConfig.sieve,
                    resolution: 4096,
                    overlapFactor: 8 // Higher overlap for smoother harmonic transitions
                };
                break;

            case 'chaotic':
                pipelineConfig.sieve = {
                    ...pipelineConfig.sieve,
                    resolution: 2048,
                    overlapFactor: 4
                };
                break;

            case 'evolving':
                pipelineConfig.evolution = {
                    ...pipelineConfig.evolution,
                    evolutionRate: 0.8,
                    complexityGrowth: 0.6
                };
                break;

            case 'minimal':
                pipelineConfig.sieve = {
                    ...pipelineConfig.sieve,
                    resolution: 2048,
                    overlapFactor: 4
                };
                break;
        }

        // Create and return the pipeline
        const pipeline = new IntegratedPipeline(pipelineConfig);

        // Store preset parameters for later use
        pipeline.presetParams = presetParams;

        return pipeline;
    }
}

// Create a stub for SpectralFieldEvolution if not available
if (typeof SpectralFieldEvolution === 'undefined') {
    class SpectralFieldEvolution {
        constructor(config = {}) {
            throw new Error('SpectralFieldEvolution not implemented');
        }

        async evolve(audio, params) {
            return audio;
        }
    }

    global.SpectralFieldEvolution = SpectralFieldEvolution;
}

module.exports = IntegratedPipeline;
