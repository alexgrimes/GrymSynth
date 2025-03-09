"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pattern_recognizer_1 = require("../core/pattern-recognizer");
const pattern_validator_1 = require("../core/pattern-validator");
const pattern_storage_1 = require("../core/pattern-storage");
const test_helpers_1 = require("./test-helpers");
describe('Feature Memory System', () => {
    let recognizer;
    let validator;
    let storage;
    let performanceMonitor;
    let memoryMonitor;
    let errorTracker;
    beforeEach(() => {
        recognizer = new pattern_recognizer_1.PatternRecognizer();
        validator = new pattern_validator_1.PatternValidator();
        storage = new pattern_storage_1.PatternStorage({}, validator);
        performanceMonitor = new test_helpers_1.PerformanceMonitor();
        memoryMonitor = new test_helpers_1.MemoryMonitor();
        errorTracker = new test_helpers_1.ErrorTracker();
    });
    afterEach(() => {
        performanceMonitor.reset();
        memoryMonitor.reset();
        errorTracker.reset();
    });
    describe('Performance Requirements', () => {
        it('should meet pattern recognition latency target (< 50ms)', async () => {
            const pattern = (0, test_helpers_1.createMockPattern)();
            performanceMonitor.start();
            await recognizer.recognizePatterns(pattern.features);
            const latency = performanceMonitor.measure('recognition');
            expect(latency).toBeLessThan(50);
        });
        it('should meet storage operation latency target (< 20ms)', async () => {
            const pattern = (0, test_helpers_1.createMockPattern)();
            performanceMonitor.start();
            await storage.store(pattern);
            const latency = performanceMonitor.measure('storage');
            expect(latency).toBeLessThan(20);
        });
        it('should maintain memory usage within limits (< 100MB)', async () => {
            const patterns = (0, test_helpers_1.createMockPatterns)(1000);
            for (const pattern of patterns) {
                await storage.store(pattern);
                const memoryUsage = memoryMonitor.measure();
                expect(memoryUsage).toBeLessThan(100);
            }
            expect(memoryMonitor.getPeakMemory()).toBeLessThan(100);
        });
        it('should maintain low error rate (< 0.1%)', async () => {
            const patterns = (0, test_helpers_1.createMockPatterns)(1000);
            for (const pattern of patterns) {
                try {
                    await storage.store(pattern);
                    errorTracker.trackOperation(true);
                }
                catch (error) {
                    errorTracker.trackOperation(false, error);
                }
            }
            expect(errorTracker.getErrorRate()).toBeLessThan(0.1);
        });
    });
    describe('Pattern Recognition', () => {
        it('should recognize similar patterns with high confidence', async () => {
            const basePattern = (0, test_helpers_1.createMockPattern)();
            await storage.store(basePattern);
            const similarPattern = (0, test_helpers_1.createMockPattern)({
                features: new Map([...basePattern.features]),
            });
            const { matches, metrics } = await recognizer.recognizePatterns(similarPattern.features);
            expect(matches.length).toBeGreaterThan(0);
            expect(matches[0].confidence).toBeGreaterThan(0.8);
        });
        it('should handle pattern timeouts gracefully', async () => {
            const pattern = (0, test_helpers_1.createMockPattern)();
            const timeoutRecognizer = new pattern_recognizer_1.PatternRecognizer({ timeout: 1 });
            await expect((0, test_helpers_1.runWithTimeout)(timeoutRecognizer.recognizePatterns(pattern.features), 50)).rejects.toThrow();
        });
        it('should maintain recognition accuracy under load', async () => {
            const patterns = (0, test_helpers_1.createMockPatterns)(100);
            const recognitionResults = await Promise.all(patterns.map(pattern => recognizer.recognizePatterns(pattern.features)));
            const avgLatency = recognitionResults.reduce((sum, result) => sum + result.metrics.patternRecognitionLatency, 0) / recognitionResults.length;
            expect(avgLatency).toBeLessThan(50);
        });
    });
    describe('Pattern Validation', () => {
        it('should validate pattern structure comprehensively', () => {
            const validPattern = (0, test_helpers_1.createMockPattern)();
            const result = validator.validate(validPattern);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });
        it('should detect and report multiple validation issues', () => {
            const invalidPattern = {
                features: 'not a map',
                confidence: 2,
                timestamp: 'invalid date',
                metadata: {},
            };
            const result = validator.validate(invalidPattern);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
        it('should handle edge cases in validation', () => {
            const edgeCases = [
                (0, test_helpers_1.createMockPattern)({ confidence: 0 }),
                (0, test_helpers_1.createMockPattern)({ confidence: 1 }),
                (0, test_helpers_1.createMockPattern)({ features: new Map() }),
            ];
            edgeCases.forEach(pattern => {
                const result = validator.validate(pattern);
                expect(result.metadata.validationDuration).toBeDefined();
            });
        });
    });
    describe('Pattern Storage', () => {
        it('should maintain data integrity during storage operations', async () => {
            const pattern = (0, test_helpers_1.createMockPattern)();
            await storage.store(pattern);
            const retrieved = await storage.retrieve(pattern.id);
            expect(retrieved).toEqual(pattern);
        });
        it('should handle concurrent storage operations', async () => {
            const patterns = (0, test_helpers_1.createMockPatterns)(10);
            const operations = patterns.map(pattern => storage.store(pattern));
            await expect(Promise.all(operations)).resolves.not.toThrow();
        });
        it('should optimize storage when reaching capacity', async () => {
            const smallStorage = new pattern_storage_1.PatternStorage({ maxPatterns: 10 }, validator);
            const patterns = (0, test_helpers_1.createMockPatterns)(15);
            for (const pattern of patterns) {
                await smallStorage.store(pattern);
                await (0, test_helpers_1.waitFor)(10); // Allow time for optimization
            }
            const metrics = smallStorage.getMetrics();
            expect(metrics.resourceUsage.storageUsage).toBeLessThanOrEqual(10);
            expect(metrics.optimizationEffectiveness).toBeGreaterThan(0);
        });
    });
    describe('System Integration', () => {
        it('should maintain performance under integrated operations', async () => {
            performanceMonitor.start();
            const pattern = (0, test_helpers_1.createMockPattern)();
            // Validate -> Store -> Recognize pipeline
            const validationResult = validator.validate(pattern);
            expect(validationResult.isValid).toBe(true);
            await storage.store(pattern);
            const { matches } = await recognizer.recognizePatterns(pattern.features);
            const totalTime = performanceMonitor.measure('integrated');
            expect(totalTime).toBeLessThan(100); // Combined operations under 100ms
            expect(matches).toBeDefined();
        });
        it('should handle error conditions gracefully', async () => {
            const invalidPattern = (0, test_helpers_1.createMockPattern)();
            invalidPattern.features = new Map(); // Empty features
            const validationResult = validator.validate(invalidPattern);
            expect(validationResult.isValid).toBe(false);
            await expect(storage.store(invalidPattern)).rejects.toBeDefined();
        });
    });
});
//# sourceMappingURL=feature-memory.test.js.map