
export interface AudioBuffer {
    readonly length: number;
    readonly duration: number;
    readonly sampleRate: number;
    readonly numberOfChannels: number;
    getChannelData(channel: number): Float32Array;
    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
}