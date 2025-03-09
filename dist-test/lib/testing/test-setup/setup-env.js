"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTestEnvironment = void 0;
const browser_mocks_1 = require("./browser-mocks");
// Initialize test environment
function setupTestEnvironment() {
    // Setup browser-like globals
    if (typeof global.AudioBuffer === 'undefined') {
        global.AudioBuffer = browser_mocks_1.MockAudioBuffer;
    }
    if (typeof global.AudioContext === 'undefined') {
        global.AudioContext = browser_mocks_1.MockAudioContext;
    }
    // Add helper functions to global scope
    if (typeof global.createTestAudioBuffer === 'undefined') {
        global.createTestAudioBuffer = (duration = 1, sampleRate = 44100) => {
            return new browser_mocks_1.MockAudioBuffer({
                numberOfChannels: 2,
                length: Math.floor(duration * sampleRate),
                sampleRate
            });
        };
    }
    // Add performance timing if not available
    if (typeof global.performance === 'undefined') {
        global.performance = {
            now: () => Date.now(),
            mark: () => { },
            measure: () => { },
            clearMarks: () => { },
            clearMeasures: () => { }
        };
    }
    // Force garbage collection helper
    if (typeof global.gc === 'undefined') {
        console.warn('Garbage collection is not exposed. Run Node.js with --expose-gc flag for better memory testing.');
    }
    // Add process memory info if not available (mock for browsers)
    if (typeof process === 'undefined' || !process.memoryUsage) {
        global.process = {
            ...global.process,
            memoryUsage: () => ({
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                arrayBuffers: 0,
                rss: 0
            })
        };
    }
}
exports.setupTestEnvironment = setupTestEnvironment;
// Initialize test environment
setupTestEnvironment();
//# sourceMappingURL=setup-env.js.map