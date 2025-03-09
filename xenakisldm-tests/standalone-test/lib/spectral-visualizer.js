/**
 * Visualization utilities for spectral analysis
 */
class SpectralVisualizer {
    static generateAsciiSpectrum(frequencies, magnitudes, width = 60, height = 10) {
        // Find range for frequencies and magnitudes
        const minFreq = Math.min(...frequencies);
        const maxFreq = Math.max(...frequencies);
        const maxMag = Math.max(...magnitudes);

        // Create empty visualization grid
        const grid = Array(height).fill().map(() => Array(width).fill(' '));

        // Plot magnitudes
        for (let i = 0; i < frequencies.length; i++) {
            const x = Math.floor((frequencies[i] - minFreq) / (maxFreq - minFreq) * (width - 1));
            const y = Math.floor((1 - magnitudes[i] / maxMag) * (height - 1));
            if (x >= 0 && x < width && y >= 0 && y < height) {
                grid[y][x] = '█';
            }
        }

        // Convert grid to string
        return grid.map(row => row.join('')).join('\n');
    }

    static visualizeTransformation(inputFreqs, inputMags, outputFreqs, outputMags) {
        console.log('\nSpectral Transformation Visualization:');
        console.log('Input Spectrum:');
        console.log(this.generateAsciiSpectrum(inputFreqs, inputMags));

        console.log('\nOutput Spectrum:');
        console.log(this.generateAsciiSpectrum(outputFreqs, outputMags));

        // Calculate and display energy distribution
        const inputEnergy = inputMags.reduce((sum, m) => sum + m * m, 0);
        const outputEnergy = outputMags.reduce((sum, m) => sum + m * m, 0);

        console.log('\nEnergy Analysis:');
        console.log(`Input Energy: ${inputEnergy.toFixed(3)}`);
        console.log(`Output Energy: ${outputEnergy.toFixed(3)}`);
        console.log(`Energy Ratio: ${(outputEnergy / inputEnergy).toFixed(3)}`);

        // Find and display major peaks
        const inputPeaks = this._findPeaks(inputFreqs, inputMags);
        const outputPeaks = this._findPeaks(outputFreqs, outputMags);

        console.log('\nMajor Peaks:');
        console.log('Input:', inputPeaks.map(p =>
            `${p.frequency.toFixed(1)}Hz (${p.magnitude.toFixed(3)})`
        ).join(', '));
        console.log('Output:', outputPeaks.map(p =>
            `${p.frequency.toFixed(1)}Hz (${p.magnitude.toFixed(3)})`
        ).join(', '));

        // Calculate frequency ratios
        if (inputPeaks.length > 1 && outputPeaks.length > 1) {
            console.log('\nFrequency Ratios:');
            console.log('Input:', this._calculateRatios(inputPeaks));
            console.log('Output:', this._calculateRatios(outputPeaks));
        }
    }

    static _findPeaks(frequencies, magnitudes, threshold = 0.1) {
        const peaks = [];
        const maxMag = Math.max(...magnitudes);
        threshold *= maxMag;

        for (let i = 1; i < magnitudes.length - 1; i++) {
            if (magnitudes[i] > threshold &&
                magnitudes[i] > magnitudes[i-1] &&
                magnitudes[i] > magnitudes[i+1]) {
                peaks.push({
                    frequency: frequencies[i],
                    magnitude: magnitudes[i]
                });
            }
        }

        return peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
    }

    static _calculateRatios(peaks) {
        if (peaks.length < 2) return [];
        const base = peaks[0].frequency;
        return peaks.slice(1).map(p =>
            (p.frequency / base).toFixed(3)
        ).join(', ');
    }

    static visualizeFields(fields, minFreq = 20, maxFreq = 20000, points = 100) {
        console.log('\nSpectral Field Visualization:');

        // Create frequency points for visualization
        const freqs = [];
        const effects = [];
        const step = Math.exp(Math.log(maxFreq/minFreq)/(points-1));

        let freq = minFreq;
        for (let i = 0; i < points; i++) {
            freqs.push(freq);
            let totalEffect = 0;

            fields.forEach(field => {
                if (field.type === 'pattern') {
                    const distance = Math.abs(freq - field.center);
                    const effect = field.strength / (1 + distance * distance);
                    totalEffect += effect;
                }
            });

            effects.push(totalEffect);
            freq *= step;
        }

        // Normalize effects for visualization
        const maxEffect = Math.max(...effects);
        const normalizedEffects = effects.map(e => e / maxEffect);

        console.log(this.generateAsciiSpectrum(freqs, normalizedEffects));

        // Print field centers
        console.log('\nField Centers:');
        fields.filter(f => f.type === 'pattern').forEach(field => {
            console.log(`${field.center.toFixed(1)}Hz (strength: ${field.strength.toFixed(3)})`);
        });
    }
}

module.exports = SpectralVisualizer;
