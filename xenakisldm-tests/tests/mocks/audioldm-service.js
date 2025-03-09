/**
 * Mock implementation of AudioLDM service for testing
 */
class MockAudioLDM {
  constructor(config = {}) {
    this.latency = config.latency || 100; // Default 100ms latency
    this.variance = config.variance || 0.1; // 10% output variance
    this.sampleRate = config.sampleRate || 44100;
    this.failureRate = config.failureRate || 0; // Probability of generation failure
  }

  async generateAudio(prompt, params = {}) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, this.latency));

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      throw new Error('AudioLDM generation failed');
    }

    const duration = params.duration || 5.0; // Default 5 second clip
    const samplesCount = Math.floor(this.sampleRate * duration);

    // Generate deterministic but prompt-dependent output
    const buffer = {
      sampleRate: this.sampleRate,
      numberOfChannels: 2,
      length: samplesCount,
      duration: duration,
      prompt: prompt,
      params: params,
      getChannelData: (channel) => {
        if (channel >= 2) throw new Error('Invalid channel index');

        // Create deterministic but varying output based on prompt
        const data = new Float32Array(samplesCount);
        const promptSum = prompt.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const baseFreq = (440 + (promptSum % 440)) * (channel + 1);

        for (let i = 0; i < samplesCount; i++) {
          const t = i / this.sampleRate;
          // Combine multiple frequencies for richer output
          data[i] = Math.sin(2 * Math.PI * baseFreq * t) * 0.5 +
                    Math.sin(2 * Math.PI * baseFreq * 1.5 * t) * 0.3 +
                    Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.2;

          // Add controlled random variance
          data[i] += (Math.random() * 2 - 1) * this.variance;

          // Ensure values stay within [-1, 1]
          data[i] = Math.max(-1, Math.min(1, data[i]));
        }
        return data;
      }
    };

    return buffer;
  }

  // Simulate model parameter adjustment
  async adjustParameters(params) {
    await new Promise(resolve => setTimeout(resolve, this.latency / 2));
    return {
      ...params,
      adjusted: true,
      timestamp: Date.now()
    };
  }

  // Simulate resource cleanup
  async cleanup() {
    await new Promise(resolve => setTimeout(resolve, this.latency / 4));
    return true;
  }
}

module.exports = MockAudioLDM;
