/**
 * Spectral Field Evolution for XenakisLDM
 *
 * This module handles the evolution of spectral fields over time,
 * creating dynamic transformations that change throughout the audio.
 */

const Logger = require('./logger');
const SpectralVisualizer = require('./spectral-visualizer');

class SpectralFieldEvolution {
    constructor(config = {}) {
        this.config = {
            evolutionRate: 0.5,      // Base rate of evolution
            complexityGrowth: 0.3,    // How complexity increases over time
            evolutionTypes: ['sine', 'triangle', 'exponential'], // Available evolution patterns
            visualization: true,      // Enable visualization
            ...config
        };

        // Initialize evolution patterns
        this.patterns = this._initializePatterns();

        // Phase tracking for each pattern
        this.phases = new Map();
    }

    /**
     * Evolve audio using dynamic field evolution
     *
     * @param {AudioBuffer} buffer - Input audio buffer
     * @param {Object} params - Unified parameters
     * @returns {AudioBuffer} - Evolved audio buffer
     */
    async evolve(buffer, params) {
        Logger.section('Spectral Field Evolution');

        // Skip evolution if parameters don't support it
        if (!params.spatial || params.spatial.undulationRate <= 0) {
            Logger.info('Field evolution skipped (undulationRate <= 0)');
            return buffer;
        }

        // Clone the buffer for processing
        const result = this._cloneAudioBuffer(buffer);
        const evolutionRate = params.spatial.undulationRate * this.config.evolutionRate;

        Logger.info(`Applying field evolution (rate: ${evolutionRate.toFixed(2)})`);

        // Process each channel
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const inputData = buffer.getChannelData(channel);
            const outputData = result.getChannelData(channel);

            // Process in segments
            const segmentSize = Math.floor(buffer.sampleRate * 0.1); // 100ms segments
            const segmentCount = Math.ceil(inputData.length / segmentSize);

            Logger.info(`Processing channel ${channel} in ${segmentCount} segments`);

            for (let segment = 0; segment < segmentCount; segment++) {
                const start = segment * segmentSize;
                const end = Math.min(start + segmentSize, inputData.length);

                // Calculate evolution parameters for this segment
                const segmentPosition = segment / segmentCount;
                const evolutionParams = this._calculateEvolutionParams(
                    segmentPosition,
                    params,
                    evolutionRate
                );

                // Apply evolution to this segment
                this._evolveSegment(
                    inputData,
                    outputData,
                    start,
                    end,
                    evolutionParams
                );

                // Visualize evolution at key points
                if (this.config.visualization &&
                    (segment === Math.floor(segmentCount * 0.25) ||
                     segment === Math.floor(segmentCount * 0.75))) {
                    this._visualizeEvolution(
                        segment,
                        segmentPosition,
                        evolutionParams
                    );
                }
            }
        }

        return result;
    }

    /**
     * Evolve audio using dynamic field evolution (synchronous version)
     *
     * @param {AudioBuffer} buffer - Input audio buffer
     * @param {Object} params - Unified parameters
     * @returns {AudioBuffer} - Evolved audio buffer
     */
    evolveSync(buffer, params) {
        Logger.section('Spectral Field Evolution');

        // Skip evolution if parameters don't support it
        if (!params.spatial || params.spatial.undulationRate <= 0) {
            Logger.info('Field evolution skipped (undulationRate <= 0)');
            return buffer;
        }

        // Clone the buffer for processing
        const result = this._cloneAudioBuffer(buffer);
        const evolutionRate = params.spatial.undulationRate * this.config.evolutionRate;

        Logger.info(`Applying field evolution (rate: ${evolutionRate.toFixed(2)})`);

        try {
            // Process each channel
            for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
                const inputData = buffer.getChannelData(channel);
                const outputData = result.getChannelData(channel);

                // Process in segments
                const segmentSize = Math.floor(buffer.sampleRate * 0.1); // 100ms segments
                const segmentCount = Math.ceil(inputData.length / segmentSize);

                Logger.info(`Processing channel ${channel} in ${segmentCount} segments`);

                for (let segment = 0; segment < segmentCount; segment++) {
                    const start = segment * segmentSize;
                    const end = Math.min(start + segmentSize, inputData.length);

                    // Calculate evolution parameters for this segment
                    const segmentPosition = segment / segmentCount;
                    const evolutionParams = this._calculateEvolutionParams(
                        segmentPosition,
                        params,
                        evolutionRate
                    );

                    // Apply evolution to this segment
                    this._evolveSegment(
                        inputData,
                        outputData,
                        start,
                        end,
                        evolutionParams
                    );
                }
            }

            return result;
        } catch (error) {
            Logger.error(`Error in field evolution: ${error.message}`);
            // Return original buffer in case of error
            return buffer;
        }
    }

    /**
     * Initialize evolution patterns
     */
    _initializePatterns() {
        const patterns = {};

        // Sine wave pattern
        patterns.sine = (phase, params) => {
            return Math.sin(2 * Math.PI * phase) * params.depth;
        };

        // Triangle wave pattern
        patterns.triangle = (phase, params) => {
            const normalizedPhase = phase % 1;
            if (normalizedPhase < 0.25) {
                return normalizedPhase * 4 * params.depth;
            } else if (normalizedPhase < 0.75) {
                return (0.5 - normalizedPhase) * 4 * params.depth;
            } else {
                return (normalizedPhase - 1) * 4 * params.depth;
            }
        };

        // Exponential pattern
        patterns.exponential = (phase, params) => {
            const normalizedPhase = phase % 1;
            if (normalizedPhase < 0.5) {
                return Math.pow(normalizedPhase * 2, params.exponent) * params.depth;
            } else {
                return (1 - Math.pow((normalizedPhase - 0.5) * 2, params.exponent)) * params.depth;
            }
        };

        // Random pattern
        patterns.random = (phase, params) => {
            // Use phase to seed a deterministic but varying result
            const seed = Math.sin(phase * 1000) * 10000;
            return ((Math.sin(seed) + 1) / 2) * params.depth;
        };

        // Chaotic pattern
        patterns.chaotic = (phase, params) => {
            // Simple chaotic map (logistic map)
            let x = 0.5 + Math.sin(phase * 10) * 0.3;
            for (let i = 0; i < 10; i++) {
                x = params.chaosParameter * x * (1 - x);
            }
            return (x * 2 - 1) * params.depth;
        };

        return patterns;
    }

    /**
     * Calculate evolution parameters for a specific segment
     */
    _calculateEvolutionParams(position, params, evolutionRate) {
        // Base evolution parameters
        const evolutionParams = {
            rate: evolutionRate,
            depth: params.spatial?.undulationRate || 0.3,
            complexity: this.config.complexityGrowth * position + 0.1,
            exponent: 2 + position * 2, // For exponential pattern
            chaosParameter: 3.6 + position * 0.4 // For chaotic pattern (3.6-4.0 is chaotic region)
        };

        // Select patterns to use based on position
        const patternCount = Math.max(1, Math.floor(1 + position * 3)); // 1-4 patterns
        evolutionParams.activePatterns = [];

        // Always include sine as the base pattern
        evolutionParams.activePatterns.push({
            type: 'sine',
            weight: 1.0 - position * 0.5, // Reduce sine influence over time
            frequency: 1.0
        });

        // Add complexity with additional patterns
        if (patternCount >= 2) {
            evolutionParams.activePatterns.push({
                type: 'triangle',
                weight: position * 0.4,
                frequency: 2.0 // Twice the frequency
            });
        }

        if (patternCount >= 3) {
            evolutionParams.activePatterns.push({
                type: 'exponential',
                weight: position * 0.3,
                frequency: 0.5 // Half the frequency
            });
        }

        if (patternCount >= 4) {
            evolutionParams.activePatterns.push({
                type: position > 0.7 ? 'chaotic' : 'random',
                weight: position * 0.2,
                frequency: 0.25 // Quarter the frequency
            });
        }

        return evolutionParams;
    }

    /**
     * Evolve a segment of audio
     */
    _evolveSegment(inputData, outputData, start, end, evolutionParams) {
        for (let i = start; i < end; i++) {
            // Calculate the normalized position within the audio (0-1)
            const position = i / inputData.length;

            // Calculate combined evolution factor
            let evolutionFactor = 0;

            evolutionParams.activePatterns.forEach(pattern => {
                // Get or initialize phase for this pattern
                const phaseKey = `${pattern.type}-${pattern.frequency}`;
                if (!this.phases.has(phaseKey)) {
                    this.phases.set(phaseKey, 0);
                }

                // Get current phase
                let phase = this.phases.get(phaseKey);

                // Calculate pattern contribution
                const patternValue = this.patterns[pattern.type](
                    phase,
                    evolutionParams
                );

                // Add weighted contribution
                evolutionFactor += patternValue * pattern.weight;

                // Update phase for next sample
                phase += pattern.frequency * evolutionParams.rate / inputData.length;
                this.phases.set(phaseKey, phase);
            });

            // Apply evolution factor to sample
            outputData[i] = inputData[i] * (1 + evolutionFactor);
        }
    }

    /**
     * Visualize evolution at a specific point
     */
    _visualizeEvolution(segment, position, params) {
        if (!SpectralVisualizer || !SpectralVisualizer.visualizeEvolution) {
            return;
        }

        Logger.info(`\nEvolution at segment ${segment} (position: ${position.toFixed(2)})`);
        Logger.info(`Active patterns: ${params.activePatterns.map(p => p.type).join(', ')}`);

        // Generate evolution curve for visualization
        const points = 100;
        const curve = new Array(points);

        for (let i = 0; i < points; i++) {
            const x = i / points;
            let y = 0;

            params.activePatterns.forEach(pattern => {
                const patternValue = this.patterns[pattern.type](
                    x * pattern.frequency,
                    params
                );
                y += patternValue * pattern.weight;
            });

            curve[i] = { x, y };
        }

        // Visualize the evolution curve
        SpectralVisualizer.visualizeEvolution(
            curve,
            `Evolution at ${(position * 100).toFixed(0)}%`,
            params.activePatterns.map(p => `${p.type} (${p.weight.toFixed(2)})`)
        );
    }

    /**
     * Clone an audio buffer
     */
    _cloneAudioBuffer(buffer) {
        const result = {
            sampleRate: buffer.sampleRate,
            numberOfChannels: buffer.numberOfChannels,
            duration: buffer.duration,
            length: buffer.length,
            _channels: []
        };

        for (let i = 0; i < buffer.numberOfChannels; i++) {
            result._channels[i] = new Float32Array(buffer.getChannelData(i));
        }

        result.getChannelData = function(channel) {
            if (channel >= this.numberOfChannels) {
                throw new Error('Invalid channel index');
            }
            return this._channels[channel];
        };

        return result;
    }
}

module.exports = SpectralFieldEvolution;
