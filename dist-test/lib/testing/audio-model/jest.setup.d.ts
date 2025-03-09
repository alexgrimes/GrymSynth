/// <reference types="@/lib/testing/audio-model/global" />
declare class MockAudioBuffer implements AudioBuffer {
    length: number;
    duration: number;
    sampleRate: number;
    numberOfChannels: number;
    private channels;
    constructor(options: {
        length: number;
        numberOfChannels?: number;
        sampleRate: number;
    });
    getChannelData(channel: number): Float32Array;
    copyFromChannel(destination: Float32Array, channelNumber: number, bufferOffset?: number): void;
    copyToChannel(source: Float32Array, channelNumber: number, bufferOffset?: number): void;
}
