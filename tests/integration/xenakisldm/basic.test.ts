
import { MockAudioBuffer } from './mocks';

describe('Basic Test Environment', () => {
    it('should have working Jest setup', () => {
        expect(true).toBe(true);
    });

    it('should have working mocks', () => {
        const buffer = new MockAudioBuffer(2, 44100, 44100);
        expect(buffer).toBeDefined();
        expect(buffer.numberOfChannels).toBe(2);
        expect(buffer.length).toBe(44100);
        expect(buffer.sampleRate).toBe(44100);
        expect(buffer.duration).toBe(1);
    });

    it('should have working console mocks', () => {
        console.log('test');
        expect(console.log).toHaveBeenCalledWith('test');
    });

    it('should have working custom matchers', () => {
        expect(5).toBeWithinRange(0, 10);
    });
});