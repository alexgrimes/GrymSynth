const fs = require('fs');

// Test framework utilities
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
    return true;
}

function assertCloseTo(actual, expected, tolerance = 0.000001) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
        throw new Error(`Expected ${actual} to be close to ${expected} (diff: ${diff} > ${tolerance})`);
    }
    return true;
}

function assertArraysEqual(arr1, arr2, tolerance = 0.000001) {
    if (arr1.length !== arr2.length) {
        throw new Error(`Arrays have different lengths: ${arr1.length} !== ${arr2.length}`);
    }

    for (let i = 0; i < arr1.length; i++) {
        assertCloseTo(arr1[i], arr2[i], tolerance);
    }
    return true;
}

// Audio testing utilities
function createTestBuffer(sampleRate, duration, channels = 1) {
    return {
        sampleRate,
        numberOfChannels: channels,
        length: Math.floor(sampleRate * duration),
        duration,
        getChannelData: (channel) => {
            if (channel >= channels) {
                throw new Error('Invalid channel index');
            }
            return new Float32Array(Math.floor(sampleRate * duration));
        }
    };
}

function generateSineWave(frequency, sampleRate, duration) {
    const length = Math.floor(sampleRate * duration);
    const data = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * frequency * t);
    }

    return data;
}

// Test reporting utilities
function saveTestResults(name, results) {
    const output = {
        name,
        timestamp: new Date().toISOString(),
        results,
        stats: {
            total: results.length,
            passed: results.filter(r => r.passed).length,
            failed: results.filter(r => !r.passed).length
        }
    };

    const filename = `${name}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    return filename;
}

function logTestResult(name, passed, error = null) {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${name}`);
    if (error) {
        console.error(`  Error: ${error.message}`);
    }
    return { name, passed, error: error?.message };
}

// Performance measurement utilities
function measurePerformance(fn) {
    const start = process.hrtime.bigint();
    const result = fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e6; // Convert to milliseconds

    return {
        result,
        duration,
        memory: process.memoryUsage()
    };
}

module.exports = {
    assert,
    assertCloseTo,
    assertArraysEqual,
    createTestBuffer,
    generateSineWave,
    saveTestResults,
    logTestResult,
    measurePerformance
};
