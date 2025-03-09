
import { AudioBuffer } from '@src/types/audio';

export class MockAudioBuffer implements AudioBuffer {
    private data: Float32Array;
    readonly length: number;

    constructor(
        public readonly numberOfChannels: number,
        length: number,
        public readonly sampleRate: number
    ) {
        this.length = length;
        this.data = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            this.data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
        }
    }

    get duration(): number {
        return this.length / this.sampleRate;
    }

    getChannelData(channel: number): Float32Array {
        if (channel >= this.numberOfChannels) {
            throw new Error('Channel out of bounds');
        }
        return this.data;
    }

    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void {
        const start = startInChannel || 0;
        const source = this.getChannelData(channelNumber).subarray(start);
        destination.set(source.subarray(0, destination.length));
    }

    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void {
        const start = startInChannel || 0;
        const destination = this.getChannelData(channelNumber);
        destination.set(source, start);
    }
}