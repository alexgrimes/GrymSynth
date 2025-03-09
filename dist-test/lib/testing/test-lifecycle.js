"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestLifecycleManager = void 0;
const test_context_1 = require("./test-context");
class TestLifecycleManager {
    async beforeAll() {
        this.initialState = await this.captureSystemState();
    }
    async afterAll() {
        if (this.initialState) {
            await this.restoreSystemState(this.initialState);
        }
        await this.cleanupResources();
    }
    async beforeEach() {
        this.context = await test_context_1.TestContext.create();
        await this.resetState();
        return this.context;
    }
    async afterEach() {
        if (!this.context) {
            return;
        }
        await this.context.cleanup();
        await this.verifyCleanState();
    }
    async resetState() {
        if (!this.context) {
            throw new Error('Test context not initialized');
        }
        await Promise.all([
            this.context.resourcePool.reset(),
            this.context.healthMonitor.reset()
        ]);
        await this.verifyCleanState();
    }
    async mockSystemState(state) {
        if (!this.context) {
            throw new Error('Test context not initialized');
        }
        const { resourceState } = state;
        await this.context.resourcePool.mockCleanup(resourceState.poolSize - resourceState.availableResources);
        const { healthState } = state;
        this.context.healthMonitor.mockState(healthState.status);
        if (healthState.lastError) {
            await this.context.mockError(healthState.lastError);
        }
    }
    async captureSystemState() {
        if (!this.context) {
            throw new Error('Test context not initialized');
        }
        const metrics = this.context.resourcePool.getMetrics();
        return {
            resourceState: {
                poolSize: metrics.poolSize,
                availableResources: metrics.available,
                errorCount: 0
            },
            healthState: {
                status: this.context.healthMonitor.getStatus()
            }
        };
    }
    async restoreSystemState(state) {
        await this.mockSystemState(state);
        await this.verifyState(state);
    }
    async verifyState(expected, options = {}) {
        if (!this.context) {
            throw new Error('Test context not initialized');
        }
        const actual = await this.captureSystemState();
        if (options.checkResources !== false) {
            this.verifyResourceState(actual.resourceState, expected.resourceState);
        }
        if (options.checkHealth !== false) {
            this.verifyHealthState(actual.healthState, expected.healthState);
        }
    }
    verifyResourceState(actual, expected) {
        if (actual.poolSize !== expected.poolSize) {
            throw new Error(`Pool size mismatch. Expected: ${expected.poolSize}, Got: ${actual.poolSize}`);
        }
        if (actual.availableResources !== expected.availableResources) {
            throw new Error(`Available resources mismatch. Expected: ${expected.availableResources}, Got: ${actual.availableResources}`);
        }
    }
    verifyHealthState(actual, expected) {
        if (actual.status !== expected.status) {
            throw new Error(`Health status mismatch. Expected: ${expected.status}, Got: ${actual.status}`);
        }
    }
    async verifyCleanState() {
        if (!this.context) {
            throw new Error('Test context not initialized');
        }
        await this.context.verifyCleanState();
    }
    async cleanupResources() {
        if (this.context) {
            await this.context.cleanup();
            this.context = undefined;
        }
    }
}
exports.TestLifecycleManager = TestLifecycleManager;
//# sourceMappingURL=test-lifecycle.js.map