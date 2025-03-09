module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/integration/'],
  moduleNameMapper: {
    // Mock out the wav2vec2 service
    "^src/services/audio/Wav2Vec2Service$": "<rootDir>/src/tests/mocks/wav2vec2Service.mock.ts",
    "^./audio/Wav2Vec2Service$": "<rootDir>/src/tests/mocks/wav2vec2Service.mock.ts"
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json'
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true,
  setupFilesAfterEnv: ['./jest.setup.js']
}
