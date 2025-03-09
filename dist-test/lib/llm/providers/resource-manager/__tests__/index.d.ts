export * from './test-config';
export * from '../test-helpers';
export declare const TEST_TIMEOUTS: {
    readonly SHORT: 100;
    readonly MEDIUM: 1000;
    readonly LONG: 5000;
};
export declare const TEST_MEMORY_SIZES: {
    readonly SMALL: 1000;
    readonly MEDIUM: 5000;
    readonly LARGE: 10000;
};
export declare const TEST_THRESHOLDS: {
    readonly LOW: 0.1;
    readonly MEDIUM: 0.5;
    readonly HIGH: 0.8;
    readonly CRITICAL: 0.9;
};
export declare const wait: (ms: number) => Promise<unknown>;
export declare const simulateAsyncOperation: <T>(result: T, delay?: 100) => Promise<T>;
export declare const createTimeoutPromise: (ms: number) => Promise<never>;
export declare const withTimeout: <T>(operation: Promise<T>, timeout?: number) => Promise<T>;
export declare const measureExecutionTime: <T>(operation: () => Promise<T>) => Promise<{
    result: T;
    duration: number;
}>;
