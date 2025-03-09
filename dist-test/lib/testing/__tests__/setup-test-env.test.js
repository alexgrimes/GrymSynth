"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_test_env_1 = require("../setup-test-env");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
jest.mock('child_process');
const mockSpawnSync = child_process_1.spawnSync;
describe('Test Environment Setup', () => {
    const testRoot = (0, path_1.resolve)(__dirname, '..');
    const coverageDir = (0, path_1.resolve)(testRoot, '../../../coverage');
    const tempDir = (0, path_1.resolve)(testRoot, 'temp-test-setup');
    let setup;
    beforeEach(() => {
        setup = new setup_test_env_1.TestEnvironmentSetup();
        // Create temporary test directory
        if (!(0, fs_1.existsSync)(tempDir)) {
            (0, fs_1.mkdirSync)(tempDir, { recursive: true });
        }
        // Mock successful command execution
        mockSpawnSync.mockReturnValue({
            status: 0,
            stdout: Buffer.from(''),
            stderr: Buffer.from(''),
            pid: 123,
            output: [],
            signal: null
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
        // Clean up temporary files
        if ((0, fs_1.existsSync)(tempDir)) {
            (0, fs_1.rmdirSync)(tempDir, { recursive: true });
        }
    });
    describe('Directory Creation', () => {
        it('creates required directories', async () => {
            await setup.setup();
            const dirs = [
                coverageDir,
                (0, path_1.resolve)(coverageDir, 'test-infrastructure'),
                (0, path_1.resolve)(coverageDir, 'error-handling')
            ];
            dirs.forEach(dir => {
                expect((0, fs_1.existsSync)(dir)).toBe(true);
            });
        });
        it('handles existing directories', async () => {
            // Create directories first
            (0, fs_1.mkdirSync)(coverageDir, { recursive: true });
            await setup.setup();
            expect((0, fs_1.existsSync)(coverageDir)).toBe(true);
        });
    });
    describe('Dependency Installation', () => {
        it('installs required packages', async () => {
            await setup.setup();
            expect(mockSpawnSync).toHaveBeenCalledWith('npm', expect.arrayContaining(['install', '--save-dev']), expect.any(Object));
        });
        it('handles installation failures', async () => {
            mockSpawnSync.mockReturnValueOnce({
                ...mockSpawnSync.mock.results[0].value,
                status: 1
            });
            const result = await setup.setup();
            expect(result).toBe(false);
        });
    });
    describe('Jest Configuration', () => {
        const jestConfigPath = (0, path_1.resolve)(testRoot, 'jest.config.js');
        afterEach(() => {
            if ((0, fs_1.existsSync)(jestConfigPath)) {
                (0, fs_1.unlinkSync)(jestConfigPath);
            }
        });
        it('creates Jest config if missing', async () => {
            await setup.setup();
            expect((0, fs_1.existsSync)(jestConfigPath)).toBe(true);
        });
        it('preserves existing Jest config', async () => {
            const originalContent = 'module.exports = {};';
            const configPath = (0, path_1.resolve)(tempDir, 'jest.config.js');
            // Create existing config
            (0, fs_1.mkdirSync)(tempDir, { recursive: true });
            require('fs').writeFileSync(configPath, originalContent);
            await setup.setup();
            const content = require('fs').readFileSync(configPath, 'utf8');
            expect(content).toBe(originalContent);
        });
    });
    describe('Script Permissions', () => {
        it('makes scripts executable', async () => {
            await setup.setup();
            expect(mockSpawnSync).toHaveBeenCalledWith('chmod', expect.arrayContaining(['+x']), expect.any(Object));
        });
    });
    describe('Verification', () => {
        it('runs verification test', async () => {
            await setup.setup();
            expect(mockSpawnSync).toHaveBeenCalledWith('npm', ['run', 'test:infra'], expect.any(Object));
        });
        it('handles verification failure', async () => {
            mockSpawnSync.mockReturnValueOnce({
                ...mockSpawnSync.mock.results[0].value,
                status: 1
            });
            const result = await setup.setup();
            expect(result).toBe(false);
        });
    });
    describe('Full Setup', () => {
        it('completes all steps successfully', async () => {
            const result = await setup.setup();
            expect(result).toBe(true);
        });
        it('handles errors gracefully', async () => {
            // Simulate error in dependency installation
            mockSpawnSync.mockReturnValueOnce({
                ...mockSpawnSync.mock.results[0].value,
                status: 1
            });
            const result = await setup.setup();
            expect(result).toBe(false);
        });
    });
});
//# sourceMappingURL=setup-test-env.test.js.map