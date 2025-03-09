"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validator = void 0;
const standardized_audio_context_1 = require("standardized-audio-context");
const feature_memory_system_1 = require("../../lib/feature-memory/core/feature-memory-system");
class AudioLearningValidator {
    constructor() {
        this.context = null;
        this.audioManager = null;
        this.metrics = {
            memoryUsage: { before: 0, after: 0, peak: 0 },
            timing: { startup: 0, processing: 0, cleanup: 0 },
            resourceUsage: { cpu: 0, memory: 0, audio: 0 }
        };
    }
    async initialize() {
        const startTime = performance.now();
        try {
            this.context = new standardized_audio_context_1.AudioContext();
            this.metrics.memoryUsage.before = performance.memory?.usedJSHeapSize || 0;
            // Initialize the audio system
            this.audioManager = await this.createAudioManager();
            this.metrics.timing.startup = performance.now() - startTime;
            return true;
        }
        catch (error) {
            console.error('Initialization failed:', error);
            return false;
        }
    }
    async runValidation() {
        const scenarios = this.getValidationScenarios();
        const results = {};
        for (const scenario of scenarios) {
            try {
                console.log(`Running scenario: ${scenario.name}`);
                results[scenario.name] = await scenario.run();
                if (scenario.cleanup) {
                    await scenario.cleanup();
                }
                // Monitor memory after each scenario
                this.updateMemoryMetrics();
            }
            catch (error) {
                results[scenario.name] = {
                    passed: false,
                    details: `Error in scenario ${scenario.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                };
            }
        }
        return results;
    }
    getValidationScenarios() {
        return [
            // Browser Reality Tests
            this.createMemoryManagementTest(),
            this.createAudioStreamingTest(),
            this.createModelLoadingTest(),
            // Concurrent Operation Tests
            this.createMultipleModelsTest(),
            this.createMultipleStreamsTest(),
            this.createResourceContentionTest(),
            // Real World Scenario Tests
            this.createNetworkConditionsTest(),
            this.createBrowserCompatTest(),
            this.createMobileSupportTest()
        ];
    }
    createMemoryManagementTest() {
        return {
            name: 'Memory Management',
            run: async () => {
                const initialMemory = performance.memory?.usedJSHeapSize || 0;
                const audioBuffers = [];
                try {
                    // Create multiple large audio buffers
                    for (let i = 0; i < 10; i++) {
                        const buffer = await this.createLargeAudioBuffer();
                        audioBuffers.push(buffer);
                        // Process each buffer
                        await this.processAudioBuffer(buffer);
                        // Check memory after each iteration
                        const currentMemory = performance.memory?.usedJSHeapSize || 0;
                        this.metrics.memoryUsage.peak = Math.max(this.metrics.memoryUsage.peak, currentMemory);
                        // Allow GC to run
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    // Cleanup
                    audioBuffers.length = 0;
                    // Final memory check
                    const finalMemory = performance.memory?.usedJSHeapSize || 0;
                    const memoryLeak = finalMemory - initialMemory > 50 * 1024 * 1024; // 50MB threshold
                    return {
                        passed: !memoryLeak,
                        details: `Memory usage: initial=${initialMemory}, final=${finalMemory}, peak=${this.metrics.memoryUsage.peak}`,
                        metrics: {
                            initialMemory,
                            finalMemory,
                            peak: this.metrics.memoryUsage.peak
                        }
                    };
                }
                catch (error) {
                    return {
                        passed: false,
                        details: `Memory test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }
        };
    }
    createAudioStreamingTest() {
        return {
            name: 'Audio Streaming',
            run: async () => {
                if (!this.context) {
                    return { passed: false, details: 'Audio context not initialized' };
                }
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = this.context.createMediaStreamSource(stream);
                    const processor = this.context.createScriptProcessor(4096, 1, 1);
                    let processedChunks = 0;
                    const requiredChunks = 50; // Process ~2 seconds of audio
                    return new Promise((resolve) => {
                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            // Process audio data
                            this.processAudioChunk(inputData);
                            processedChunks++;
                            if (processedChunks >= requiredChunks) {
                                // Cleanup
                                processor.disconnect();
                                source.disconnect();
                                stream.getTracks().forEach(track => track.stop());
                                resolve({
                                    passed: true,
                                    details: `Successfully processed ${processedChunks} chunks of audio`,
                                    metrics: {
                                        chunksProcessed: processedChunks,
                                        totalDuration: (processedChunks * 4096) / 44100
                                    }
                                });
                            }
                        };
                        source.connect(processor);
                        processor.connect(this.context.destination);
                    });
                }
                catch (error) {
                    return {
                        passed: false,
                        details: `Audio streaming test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    };
                }
            }
        };
    }
    // Helper methods
    async createLargeAudioBuffer() {
        if (!this.context)
            throw new Error('Audio context not initialized');
        // Create 5 seconds of audio at 44.1kHz
        const sampleRate = 44100;
        const length = 5 * sampleRate;
        return this.context.createBuffer(2, length, sampleRate);
    }
    async processAudioBuffer(buffer) {
        if (!this.audioManager)
            throw new Error('Audio manager not initialized');
        // Convert AudioBuffer to format expected by AudioProcessingManager
        const audioFile = {
            id: `test-${Date.now()}`,
            path: 'memory-test.wav',
            size: buffer.length * 4,
            format: 'wav'
        };
        await this.audioManager.processAudio(audioFile);
    }
    processAudioChunk(data) {
        // Process real-time audio data
        // This would integrate with the audio learning system
        // For now, we'll just calculate some basic metrics
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += Math.abs(data[i]);
        }
        const average = sum / data.length;
        this.metrics.resourceUsage.audio = average;
    }
    updateMemoryMetrics() {
        if (performance.memory) {
            this.metrics.memoryUsage.after = performance.memory.usedJSHeapSize;
            this.metrics.memoryUsage.peak = Math.max(this.metrics.memoryUsage.peak, performance.memory.usedJSHeapSize);
        }
    }
    async createAudioManager() {
        // Initialize the actual components
        // This would be replaced with your actual initialization code
        const featureMemory = new feature_memory_system_1.FeatureMemorySystem();
        // ... initialize other required components
        return {}; // Placeholder
    }
}
// Export for use in the test runner
exports.validator = new AudioLearningValidator();
//# sourceMappingURL=audio-learning-validation.js.map