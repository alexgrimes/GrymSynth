"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioTestHelpers = void 0;
class AudioTestHelpers {
    /**
     * Creates a mock audio buffer for testing
     */
    static createMockAudioBuffer(duration, sampleRate = 44100) {
        const length = Math.floor(duration * sampleRate);
        return {
            length,
            sampleRate,
            duration,
            numberOfChannels: 2,
            getChannelData: (channel) => new Float32Array(length)
        };
    }
    /**
     * Calculates audio fidelity score between two audio buffers
     */
    static calculateAudioFidelity(original, processed) {
        // TODO: Implement real audio fidelity comparison
        // For now, return mock score
        return 0.95;
    }
    /**
     * Measures transcription accuracy using WER (Word Error Rate)
     */
    static calculateTranscriptionAccuracy(expected, actual) {
        const expectedWords = expected.toLowerCase().split(/\s+/);
        const actualWords = actual.toLowerCase().split(/\s+/);
        const distance = this.levenshteinDistance(expectedWords, actualWords);
        return 1 - (distance / expectedWords.length);
    }
    /**
     * Monitors resource usage during test execution
     */
    static async monitorResourceUsage(testFn, interval = 100) {
        const measurements = [];
        let peak = 0;
        const startTime = performance.now();
        const monitor = setInterval(() => {
            const memUsage = process.memoryUsage().heapUsed;
            measurements.push(memUsage);
            peak = Math.max(peak, memUsage);
        }, interval);
        try {
            await testFn();
        }
        finally {
            clearInterval(monitor);
        }
        const endTime = performance.now();
        const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        return {
            memory: {
                peak,
                average
            },
            duration: endTime - startTime
        };
    }
    /**
     * Creates a sample test suite for audio model evaluation
     */
    static createBasicTestSuite() {
        return {
            name: "Basic Audio Model Evaluation",
            description: "Basic test suite for evaluating core audio model capabilities",
            testCases: [
                {
                    name: "Short audio transcription",
                    description: "Tests transcription of a short audio clip",
                    input: {
                        type: "file",
                        data: "test-audio-short.wav",
                        duration: 5
                    },
                    expectedOutput: {
                        type: "transcription",
                        data: "Hello world",
                        accuracy: 0.95
                    }
                },
                {
                    name: "Streaming audio processing",
                    description: "Tests real-time audio stream processing",
                    input: {
                        type: "stream",
                        data: new ReadableStream(),
                        duration: 10
                    },
                    expectedOutput: {
                        type: "audio",
                        data: new ArrayBuffer(0),
                        accuracy: 0.9
                    }
                }
            ]
        };
    }
    /**
     * Validates an audio model's configuration
     */
    static validateModelConfig(model) {
        return !!(model.id &&
            model.name &&
            model.capabilities &&
            (model.capabilities.transcription || model.capabilities.synthesis));
    }
    static levenshteinDistance(arr1, arr2) {
        const matrix = [];
        // Initialize matrix
        for (let i = 0; i <= arr1.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= arr2.length; j++) {
            matrix[0][j] = j;
        }
        // Fill matrix
        for (let i = 1; i <= arr1.length; i++) {
            for (let j = 1; j <= arr2.length; j++) {
                const cost = arr1[i - 1] === arr2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
            }
        }
        return matrix[arr1.length][arr2.length];
    }
}
exports.AudioTestHelpers = AudioTestHelpers;
//# sourceMappingURL=audio-test-helpers.js.map