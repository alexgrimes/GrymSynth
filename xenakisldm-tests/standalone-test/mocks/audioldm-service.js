/**
 * Mock implementation of AudioLDM service for testing
 */
class AudioLDMMock {
    constructor(config = {}) {
        this.config = {
            sampleRate: 44100,
            channels: 1,
            debug: true,
            ...config
        };
    }

    /**
     * Generate mock audio based on prompt
     */
    async generateAudio(prompt, params = {}) {
        const { duration = 1.0 } = params;

        if (this.config.debug) {
            console.log('\nAudioLDM Mock:');
            console.log('- Prompt:', prompt);
            console.log('- Duration:', duration);
        }

        // Create buffer
        const length = Math.floor(this.config.sampleRate * duration);
        const buffer = {
            sampleRate: this.config.sampleRate,
            numberOfChannels: this.config.channels,
            duration: duration,
            length: length,
            _channels: []
        };

        // Extract musical parameters from prompt
        const intervals = this._extractIntervals(prompt);
        if (this.config.debug) {
            console.log('- Detected intervals:', intervals);
        }

        // Generate test signal for each channel
        for (let c = 0; c < this.config.channels; c++) {
            const signal = new Float32Array(length);

            // Base frequency (A4 = 440 Hz)
            const baseFreq = 440;

            // Generate harmonically rich tones for each interval
            intervals.forEach((interval, i) => {
                const freq = baseFreq * Math.pow(2, interval / 12);
                const baseAmp = 1.0 / (i + 1); // Decreasing amplitude for higher intervals

                if (this.config.debug) {
                    console.log(`  Channel ${c}: Frequency ${freq.toFixed(1)}Hz (interval ${interval})`);
                }

                // Generate fundamental and harmonics
                const harmonics = [1, 2, 3, 4, 5, 8, 13];
                harmonics.forEach(h => {
                    const harmonicFreq = freq * h;
                    if (harmonicFreq < this.config.sampleRate / 2) { // Below Nyquist
                        const harmonicAmp = baseAmp / Math.pow(h, 1.5); // Harmonics decay faster
                        for (let n = 0; n < length; n++) {
                            const t = n / this.config.sampleRate;
                            // Add some frequency modulation for more natural sound
                            const vibrato = 1 + 0.001 * Math.sin(2 * Math.PI * 5 * t);
                            signal[n] += harmonicAmp *
                                       Math.sin(2 * Math.PI * harmonicFreq * t * vibrato);
                        }
                    }
                });

                // Add amplitude envelope
                const attack = 0.05;  // 50ms attack
                const release = 0.1;  // 100ms release
                for (let n = 0; n < length; n++) {
                    const t = n / this.config.sampleRate;
                    let envelope = 1;

                    if (t < attack) {
                        envelope = t / attack; // Linear attack
                    } else if (t > duration - release) {
                        envelope = (duration - t) / release; // Linear release
                    }

                    signal[n] *= envelope;
                }
            });

            // Add subtle noise
            for (let n = 0; n < length; n++) {
                signal[n] += (Math.random() * 2 - 1) * 0.01;
            }

            // Normalize with headroom
            const maxAmp = Math.max(...Array.from(signal).map(Math.abs));
            const targetPeak = 0.8; // Leave headroom
            if (maxAmp > 0) {
                for (let n = 0; n < length; n++) {
                    signal[n] = signal[n] * (targetPeak / maxAmp);
                }
            }

            buffer._channels[c] = signal;
        }

        buffer.getChannelData = function(channel) {
            if (channel >= this.numberOfChannels) {
                throw new Error('Invalid channel index');
            }
            return this._channels[channel];
        };

        return buffer;
    }

    /**
     * Extract musical intervals from prompt
     */
    _extractIntervals(prompt) {
        const match = prompt.match(/intervals\s*\[([\d,\s]+)\]/);
        if (match) {
            return match[1].split(',').map(n => parseInt(n.trim(), 10));
        }
        // Default intervals if none specified
        return [0, 4, 7]; // Major triad
    }
}

module.exports = AudioLDMMock;
