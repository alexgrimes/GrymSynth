import { AudioModel, AudioTestSuite } from '../../types/testing';
export declare class AudioTestHelpers {
    /**
     * Creates a mock audio buffer for testing
     */
    static createMockAudioBuffer(duration: number, sampleRate?: number): AudioBuffer;
    /**
     * Calculates audio fidelity score between two audio buffers
     */
    static calculateAudioFidelity(original: AudioBuffer, processed: AudioBuffer): number;
    /**
     * Measures transcription accuracy using WER (Word Error Rate)
     */
    static calculateTranscriptionAccuracy(expected: string, actual: string): number;
    /**
     * Monitors resource usage during test execution
     */
    static monitorResourceUsage(testFn: () => Promise<void>, interval?: number): Promise<{
        memory: {
            peak: number;
            average: number;
        };
        duration: number;
    }>;
    /**
     * Creates a sample test suite for audio model evaluation
     */
    static createBasicTestSuite(): AudioTestSuite;
    /**
     * Validates an audio model's configuration
     */
    static validateModelConfig(model: AudioModel): boolean;
    private static levenshteinDistance;
}
