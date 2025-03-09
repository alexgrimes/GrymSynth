import { XenakisLDMServiceFactory } from '../XenakisLDMServiceFactory';
import { Task } from '../../types';

// Increase test timeout for performance-sensitive tests
jest.setTimeout(30000);

// Mock AudioLDM service for tests that don't need real audio generation
jest.mock('../../audio/AudioLDMService', () => {
  return {
    AudioLDMService: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      isInitialized: jest.fn().mockReturnValue(true),
      generateAudio: jest.fn().mockResolvedValue({
        audio: new Float32Array(16000 * 5),
        sampleRate: 16000,
        duration: 5,
        parameters: {}
      }),
      shutdown: jest.fn().mockResolvedValue(undefined)
    }))
  };
});

// Mock MemoryManager for consistent memory tracking
jest.mock('../../utils/memory', () => {
  return {
    MemoryManager: jest.fn().mockImplementation(() => ({
      startOperation: jest.fn().mockReturnValue(Date.now()),
      endOperation: jest.fn(),
      getMemoryUsage: jest.fn().mockReturnValue({
        total: 1024 * 1024 * 1024,
        used: 512 * 1024 * 1024,
        free: 512 * 1024 * 1024
      })
    }))
  };
});

// Mock Logger to prevent console noise during tests
jest.mock('../../utils/logger', () => {
  return {
    Logger: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }))
  };
});

// Global test setup
beforeAll(async () => {
  // Clean up any existing instances
  await XenakisLDMServiceFactory.destroyInstance().catch(() => {});
});

// Clean up after each test
afterEach(async () => {
  jest.clearAllMocks();
  await XenakisLDMServiceFactory.destroyInstance().catch(() => {});
});

// Global test teardown
afterAll(async () => {
  await XenakisLDMServiceFactory.destroyInstance().catch(() => {});
});

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

  toHaveValidTimestamps(received: any[]) {
    const hasValidTimestamps = received.every(
      item => typeof item.time === 'number' && !isNaN(item.time)
    );
    if (hasValidTimestamps) {
      return {
        message: () => 'expected timestamps to be invalid',
        pass: true,
      };
    } else {
      return {
        message: () => 'expected all items to have valid timestamps',
        pass: false,
      };
    }
  }
});

// Add global test utilities
const createMockTask = (type: string, data: any): Task => ({
  id: `test-${Date.now()}`,
  type,
  modelType: 'xenakis',
  priority: 'normal',
  data
});

// Make createMockTask available globally
(global as any).createMockTask = createMockTask;

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidTimestamps(): R;
    }
  }

  namespace NodeJS {
    interface Global {
      createMockTask: typeof createMockTask;
    }
  }
}
