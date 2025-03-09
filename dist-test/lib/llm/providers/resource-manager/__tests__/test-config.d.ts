import { ResourceManagerConfig } from '../types';
export declare const TEST_MODEL_IDS: {
    readonly MODEL_1: "test-model-1";
    readonly MODEL_2: "test-model-2";
    readonly MODEL_3: "test-model-3";
    readonly DEFAULT: "test-model";
};
export declare const mockConfig: ResourceManagerConfig;
export declare const createTestConfig: (overrides?: Partial<ResourceManagerConfig>) => ResourceManagerConfig;
