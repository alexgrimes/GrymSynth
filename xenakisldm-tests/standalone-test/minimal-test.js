require('@jest/globals');

// Simple sanity check
test('basic test', () => {
  console.log('Running basic test');
  expect(true).toBe(true);
  expect(1 + 1).toBe(2);
});

// Audio-related test
test('audio buffer creation', () => {
  console.log('Testing audio buffer creation');

  // Create a simple audio-like object
  const buffer = {
    sampleRate: 44100,
    length: 44100,
    duration: 1,
    numberOfChannels: 2,
    getChannelData: (channel) => {
      if (channel >= 2) throw new Error('Invalid channel');
      return new Float32Array(44100);
    }
  };

  // Basic assertions
  expect(buffer.sampleRate).toBe(44100);
  expect(buffer.numberOfChannels).toBe(2);
  expect(buffer.duration).toBe(1);
  expect(() => buffer.getChannelData(0)).not.toThrow();
  expect(() => buffer.getChannelData(2)).toThrow('Invalid channel');

  // Test channel data
  const data = buffer.getChannelData(0);
  expect(data).toBeInstanceOf(Float32Array);
  expect(data.length).toBe(44100);
});
