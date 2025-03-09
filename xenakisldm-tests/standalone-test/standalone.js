// Standalone test script
console.log('Starting standalone tests...\n');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, message) {
  try {
    if (!condition) {
      throw new Error(message);
    }
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}

function runTest(name, fn) {
  process.stdout.write(`Running test: ${name} ... `);
  try {
    const passed = fn();
    if (passed) {
      process.stdout.write('✓ PASS\n');
      results.passed++;
    } else {
      process.stdout.write('✗ FAIL\n');
      results.failed++;
    }
    results.tests.push({ name, passed });
  } catch (error) {
    process.stdout.write(`✗ FAIL (${error.message})\n`);
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
  }
}

// Basic tests
runTest('Simple Addition', () =>
  assert(1 + 1 === 2, 'Basic addition failed')
);

runTest('Array Operations', () => {
  const arr = new Float32Array(3);
  return assert(arr.length === 3, 'Array creation failed');
});

// Audio-related tests
runTest('Audio Buffer Creation', () => {
  const buffer = {
    sampleRate: 44100,
    numberOfChannels: 2,
    length: 44100,
    getChannelData: () => new Float32Array(44100)
  };

  return assert(
    buffer.sampleRate === 44100 &&
    buffer.numberOfChannels === 2 &&
    buffer.getChannelData(0).length === 44100,
    'Audio buffer creation failed'
  );
});

runTest('Sine Wave Generation', () => {
  const sampleRate = 44100;
  const frequency = 440;
  const samples = new Float32Array(sampleRate);

  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate;
    samples[i] = Math.sin(2 * Math.PI * frequency * t);
  }

  return assert(
    Math.abs(samples[0]) < 0.0001 && // Should be close to 0
    Math.abs(samples[sampleRate/4]) > 0.9, // Should be close to 1
    'Sine wave generation failed'
  );
});

// Print results
console.log('\n=== Test Results ===');
console.log(`Total tests: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);

// Write results to file
const fs = require('fs');
fs.writeFileSync('standalone-results.json', JSON.stringify({
  results,
  timestamp: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform
}, null, 2));

process.exit(results.failed ? 1 : 0);
