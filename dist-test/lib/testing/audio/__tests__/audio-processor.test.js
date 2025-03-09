"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_context_1 = require("../../test-context");
const error_test_utils_1 = require("../../error-test-utils");
describe('Audio Processor Integration', () => {
    let context;
    beforeEach(async () => {
        context = await test_context_1.TestContext.create();
    });
    afterEach(async () => {
        await context.cleanup();
    });
    describe('Processing Pipeline', () => {
        it('handles file processing errors', async () => {
            const audioFile = {
                id: 'audio_1',
                path: '/test/audio.wav',
                format: 'wav',
                duration: 60
            };
            const processingModel = await context.projectManager.createModel('audio_processor');
            try {
                await context.mockError(error_test_utils_1.ErrorTestUtils.createErrorWithContext('Audio processing failed', {
                    code: 'PROCESSING_ERROR',
                    details: {
                        fileId: audioFile.id,
                        stage: 'feature_extraction'
                    }
                }));
            }
            catch (error) {
                expect(context.healthMonitor.getStatus()).toBe('warning');
                expect(context.projectManager.getModel(processingModel.id)?.status).toBe('error');
            }
        });
        it('maintains processing state through pattern extraction', async () => {
            const models = await Promise.all([
                context.projectManager.createModel('feature_extractor'),
                context.projectManager.createModel('pattern_matcher')
            ]);
            // Test pipeline coordination
            try {
                await context.mockHandoffError(models[0], models[1]);
            }
            catch (error) {
                const state = context.healthMonitor.getFullState();
                expect(state.errorCount).toBe(1);
                expect(state.metrics.lastError).toBeDefined();
            }
            // Verify both models affected
            models.forEach(model => {
                expect(context.projectManager.getModel(model.id)?.status).toBe('error');
            });
        });
        it('validates processing results', async () => {
            const validationModel = await context.projectManager.createModel('validator');
            const results = {
                fileId: 'audio_1',
                features: {
                    id: 'feat_1',
                    sourceId: 'audio_1',
                    patterns: new Map([['pattern1', 0.8]]),
                    metadata: {
                        extractionTime: 1000,
                        confidence: 0.9
                    }
                },
                patterns: {
                    id: 'pat_1',
                    sourceId: 'audio_1',
                    matches: [
                        {
                            pattern: 'pattern1',
                            confidence: 0.8,
                            timestamp: Date.now()
                        }
                    ]
                },
                validationStatus: 'pass'
            };
            // Test validation failure
            const validationError = error_test_utils_1.ErrorTestUtils.createErrorWithContext('Validation failed', {
                code: 'VALIDATION_ERROR',
                details: {
                    fileId: results.fileId,
                    reason: 'Low confidence score'
                }
            });
            try {
                await context.mockError(validationError);
            }
            catch (error) {
                expect(context.healthMonitor.getStatus()).toBe('warning');
                expect(context.projectManager.getModel(validationModel.id)?.status).toBe('error');
            }
        });
        it('recovers from partial pipeline failures', async () => {
            const pipeline = await Promise.all([
                context.projectManager.createModel('feature_extractor'),
                context.projectManager.createModel('pattern_matcher'),
                context.projectManager.createModel('validator')
            ]);
            // Fail middle of pipeline
            try {
                await context.mockHandoffError(pipeline[0], pipeline[1]);
            }
            catch (error) {
                expect(context.healthMonitor.getStatus()).toBe('warning');
            }
            // Last stage should still be operational
            expect(context.projectManager.getModel(pipeline[2].id)?.status).toBe('ready');
            // Reset and verify recovery
            await context.reset();
            expect(context.healthMonitor.getStatus()).toBe('healthy');
            const newPipeline = await Promise.all([
                context.projectManager.createModel('feature_extractor'),
                context.projectManager.createModel('pattern_matcher')
            ]);
            newPipeline.forEach(model => {
                expect(model.status).toBe('ready');
            });
        });
    });
});
//# sourceMappingURL=audio-processor.test.js.map