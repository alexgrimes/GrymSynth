console.log('Loading test setup...');

// Add custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidAudioFormat(received: unknown) {
    const validFormat = (
      received &&
      typeof received === 'object' &&
      'sampleRate' in received &&
      typeof (received as any).sampleRate === 'number' &&
      'numberOfChannels' in received &&
      typeof (received as any).numberOfChannels === 'number' &&
      'duration' in received &&
      typeof (received as any).duration === 'number' &&
      'length' in received &&
      typeof (received as any).length === 'number' &&
      'getChannelData' in received &&
      typeof (received as any).getChannelData === 'function'
    );

    if (!validFormat) {
      return {
        message: () =>
          `expected object to have valid audio format properties, but got ${JSON.stringify(received)}`,
        pass: false
      };
    }

    try {
      const data = (received as any).getChannelData(0);
      const validData = data instanceof Float32Array;

      return {
        message: () =>
          validData
            ? `expected object not to have valid audio data`
            : `expected object to have valid Float32Array channel data`,
        pass: validData
      };
    } catch (error) {
      return {
        message: () =>
          `error accessing channel data: ${error instanceof Error ? error.message : 'unknown error'}`,
        pass: false
      };
    }
  }
});

// Log setup completion
console.log('Test setup complete. Custom matchers registered.');
