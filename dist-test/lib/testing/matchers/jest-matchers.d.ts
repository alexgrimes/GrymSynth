/**
 * Extend Jest's expect with custom matchers
 */
declare global {
    namespace jest {
        interface Expect {
            /**
             * Check if value is less than expected with optional failure message
             */
            toBeLessThanWithMessage(expected: number, message?: string): void;
            /**
             * Check if memory growth is within limits
             */
            toHaveAcceptableMemoryGrowth(maxGrowthMB: number, message?: string): void;
        }
    }
}
/**
 * Custom matcher extensions for Jest
 */
declare const customMatchers: {
    toBeLessThanWithMessage(received: number, expected: number, message?: string): {
        pass: boolean;
        message: () => string;
    };
    toHaveAcceptableMemoryGrowth(heapGrowth: number, maxGrowthMB: number, message?: string): {
        pass: boolean;
        message: () => string;
    };
};
export { customMatchers };
