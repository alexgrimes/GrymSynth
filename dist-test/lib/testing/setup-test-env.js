#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestEnvironmentSetup = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
/**
 * Setup test environment
 */
class TestEnvironmentSetup {
    constructor() {
        this.testRoot = (0, path_1.resolve)(__dirname);
        this.coverageDir = (0, path_1.resolve)(this.testRoot, '../../../coverage');
    }
    /**
     * Run all setup steps
     */
    async setup() {
        console.log('\nSetting up test environment...\n');
        const steps = [
            {
                name: 'Create directories',
                action: () => this.createDirectories()
            },
            {
                name: 'Install dependencies',
                action: () => this.installDependencies()
            },
            {
                name: 'Configure Jest',
                action: () => this.configureJest()
            },
            {
                name: 'Make scripts executable',
                action: () => this.makeScriptsExecutable()
            },
            {
                name: 'Verify setup',
                action: () => this.verifySetup()
            }
        ];
        let success = true;
        for (const step of steps) {
            success = await this.runStep(step) && success;
        }
        if (success) {
            console.log('\n✅ Test environment setup complete!\n');
            this.showNextSteps();
        }
        else {
            console.error('\n❌ Test environment setup failed!\n');
        }
        return success;
    }
    /**
     * Create required directories
     */
    createDirectories() {
        try {
            const dirs = [
                this.coverageDir,
                (0, path_1.join)(this.coverageDir, 'test-infrastructure'),
                (0, path_1.join)(this.coverageDir, 'error-handling')
            ];
            dirs.forEach(dir => {
                if (!(0, fs_1.existsSync)(dir)) {
                    (0, fs_1.mkdirSync)(dir, { recursive: true });
                }
            });
            return true;
        }
        catch (error) {
            console.error('Failed to create directories:', error);
            return false;
        }
    }
    /**
     * Install test dependencies
     */
    installDependencies() {
        const deps = [
            '@types/jest',
            'jest',
            'ts-jest',
            'jest-junit'
        ];
        console.log('Installing dependencies:', deps.join(', '));
        const result = (0, child_process_1.spawnSync)('npm', ['install', '--save-dev', ...deps], {
            stdio: 'inherit',
            shell: true
        });
        return result.status === 0;
    }
    /**
     * Configure Jest for the project
     */
    configureJest() {
        try {
            const jestConfigPath = (0, path_1.resolve)(this.testRoot, 'jest.config.js');
            if (!(0, fs_1.existsSync)(jestConfigPath)) {
                console.log('Creating Jest config:', jestConfigPath);
                (0, fs_1.writeFileSync)(jestConfigPath, this.getJestConfig());
            }
            return true;
        }
        catch (error) {
            console.error('Failed to configure Jest:', error);
            return false;
        }
    }
    /**
     * Make test scripts executable
     */
    makeScriptsExecutable() {
        const scripts = [
            'run-infra-tests.sh',
            'test.sh'
        ];
        try {
            scripts.forEach(script => {
                const scriptPath = (0, path_1.resolve)(this.testRoot, script);
                if ((0, fs_1.existsSync)(scriptPath)) {
                    (0, child_process_1.spawnSync)('chmod', ['+x', scriptPath], { shell: true });
                }
            });
            return true;
        }
        catch (error) {
            console.error('Failed to make scripts executable:', error);
            return false;
        }
    }
    /**
     * Verify setup by running a basic test
     */
    verifySetup() {
        console.log('Running test verification...');
        const result = (0, child_process_1.spawnSync)('npm', ['run', 'test:infra'], {
            stdio: 'inherit',
            shell: true
        });
        return result.status === 0;
    }
    /**
     * Run a setup step with error handling
     */
    async runStep(step) {
        process.stdout.write(`${step.name}... `);
        try {
            const success = await step.action();
            console.log(success ? '✅' : '❌');
            return success;
        }
        catch (error) {
            console.log('❌');
            console.error(`Error in ${step.name}:`, error);
            return false;
        }
    }
    /**
     * Show next steps after setup
     */
    showNextSteps() {
        console.log('Next steps:');
        console.log('1. Run all tests: npm run test:all');
        console.log('2. Check coverage: npm run test:error:coverage');
        console.log('3. Review test documentation: src/lib/testing/TEST-HELP.md');
        console.log('\nHappy testing! 🚀\n');
    }
    /**
     * Get Jest configuration
     */
    getJestConfig() {
        return `/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/lib/testing/__tests__/**/*.test.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/lib/testing/setup/jest.setup.ts'
  ],
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage/test-infrastructure'
};`;
    }
}
exports.TestEnvironmentSetup = TestEnvironmentSetup;
// Run setup if called directly
if (require.main === module) {
    new TestEnvironmentSetup().setup()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=setup-test-env.js.map