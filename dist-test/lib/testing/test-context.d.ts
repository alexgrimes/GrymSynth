import { HealthState } from '../types';
interface TestModel {
    id: string;
    type: string;
    status: 'ready' | 'processing' | 'error';
}
interface TestResourcePool {
    mockError(error: Error): Promise<void>;
    mockAllocation(resourceId: string): Promise<void>;
    mockHandoffError(source: TestModel, target: TestModel): Promise<void>;
    getMetrics(): {
        poolSize: number;
        available: number;
        lastError: Error | null;
    };
    reset(): Promise<void>;
    mockCleanup(count: number): Promise<void>;
}
interface TestHealthMonitor {
    getStatus(): HealthState;
    getFullState(): {
        health: HealthState;
        errorCount: number;
        metrics: {
            requestCount: number;
            errorRate: number;
            lastError: Error | null;
        };
        status: string;
        lastCheck: Date;
    };
    handleError(error: Error): void;
    reset(): void;
}
declare class TestProjectManager {
    private models;
    private activeModel;
    createModel(type: string): Promise<TestModel>;
    getModel(id: string): TestModel | undefined;
    setModelStatus(id: string, status: TestModel['status']): void;
    getActiveModel(): TestModel | null;
    clear(): void;
}
export declare class TestContext {
    readonly resourcePool: TestResourcePool;
    readonly healthMonitor: TestHealthMonitor;
    readonly projectManager: TestProjectManager;
    constructor(resourcePool: TestResourcePool, healthMonitor: TestHealthMonitor);
    static create(): Promise<TestContext>;
    mockError(error: Error): Promise<void>;
    mockHandoffError(source: TestModel, target: TestModel): Promise<void>;
    getState(): HealthState;
    getFullState(): {
        health: HealthState;
        errorCount: number;
        metrics: {
            requestCount: number;
            errorRate: number;
            lastError: Error | null;
        };
        status: string;
        lastCheck: Date;
    };
    reset(): Promise<void>;
    cleanup(): Promise<void>;
}
export {};
