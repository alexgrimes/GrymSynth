import type { Config } from '@jest/types';
import type { MockInstance } from 'jest-mock';

// Console mocks setup
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
};

beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
});

afterAll(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
});

// Custom matchers
expect.extend({
    toBeWithinRange(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        return {
            message: () =>
                pass
                    ? `expected ${received} not to be within range ${floor} - ${ceiling}`
                    : `expected ${received} to be within range ${floor} - ${ceiling}`,
            pass
        };
    },

    toHaveValidAudioFormat(received: any) {
        const hasRequiredProperties = (
            received &&
            typeof received.sampleRate === 'number' &&
            typeof received.numberOfChannels === 'number' &&
            typeof received.duration === 'number' &&
            typeof received.length === 'number' &&
            typeof received.getChannelData === 'function'
        );

        const channelDataValid = (() => {
            if (!hasRequiredProperties) return false;
            try {
                const data = received.getChannelData(0);
                return data instanceof Float32Array;
            } catch {
                return false;
            }
        })();

        return {
            message: () =>
                hasRequiredProperties && channelDataValid
                    ? 'expected audio format to be invalid'
                    : 'expected audio format to be valid with required properties and valid channel data',
            pass: hasRequiredProperties && channelDataValid
        };
    }
});
