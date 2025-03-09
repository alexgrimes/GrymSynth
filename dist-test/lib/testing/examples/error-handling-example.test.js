"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const health_1 = require("../types/health");
describe('Error Handling', () => {
    let healthState;
    beforeEach(() => {
        healthState = (0, health_1.createDefaultHealthState)();
    });
    describe('Basic Error Handling', () => {
        it('should handle simple errors', () => {
            try {
                throw new Error('Test error');
            }
            catch (error) {
                healthState = (0, health_1.createErrorHealthState)(error);
                expect(healthState.status).toBe('error');
                expect(healthState.health.errorRate).toBe(1);
                expect(healthState.errorCount).toBe(1);
                expect(healthState.metrics.totalOperations).toBe(0);
            }
        });
        it('should track error metrics', () => {
            const errors = [
                new Error('Error 1'),
                new Error('Error 2'),
                new Error('Error 3')
            ];
            errors.forEach(error => {
                try {
                    throw error;
                }
                catch (e) {
                    healthState = (0, health_1.createErrorHealthState)(e);
                    healthState.metrics.totalOperations++;
                }
            });
            expect(healthState.health.errorRate).toBe(1);
            expect(healthState.errorCount).toBe(1);
            expect(healthState.metrics.totalOperations).toBe(1);
        });
        it('should provide error details', () => {
            const testError = new Error('Detailed test error');
            healthState = (0, health_1.createErrorHealthState)(testError);
            expect(healthState.errors).toBeDefined();
            expect(healthState.errors?.lastError).toBe(testError);
            expect(healthState.errors?.errorTypes.get(testError.name)).toBe(1);
        });
    });
    describe('Health State Transitions', () => {
        it('should transition from healthy to error', () => {
            // Start with healthy state
            expect(healthState.status).toBe('healthy');
            expect(healthState.health.errorRate).toBe(0);
            // Trigger error
            try {
                throw new Error('Transition test error');
            }
            catch (error) {
                healthState = (0, health_1.createErrorHealthState)(error);
            }
            expect(healthState.status).toBe('error');
            expect(healthState.health.errorRate).toBe(1);
        });
        it('should track multiple errors', () => {
            const errorMap = new Map();
            ['TypeError', 'RangeError', 'TypeError'].forEach(errorType => {
                try {
                    const ErrorClass = globalThis[errorType];
                    throw new ErrorClass('Test error');
                }
                catch (error) {
                    healthState = (0, health_1.createErrorHealthState)(error);
                    const count = errorMap.get(errorType) || 0;
                    errorMap.set(errorType, count + 1);
                }
            });
            expect(healthState.errors?.errorTypes.get('TypeError')).toBe(1);
            expect(healthState.health.errorRate).toBeGreaterThan(0);
        });
    });
    describe('Performance Impact', () => {
        it('should measure error handling overhead', () => {
            const startTime = Date.now();
            try {
                throw new Error('Performance test error');
            }
            catch (error) {
                healthState = (0, health_1.createErrorHealthState)(error);
            }
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(100); // Error handling should be fast
        });
    });
});
//# sourceMappingURL=error-handling-example.test.js.map