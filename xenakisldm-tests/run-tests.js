const { runCLI } = require('@jest/core');
const path = require('path');

const config = {
  rootDir: path.resolve(__dirname),
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      diagnostics: {
        ignoreCodes: [2339] // Ignore TypeScript errors about missing custom matchers
      }
    }]
  },
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: './tsconfig.json'
    }
  }
};

console.log('Running tests with configuration:', JSON.stringify(config, null, 2));

async function runTests() {
  try {
    const { results } = await runCLI(
      {
        config: JSON.stringify(config),
        _: ['tests/unit/audio-buffer.test.ts'],
        '$0': 'jest'
      },
      [__dirname]
    );

    console.log('\nTest Results:', results);

    if (!results.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();
