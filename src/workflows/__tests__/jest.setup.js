// Increase timeout for all tests
jest.setTimeout(30000);

// Custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
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

  toHaveCompletedSteps(workflow, expectedSteps) {
    const completedSteps = workflow.completedSteps || [];
    const pass = expectedSteps.every(step => completedSteps.includes(step));
    
    if (pass) {
      return {
        message: () =>
          `expected workflow not to have completed steps ${expectedSteps.join(', ')}`,
        pass: true,
      };
    } else {
      const missing = expectedSteps.filter(step => !completedSteps.includes(step));
      return {
        message: () =>
          `expected workflow to have completed steps ${missing.join(', ')}`,
        pass: false,
      };
    }
  },

  toBeValidWorkflowId(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be a valid workflow ID`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid workflow ID`,
        pass: false,
      };
    }
  }
});

// Global test environment setup
global.beforeAll(() => {
  // Add any global setup here
});

global.afterAll(() => {
  // Add any global teardown here
});

// Error handling for unhandled promises
process.on('unhandledRejection', (error) => {
  console.error('UNHANDLED PROMISE REJECTION:', error);
});