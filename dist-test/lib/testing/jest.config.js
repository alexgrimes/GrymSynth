"use strict";
/** @type {import('jest').Config} */
module.exports = {
    displayName: 'Test Infrastructure',
    rootDir: '../../..',
    testMatch: [
        '<rootDir>/src/lib/testing/__tests__/**/*.test.ts'
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
                tsconfig: '<rootDir>/tsconfig.json'
            }]
    },
    setupFilesAfterEnv: [
        '<rootDir>/src/lib/testing/setup/jest.setup.ts'
    ],
    verbose: true,
    collectCoverage: true,
    coverageDirectory: '<rootDir>/coverage/test-infrastructure',
    coverageReporters: ['text', 'html', 'lcov'],
    coverageThreshold: {
        global: {
            statements: 90,
            branches: 85,
            functions: 90,
            lines: 90
        }
    },
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: './coverage/test-infrastructure',
                outputName: 'junit.xml',
                classNameTemplate: '{classname}',
                titleTemplate: '{title}'
            }
        ]
    ],
    testEnvironment: 'node',
    testTimeout: 10000,
    maxWorkers: '50%',
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    globals: {
        'ts-jest': {
            isolatedModules: true
        }
    }
};
//# sourceMappingURL=jest.config.js.map