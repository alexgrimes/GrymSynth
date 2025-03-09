const { createTestBuffer, generateSineWave } = require('../utils/test-utils');

class AudioLDMMock {
    constructor(config = {}) {
        this.config = {
            sampleRate: 44100,
            baseLatency: 100, // ms
            errorRate: 0.0,   // 0-1.0
            variance: 0.1,    // Output variation
            ...config
        };

        this.logs = [];
        this.requestCount = 0;
    }

    async generateAudio(prompt, params = {}) {
        this.logRequest('generateAudio', { prompt, params });

        // Simulate network latency
        await this.simulateLatency();

        // Random failure simulation
        if (Math.random() < this.config.errorRate) {
            const error = new Error('AudioLDM generation failed');
            this.logError('generateAudio', error);
            throw error;
        }

        // Create deterministic but prompt-dependent output
        const buffer = this._createResponseBuffer(prompt, params);
        this.logResponse('generateAudio', { prompt, buffer });

        return buffer;
    }

    _createResponseBuffer(prompt, params) {
        const duration = params.duration || 5.0;
        const buffer = createTestBuffer(this.config.sampleRate, duration, 2);

        // Generate deterministic but prompt-dependent audio
        const promptHash = this._hashString(prompt);
        const baseFreq = 220 + (promptHash % 440); // Range: 220-660 Hz

        // Fill channels with prompt-dependent content
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            const freq = baseFreq * (channel + 1);

            // Generate basic waveform
            const sineWave = generateSineWave(freq, this.config.sampleRate, duration);

            // Apply controlled variation
            for (let i = 0; i < channelData.length; i++) {
                const variation = (Math.random() * 2 - 1) * this.config.variance;
                channelData[i] = Math.max(-1, Math.min(1, sineWave[i] + variation));
            }
        }

        return buffer;
    }

    _hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    async simulateLatency() {
        const latency = this.config.baseLatency * (1 + Math.random() * 0.2);
        await new Promise(resolve => setTimeout(resolve, latency));
    }

    // Logging methods
    logRequest(method, params) {
        const entry = {
            id: ++this.requestCount,
            timestamp: Date.now(),
            type: 'request',
            method,
            params
        };
        this.logs.push(entry);
        return entry;
    }

    logResponse(method, result) {
        const entry = {
            id: this.requestCount,
            timestamp: Date.now(),
            type: 'response',
            method,
            result: {
                sampleRate: result.buffer.sampleRate,
                duration: result.buffer.duration,
                channels: result.buffer.numberOfChannels,
                prompt: result.prompt
            }
        };
        this.logs.push(entry);
        return entry;
    }

    logError(method, error) {
        const entry = {
            id: this.requestCount,
            timestamp: Date.now(),
            type: 'error',
            method,
            error: error.message
        };
        this.logs.push(entry);
        return entry;
    }

    // Utility methods
    getLogs(filter = {}) {
        return this.logs.filter(log => {
            for (const [key, value] of Object.entries(filter)) {
                if (log[key] !== value) return false;
            }
            return true;
        });
    }

    clearLogs() {
        this.logs = [];
        this.requestCount = 0;
    }

    getMetrics() {
        const requests = this.logs.filter(l => l.type === 'request').length;
        const errors = this.logs.filter(l => l.type === 'error').length;
        const totalTime = this.logs.reduce((sum, log) => {
            if (log.type === 'response') {
                const req = this.logs.find(l => l.id === log.id && l.type === 'request');
                if (req) sum += log.timestamp - req.timestamp;
            }
            return sum;
        }, 0);

        return {
            totalRequests: requests,
            successRate: (requests - errors) / requests,
            averageLatency: totalTime / (requests - errors),
            errorRate: errors / requests
        };
    }
}

module.exports = AudioLDMMock;
