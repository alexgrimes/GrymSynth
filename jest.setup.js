// Set test environment variables
process.env.NODE_ENV = 'test';

// Add support for garbage collection in tests if available
if (typeof global.gc !== 'function') {
  global.gc = () => {
    console.warn('Manual garbage collection not available');
  };
}

// Setup CI detection
process.env.IS_CI = process.env.CI || process.env.GITHUB_ACTIONS ? 'true' : 'false';

// Increase test timeout for performance tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Keep error logging
  error: console.error,
  // Silence info and warn in tests
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

// Add global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));