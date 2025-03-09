declare global {
    namespace jest {
        interface Matchers<R> {
            toBeLessThanTime(expectedTime: number, description?: string): R;
            toHaveStableMemoryUsage(maxGrowthMB?: number): R;
        }
    }
}
/**
 * Custom matchers for performance testing
 */
declare const performanceMatchers: {
    toBeLessThanTime(received: number, expected: number, description?: string): {
        pass: boolean;
        message: () => string;
    };
    toHaveStableMemoryUsage(initialHeap: number, finalHeap: number, maxGrowthMB?: number): {
        pass: boolean;
        message: () => string;
    };
};
export { performanceMatchers };
