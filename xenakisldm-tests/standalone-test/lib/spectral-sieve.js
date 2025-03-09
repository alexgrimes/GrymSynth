const SpatialSpectralAdapter = require('./spatial-spectral-adapter');
const Logger = require('./logger');
const SpectralVisualizer = require('./spectral-visualizer');

/**
 * Enhanced spectral sieve using spatial-spectral transformations
 */
class SpectralSieve {
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

        this.adapter = new SpatialSpectralAdapter(config);
    }

    async transform(buffer, parameters) {
        Logger.section('Spectral Sieve Transform');

        // Get spectral fields from pattern analysis
        const { fields, globalParams } = await this.adapter.analyzeAndMap(buffer);
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

        // Apply spatial-spectral transformation
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

                // Apply spectral transformations
                const transformedMags = this._transformMagnitudes(
                    frequencies,
                    magnitudes,
                    fields,
                    globalParams,
                    parameters
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

    _analyzeAudio(timeData) {
        const fftSize = this.config.resolution;
        const paddedData = new Float32Array(fftSize);
        paddedData.set(timeData.slice(0, Math.min(timeData.length, fftSize)));
        return this._toSpectral(paddedData);
    }

    _transformMagnitudes(frequencies, magnitudes, fields, globalParams, params) {
        const transformed = new Float32Array(magnitudes.length);
        const { intervals = [], modulo = 12, density = 1.0 } = params || {};

        // Convert musical intervals to frequency ratios
        const baseFreq = 440; // A4 as reference
        const frequencyTargets = (intervals || []).map(interval => ({
            frequency: baseFreq * Math.pow(2, interval / modulo),
            strength: density * (1.0 / Math.sqrt(Math.abs(interval) + 1))
        }));

        for (let i = 0; i < magnitudes.length; i++) {
            const freq = frequencies[i];
            if (freq < this.config.minFreq || freq > this.config.maxFreq) {
                transformed[i] = magnitudes[i];
                continue;
            }

            // Calculate spectral field effect
            let fieldEffect = this.adapter.calculateFieldEffect(freq, fields);

            // Calculate interval-based resonance
            let resonance = 0;
            frequencyTargets.forEach(target => {
                const ratio = freq / target.frequency;
                const octave = Math.log2(ratio);
                const octaveDistance = Math.abs(Math.round(octave) - octave);

                if (octaveDistance < 0.1) {
                    resonance += target.strength * (1 - octaveDistance * 10);
                }
            });

            // Apply spectral shaping with stronger effect
            const boost = Math.pow(1 + fieldEffect * 3, 2) *
                         Math.pow(1 + resonance * 4, 2);

            // Apply global parameter modulation
            const densityEffect = 1 + (globalParams?.spectralDensity || 0.5) *
                                Math.sin(2 * Math.PI * freq / 1000);
            const evolutionEffect = 1 + (globalParams?.temporalEvolution || 0.5) *
                                  Math.cos(2 * Math.PI * freq / 500);
            const stabilityEffect = Math.pow(globalParams?.structuralStability || 0.7, 0.5);

            // Combine all effects
            transformed[i] = magnitudes[i] * boost * densityEffect *
                           evolutionEffect * stabilityEffect;
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

    _createHannWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        return window;
    }

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

module.exports = SpectralSieve;
