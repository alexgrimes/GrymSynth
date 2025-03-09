import './test-setup/setup-env';
import { MemoryProfiler } from './memory-profile';
import { MemoryVisualizer } from './memory-viz';
declare const MEMORY_LIMIT: number;
export declare const testEnv: {
    memoryProfiler: MemoryProfiler;
    memoryVisualizer: MemoryVisualizer;
    MEMORY_LIMIT: number;
    forceGC: () => Promise<void>;
};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWithinMemoryLimit(limit: number): R;
            toHaveAcceptableMemoryGrowth(initialMemory: number, threshold?: number): R;
        }
    }
}
export { testEnv, MEMORY_LIMIT };
