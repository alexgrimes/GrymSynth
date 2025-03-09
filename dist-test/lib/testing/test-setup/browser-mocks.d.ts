declare class MockAudioBuffer implements AudioBuffer {
    private _length;
    private _sampleRate;
    private _numberOfChannels;
    private _channelData;
    constructor(options: AudioBufferOptions);
    get duration(): number;
    get length(): number;
    get numberOfChannels(): number;
    get sampleRate(): number;
    getChannelData(channel: number): Float32Array;
    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
}
declare class MockAudioContext {
    constructor();
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
}
declare global {
    interface Window {
        AudioBuffer: typeof MockAudioBuffer;
        AudioContext: typeof MockAudioContext;
    }
    var AudioBuffer: typeof MockAudioBuffer;
    var AudioContext: typeof MockAudioContext;
}
export declare function createTestAudioBuffer(duration?: number, sampleRate?: number): AudioBuffer;
export { MockAudioBuffer, MockAudioContext };
