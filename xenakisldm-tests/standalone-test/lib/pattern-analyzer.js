/**
 * Pattern analysis system for spatial-spectral transformations
 */
class PatternAnalyzer {
    constructor(config = {}) {
        this.config = {
            minFreq: 20,
            maxFreq: 20000,
            fftSize: 2048,
            correlationThreshold: 0.7,
            temporalWindow: 0.1,  // seconds
            ...config
        };
    }

    /**
     * Analyze patterns in audio data
     */
    analyzePatterns(buffer) {
        const patterns = [];
        const windowSize = Math.floor(this.config.temporalWindow * buffer.sampleRate);

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const data = buffer.getChannelData(channel);

            // Analyze in overlapping windows
            for (let start = 0; start < data.length - windowSize; start += windowSize/2) {
                const windowData = data.slice(start, start + windowSize);
                const spectrum = this._computeSpectrum(windowData);
                const features = this._extractFeatures(spectrum);

                patterns.push({
                    channel,
                    timeStart: start / buffer.sampleRate,
                    timeEnd: (start + windowSize) / buffer.sampleRate,
                    features,
                    spectrum
                });
            }
        }

        // Find correlations between patterns
        const correlations = this._findCorrelations(patterns);

        return {
            patterns,
            correlations,
            summary: this._summarizePatterns(patterns, correlations)
        };
    }

    /**
     * Convert pattern analysis to spectral field parameters
     */
    createSpectralFields(analysis) {
        const fields = [];
        const { patterns, correlations, summary } = analysis;

        // Create gravitational fields from strong patterns
        patterns.forEach((pattern, i) => {
            const strength = this._calculatePatternStrength(pattern);
            if (strength > 0.3) { // Significant pattern threshold
                const field = {
                    frequency: pattern.features.centroid,
                    strength: strength,
                    bandwidth: pattern.features.bandwidth,
                    attractors: this._createAttractors(pattern, correlations[i])
                };
                fields.push(field);
            }
        });

        return {
            fields,
            globalParams: {
                density: summary.patternDensity,
                complexity: summary.spectralComplexity,
                evolution: summary.temporalEvolution
            }
        };
    }

    /**
     * Compute spectrum using FFT
     */
    _computeSpectrum(timeData) {
        const fftSize = this.config.fftSize;
        const spectrum = {
            frequencies: new Float32Array(fftSize/2),
            magnitudes: new Float32Array(fftSize/2),
            phases: new Float32Array(fftSize/2)
        };

        for (let k = 0; k < fftSize/2; k++) {
            let realSum = 0, imagSum = 0;
            const freq = k * 44100 / fftSize;
            spectrum.frequencies[k] = freq;

            for (let n = 0; n < fftSize; n++) {
                const sample = timeData[n] || 0;
                const angle = -2 * Math.PI * k * n / fftSize;
                realSum += sample * Math.cos(angle);
                imagSum += sample * Math.sin(angle);
            }

            spectrum.magnitudes[k] = Math.sqrt(realSum * realSum + imagSum * imagSum) / fftSize;
            spectrum.phases[k] = Math.atan2(imagSum, realSum);
        }

        return spectrum;
    }

    /**
     * Extract spectral features
     */
    _extractFeatures(spectrum) {
        let totalEnergy = 0;
        let weightedFreq = 0;
        let peaks = [];

        // Find spectral centroid and peaks
        for (let i = 0; i < spectrum.magnitudes.length; i++) {
            const mag = spectrum.magnitudes[i];
            const freq = spectrum.frequencies[i];

            totalEnergy += mag;
            weightedFreq += freq * mag;

            // Peak detection
            if (i > 0 && i < spectrum.magnitudes.length - 1) {
                if (mag > spectrum.magnitudes[i-1] && mag > spectrum.magnitudes[i+1]) {
                    peaks.push({ frequency: freq, magnitude: mag });
                }
            }
        }

        const centroid = weightedFreq / totalEnergy;

        // Calculate bandwidth
        let bandwidth = 0;
        for (let i = 0; i < spectrum.magnitudes.length; i++) {
            const freq = spectrum.frequencies[i];
            const mag = spectrum.magnitudes[i];
            bandwidth += Math.pow(freq - centroid, 2) * mag;
        }
        bandwidth = Math.sqrt(bandwidth / totalEnergy);

        return {
            centroid,
            bandwidth,
            peaks: peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5),
            totalEnergy
        };
    }

    /**
     * Find correlations between patterns
     */
    _findCorrelations(patterns) {
        return patterns.map(pattern => {
            const correlations = [];

            patterns.forEach((other, index) => {
                if (other === pattern) return;

                const correlation = this._calculateCorrelation(
                    pattern.spectrum.magnitudes,
                    other.spectrum.magnitudes
                );

                if (correlation > this.config.correlationThreshold) {
                    correlations.push({ index, correlation });
                }
            });

            return correlations;
        });
    }

    /**
     * Calculate correlation between spectra
     */
    _calculateCorrelation(spec1, spec2) {
        let sum1 = 0, sum2 = 0, sum12 = 0;
        let sum1Sq = 0, sum2Sq = 0;
        const n = Math.min(spec1.length, spec2.length);

        for (let i = 0; i < n; i++) {
            sum1 += spec1[i];
            sum2 += spec2[i];
            sum12 += spec1[i] * spec2[i];
            sum1Sq += spec1[i] * spec1[i];
            sum2Sq += spec2[i] * spec2[i];
        }

        const numerator = n * sum12 - sum1 * sum2;
        const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Create spectral attractors based on pattern correlations
     */
    _createAttractors(pattern, correlations) {
        return pattern.features.peaks.map(peak => ({
            frequency: peak.frequency,
            strength: peak.magnitude * this._calculatePatternStrength(pattern),
            bandwidth: pattern.features.bandwidth * (peak.magnitude / pattern.features.totalEnergy)
        }));
    }

    /**
     * Calculate overall pattern strength
     */
    _calculatePatternStrength(pattern) {
        const peakEnergy = pattern.features.peaks.reduce((sum, peak) => sum + peak.magnitude, 0);
        return peakEnergy / pattern.features.totalEnergy;
    }

    /**
     * Summarize pattern analysis
     */
    _summarizePatterns(patterns, correlations) {
        const patternDensity = patterns.length / (patterns[0]?.timeEnd || 1);

        // Calculate spectral complexity from peak distribution
        const peakFreqs = new Set();
        patterns.forEach(pattern => {
            pattern.features.peaks.forEach(peak => {
                peakFreqs.add(Math.round(peak.frequency / 50) * 50); // Group by 50Hz bands
            });
        });
        const spectralComplexity = peakFreqs.size / patterns.length;

        // Calculate temporal evolution
        const temporalEvolution = correlations.reduce((sum, corr) =>
            sum + corr.reduce((s, c) => s + c.correlation, 0), 0
        ) / (correlations.length * correlations.length);

        return {
            patternCount: patterns.length,
            patternDensity,
            spectralComplexity,
            temporalEvolution,
            avgCorrelation: temporalEvolution
        };
    }
}

module.exports = PatternAnalyzer;
