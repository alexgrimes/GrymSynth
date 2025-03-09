import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Root directories for tests
  roots: ["<rootDir>/src"],

  // File patterns for tests
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],

  // Configure test coverage
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/__tests__/", "/dist/"],

  // Transform TypeScript files
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/services/learning/__tests__/setup.ts"],

  // Maximum time for a test in milliseconds
  testTimeout: 10000,

  // Verbosity of test output
  verbose: true,

  // Global test configuration
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },

  // Handle module aliases if needed
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
