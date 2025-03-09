"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAudioContext = exports.MockAudioBuffer = exports.createTestAudioBuffer = void 0;
// Mock AudioBuffer implementation
class MockAudioBuffer {
    constructor(options) {
        this._length = options.length;
        this._sampleRate = options.sampleRate;
        this._numberOfChannels = options.numberOfChannels;
        this._channelData = Array(options.numberOfChannels)
            .fill(null)
            .map(() => new Float32Array(options.length));
    }
    get duration() {
        return this._length / this._sampleRate;
    }
    get length() {
        return this._length;
    }
    get numberOfChannels() {
        return this._numberOfChannels;
    }
    get sampleRate() {
        return this._sampleRate;
    }
    getChannelData(channel) {
        if (channel >= this._numberOfChannels) {
            throw new Error('Channel index out of bounds');
        }
        return this._channelData[channel];
    }
    copyFromChannel(destination, channelNumber, startInChannel) {
        const source = this.getChannelData(channelNumber);
        const start = startInChannel || 0;
        destination.set(source.subarray(start, start + destination.length));
    }
    copyToChannel(source, channelNumber, startInChannel) {
        const destination = this.getChannelData(channelNumber);
        const start = startInChannel || 0;
        destination.set(source, start);
    }
}
exports.MockAudioBuffer = MockAudioBuffer;
// Mock AudioContext implementation
class MockAudioContext {
    constructor() {
        // Add minimal implementation if needed
    }
    createBuffer(numberOfChannels, length, sampleRate) {
        return new MockAudioBuffer({ numberOfChannels, length, sampleRate });
    }
}
exports.MockAudioContext = MockAudioContext;
// Install mocks globally
global.AudioBuffer = MockAudioBuffer;
global.AudioContext = MockAudioContext;
// Helper functions
function createTestAudioBuffer(duration = 1, sampleRate = 44100) {
    return new MockAudioBuffer({
        numberOfChannels: 2,
        length: Math.floor(duration * sampleRate),
        sampleRate: sampleRate
    });
}
exports.createTestAudioBuffer = createTestAudioBuffer;
//# sourceMappingURL=browser-mocks.js.map