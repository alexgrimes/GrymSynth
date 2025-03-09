import { TestContext } from './test-context';
import { HealthState } from '../types';
interface SystemState {
    resourceState: {
        poolSize: number;
        availableResources: number;
        errorCount: number;
    };
    healthState: {
        status: HealthState;
        lastError?: Error;
    };
}
export declare class TestLifecycleManager {
    private context?;
    private initialState?;
    beforeAll(): Promise<void>;
    afterAll(): Promise<void>;
    beforeEach(): Promise<TestContext>;
    afterEach(): Promise<void>;
    resetState(): Promise<void>;
    mockSystemState(state: SystemState): Promise<void>;
    private captureSystemState;
    private restoreSystemState;
    private verifyState;
    private verifyResourceState;
    private verifyHealthState;
    private verifyCleanState;
    private cleanupResources;
}
export {};
