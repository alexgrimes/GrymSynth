/**
 * Integrated Spectral Sieve for XenakisLDM
 *
 * This enhanced spectral sieve integrates multiple mathematical frameworks:
 * - Spatial-spectral gravitational fields
 * - Stochastic processes
 * - Cellular automata
 * - Game theory
 */

const SpatialSpectralAdapter = require('./spatial-spectral-adapter');
const MathematicalFrameworkAdapter = require('./mathematical-framework-adapter');
const Logger = require('./logger');
const SpectralVisualizer = require('./spectral-visualizer');

class IntegratedSpectralSieve {
    constructor(config = {}) {
        this.config = {
            resolution: 4096,    // FFT size
            minFreq: 20,        // Minimum frequency (Hz)
            maxFreq: 20000,     // Maximum frequency (Hz)
            overlapFactor: 4,   // STFT overlap factor
            windowSize: 2048,   // Analysis window size
            visualization: true, // Enable visualization
            ...config
        };

        // Initialize adapters
        this.spatialAdapter = new SpatialSpectralAdapter(config);
        this.mathAdapter = new MathematicalFrameworkAdapter(config.integration);
    }

    /**
     * Transform audio using integrated mathematical frameworks (asynchronous version)
     *
     * @param {AudioBuffer} buffer - Input audio buffer
     * @param {Object} unifiedParams - Unified parameter space
     * @returns {Promise<AudioBuffer>} - Transformed audio buffer
     */
    async transform(buffer, unifiedParams) {
        Logger.section('Integrated Spectral Sieve Transform');

        // Get spectral fields from pattern analysis
        const { fields, globalParams } = await this.spatialAdapter.analyzeAndMap(buffer);
        Logger.info('Generated spectral fields:', {
            count: fields?.length || 0,
            globalParams
        });

        if (!fields || fields.length === 0) {
            Logger.info('No spectral fields generated, returning original audio');
            return this._cloneAudioBuffer(buffer);
        }

        if (this.config.visualization) {
            SpectralVisualizer.visualizeFields(fields, this.config.minFreq, this.config.maxFreq);
        }

        // Apply integrated transformation
        const result = this._cloneAudioBuffer(buffer);

        // Process each channel
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const inputData = buffer.getChannelData(channel);
            const outputData = result.getChannelData(channel);

            // Process in overlapping windows
            const windowSize = Math.min(this.config.windowSize, inputData.length);
            const hopSize = Math.floor(windowSize / this.config.overlapFactor);
            const window = this._createHannWindow(windowSize);

            // Clear output buffer
            outputData.fill(0);

            Logger.info(`\nProcessing channel ${channel}`);
            Logger.info(`Window size: ${windowSize}, Hop size: ${hopSize}`);

            // STFT processing
            for (let start = 0; start < inputData.length; start += hopSize) {
                const end = Math.min(start + windowSize, inputData.length);
                const currentWindow = new Float32Array(windowSize);

                // Copy and window the current frame
                for (let i = 0; i < end - start; i++) {
                    currentWindow[i] = inputData[start + i] * window[i];
                }

                // Transform to frequency domain
                const { frequencies, magnitudes, phases } = this._toSpectral(currentWindow);

                // Apply integrated transformations
                const transformedMags = this._transformMagnitudes(
                    frequencies,
                    magnitudes,
                    phases,
                    fields,
                    globalParams,
                    unifiedParams
                );

                // Visualize mid-point frame transformation
                if (this.config.visualization &&
                    start > inputData.length / 3 &&
                    start < inputData.length / 2) {
                    SpectralVisualizer.visualizeTransformation(
                        frequencies,
                        magnitudes,
                        frequencies,
                        transformedMags
                    );
                }

                // Convert back to time domain
                const transformedChunk = this._toTemporal(transformedMags, phases);

                // Overlap-add
                for (let i = 0; i < windowSize && (start + i) < outputData.length; i++) {
                    outputData[start + i] += transformedChunk[i] * window[i];
                }
            }

            // Normalize output
            const maxAmp = Math.max(...Array.from(outputData).map(Math.abs));
            if (maxAmp > 0) {
                for (let i = 0; i < outputData.length; i++) {
                    outputData[i] /= maxAmp;
                }
            }

            // Final analysis
            if (this.config.visualization) {
                const inputSpectrum = this._analyzeAudio(inputData);
                const outputSpectrum = this._analyzeAudio(outputData);

                Logger.info(`\nChannel ${channel} Final Analysis:`);
                SpectralVisualizer.visualizeTransformation(
                    inputSpectrum.frequencies,
                    inputSpectrum.magnitudes,
                    outputSpectrum.frequencies,
                    outputSpectrum.magnitudes
                );
            }
        }

        return result;
    }

    /**
     * Transform audio using integrated mathematical frameworks (synchronous version)
     *
     * @param {AudioBuffer} buffer - Input audio buffer
     * @param {Object} unifiedParams - Unified parameter space
     * @returns {AudioBuffer} - Transformed audio buffer
     */
    transformSync(buffer, unifiedParams) {
        Logger.section('Integrated Spectral Sieve Transform (Sync)');

        // Get spectral fields from pattern analysis (simplified for sync version)
        const fields = this._analyzeAndMapSync(buffer);
        const globalParams = {
            spectralDensity: unifiedParams.spatial?.density || 0.5,
            temporalEvolution: unifiedParams.spatial?.undulationRate || 0.3,
            structuralStability: unifiedParams.stochastic?.variance ? (1 - unifiedParams.stochastic.variance) : 0.7
        };

        Logger.info('Generated spectral fields:', {
            count: fields?.length || 0,
            globalParams
        });

        if (!fields || fields.length === 0) {
            Logger.info('No spectral fields generated, returning original audio');
            return this._cloneAudioBuffer(buffer);
        }

        if (this.config.visualization) {
            SpectralVisualizer.visualizeFields(fields, this.config.minFreq, this.config.maxFreq);
        }

        // Apply integrated transformation
        const result = this._cloneAudioBuffer(buffer);

        // Process each channel
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const inputData = buffer.getChannelData(channel);
            const outputData = result.getChannelData(channel);

            // Process in overlapping windows
            const windowSize = Math.min(this.config.windowSize, inputData.length);
            const hopSize = Math.floor(windowSize / this.config.overlapFactor);
            const window = this._createHannWindow(windowSize);

            // Clear output buffer
            outputData.fill(0);

            Logger.info(`\nProcessing channel ${channel}`);
            Logger.info(`Window size: ${windowSize}, Hop size: ${hopSize}`);

            // STFT processing
            for (let start = 0; start < inputData.length; start += hopSize) {
                const end = Math.min(start + windowSize, inputData.length);
                const currentWindow = new Float32Array(windowSize);

                // Copy and window the current frame
                for (let i = 0; i < end - start; i++) {
                    currentWindow[i] = inputData[start + i] * window[i];
                }

                // Transform to frequency domain
                const { frequencies, magnitudes, phases } = this._toSpectral(currentWindow);

                // Apply integrated transformations
                const transformedMags = this._transformMagnitudes(
                    frequencies,
                    magnitudes,
                    phases,
                    fields,
                    globalParams,
                    unifiedParams
                );

                // Convert back to time domain
                const transformedChunk = this._toTemporal(transformedMags, phases);

                // Overlap-add
                for (let i = 0; i < windowSize && (start + i) < outputData.length; i++) {
                    outputData[start + i] += transformedChunk[i] * window[i];
                }
            }

            // Normalize output
            const maxAmp = Math.max(...Array.from(outputData).map(Math.abs));
            if (maxAmp > 0) {
                for (let i = 0; i < outputData.length; i++) {
                    outputData[i] /= maxAmp;
                }
            }
        }

        return result;
    }

    /**
     * Analyze and map audio to spectral fields (synchronous version)
     * This is a simplified version of the async analyzeAndMap method
     */
    _analyzeAndMapSync(buffer) {
        // Create some basic spectral fields based on the audio content
        const fields = [];

        // Analyze first channel to get frequency content
        const channelData = buffer.getChannelData(0);
        const { frequencies, magnitudes } = this._analyzeAudio(channelData);

        // Find peaks in the spectrum
        const peaks = this._findPeaks(frequencies, magnitudes);

        // Create fields based on peaks
        for (const peak of peaks) {
            fields.push({
                type: 'pattern',
                center: peak.frequency,
                bandwidth: 200 + Math.random() * 800, // Random bandwidth between 200-1000 Hz
                strength: 0.5 + Math.random() * 0.5,  // Random strength between 0.5-1.0
                modulation: 0.1 + Math.random() * 0.3 // Random modulation between 0.1-0.4
            });
        }

        return fields;
    }

    /**
     * Find peaks in the spectrum
     */
    _findPeaks(frequencies, magnitudes) {
        const peaks = [];
        const threshold = 0.1; // Minimum magnitude to consider as a peak
        const minDistance = 500; // Minimum distance between peaks in Hz

        for (let i = 1; i < magnitudes.length - 1; i++) {
            if (magnitudes[i] > threshold &&
                magnitudes[i] > magnitudes[i-1] &&
                magnitudes[i] > magnitudes[i+1]) {

                // Check if this peak is far enough from existing peaks
                const freq = frequencies[i];
                let isFarEnough = true;

                for (const peak of peaks) {
                    if (Math.abs(peak.frequency - freq) < minDistance) {
                        isFarEnough = false;
                        break;
                    }
                }

                if (isFarEnough) {
                    peaks.push({
                        frequency: freq,
                        magnitude: magnitudes[i]
                    });

                    // Limit to 5 peaks
                    if (peaks.length >= 5) break;
                }
            }
        }

        return peaks;
    }

    /**
     * Transform magnitudes using integrated mathematical frameworks
     */
    _transformMagnitudes(frequencies, magnitudes, phases, fields, globalParams, unifiedParams) {
        const transformed = new Float32Array(magnitudes.length);
        const transformedPhases = new Float32Array(phases.length);

        // Copy original phases
        for (let i = 0; i < phases.length; i++) {
            transformedPhases[i] = phases[i];
        }

        // Apply integrated transformations
        for (let i = 0; i < magnitudes.length; i++) {
            const freq = frequencies[i];
            if (freq < this.config.minFreq || freq > this.config.maxFreq) {
                transformed[i] = magnitudes[i];
                continue;
            }

            // Calculate integrated field effects from all mathematical frameworks
            const effects = this.mathAdapter.integrateFieldEffects(
                freq,
                unifiedParams,
                fields
            );

            // Apply magnitude effect
            transformed[i] = magnitudes[i] * effects.magnitude;

            // Apply phase effect
            transformedPhases[i] = phases[i] + effects.phase;

            // Apply global parameter modulation
            if (globalParams) {
                const densityEffect = 1 + (globalParams.spectralDensity || 0.5) *
                                    Math.sin(2 * Math.PI * freq / 1000);
                const evolutionEffect = 1 + (globalParams.temporalEvolution || 0.5) *
                                      Math.cos(2 * Math.PI * freq / 500);
                const stabilityEffect = Math.pow(globalParams.structuralStability || 0.7, 0.5);

                transformed[i] *= densityEffect * evolutionEffect * stabilityEffect;
            }
        }

        // Apply frequency shifts (requires resampling in frequency domain)
        if (unifiedParams.spatial?.frequencyPull > 0 ||
            unifiedParams.stochastic?.pitchShift > 0 ||
            unifiedParams.gameTheory?.frequencyInfluence > 0) {

            this._applyFrequencyShifts(
                frequencies,
                transformed,
                transformedPhases,
                fields,
                unifiedParams
            );
        }

        // Normalize with headroom
        const maxMag = Math.max(...transformed);
        if (maxMag > 0) {
            const targetPeak = 0.9; // Leave some headroom
            for (let i = 0; i < transformed.length; i++) {
                transformed[i] = transformed[i] * (targetPeak / maxMag);
            }
        }

        return transformed;
    }

    /**
     * Apply frequency shifts in the frequency domain
     */
    _applyFrequencyShifts(frequencies, magnitudes, phases, fields, unifiedParams) {
        // This is a simplified implementation
        // A full implementation would require more complex frequency-domain resampling

        // For each frequency bin, calculate shift amount
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i];

            // Calculate integrated field effects
            const effects = this.mathAdapter.integrateFieldEffects(
                freq,
                unifiedParams,
                fields
            );

            // Skip if no significant frequency shift
            if (Math.abs(effects.frequency) < 0.01) continue;

            // Find target bin based on frequency shift
            const targetFreq = freq + effects.frequency;
            const targetBin = Math.round(targetFreq * frequencies.length / (frequencies[frequencies.length - 1] || 22050));

            // Skip if target bin is out of range
            if (targetBin < 0 || targetBin >= frequencies.length) continue;

            // Simple bin-to-bin transfer (a more sophisticated approach would use interpolation)
            magnitudes[targetBin] = (magnitudes[targetBin] + magnitudes[i]) / 2;

            // Phase adjustment for frequency shift
            phases[targetBin] = (phases[targetBin] + phases[i] + effects.phase) / 2;
        }
    }

    /**
     * Analyze audio to get frequency spectrum
     */
    _analyzeAudio(timeData) {
        const fftSize = this.config.resolution;
        const paddedData = new Float32Array(fftSize);
        paddedData.set(timeData.slice(0, Math.min(timeData.length, fftSize)));
        return this._toSpectral(paddedData);
    }

    /**
     * Create a Hann window function
     */
    _createHannWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        return window;
    }

    /**
     * Convert time domain to frequency domain
     */
    _toSpectral(timeData) {
        const fftSize = this.config.resolution;
        const frequencies = new Float32Array(fftSize/2);
        const magnitudes = new Float32Array(fftSize/2);
        const phases = new Float32Array(fftSize/2);

        // Zero-pad or truncate input to FFT size
        const paddedData = new Float32Array(fftSize);
        paddedData.set(timeData.slice(0, Math.min(timeData.length, fftSize)));

        for (let k = 0; k < fftSize/2; k++) {
            let realSum = 0, imagSum = 0;
            const freq = k * 44100 / fftSize;
            frequencies[k] = freq;

            for (let n = 0; n < fftSize; n++) {
                const angle = -2 * Math.PI * k * n / fftSize;
                realSum += paddedData[n] * Math.cos(angle);
                imagSum += paddedData[n] * Math.sin(angle);
            }

            magnitudes[k] = Math.sqrt(realSum * realSum + imagSum * imagSum) / fftSize;
            phases[k] = Math.atan2(imagSum, realSum);
        }

        return { frequencies, magnitudes, phases };
    }

    /**
     * Convert frequency domain to time domain
     */
    _toTemporal(magnitudes, phases) {
        const fftSize = this.config.resolution;
        const timeData = new Float32Array(fftSize);

        for (let n = 0; n < fftSize; n++) {
            let sum = 0;
            for (let k = 0; k < fftSize/2; k++) {
                const angle = 2 * Math.PI * k * n / fftSize + phases[k];
                sum += magnitudes[k] * Math.cos(angle);
            }
            timeData[n] = sum;
        }

        return timeData;
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

module.exports = IntegratedSpectralSieve;
