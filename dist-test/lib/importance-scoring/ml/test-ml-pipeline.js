"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe('ML Pipeline Integration Tests', () => {
    let preprocessor;
    let pipeline;
    beforeEach(() => {
        preprocessor = new index_1.AdvancedPreprocessor(index_1.defaultPreprocessorConfig);
        pipeline = new index_1.IntegratedMLPipeline(index_1.defaultPipelineConfig);
    });
    describe('AdvancedPreprocessor', () => {
        const sampleData = [
            [1, 2, NaN],
            [4, NaN, 6],
            [7, 8, 9],
            [10, 11, 12]
        ];
        test('should handle missing values correctly', async () => {
            const result = await preprocessor.preprocessFeatures(sampleData);
            expect(result.statistics.missingValues.total).toBe(2);
            expect(result.statistics.missingValues.handledCount).toBe(2);
            expect(result.processedData.processedFeatures.length).toBe(4);
            expect(result.processedData.processedFeatures[0].length).toBe(3);
        });
        test('should detect and handle outliers', async () => {
            const dataWithOutliers = [
                [1, 2, 3],
                [2, 3, 4],
                [2, 3, 100],
                [1, 2, 3]
            ];
            const result = await preprocessor.preprocessFeatures(dataWithOutliers);
            expect(result.statistics.outliers.detected).toBeGreaterThan(0);
        });
        test('should perform feature engineering', async () => {
            const result = await preprocessor.preprocessFeatures(sampleData);
            expect(result.processedData.processedFeatures[0].length).toBeGreaterThan(3);
            expect(result.statistics.featureEngineering.interactions).toBeGreaterThan(0);
        });
        test('should normalize features', async () => {
            const result = await preprocessor.preprocessFeatures(sampleData);
            const normalizedFeatures = result.processedData.processedFeatures;
            // Check if values are normalized (between -1 and 1 for standardization)
            normalizedFeatures.forEach(row => {
                row.forEach(value => {
                    expect(Math.abs(value)).toBeLessThanOrEqual(5); // Reasonable range for standardized data
                });
            });
        });
        test('should throw error for invalid data', async () => {
            await expect(preprocessor.preprocessFeatures([])).rejects.toThrow(index_1.PreprocessingError);
        });
    });
    describe('IntegratedMLPipeline', () => {
        const sampleTrainingData = Array.from({ length: 100 }, () => ({
            features: Array.from({ length: 5 }, () => Math.random() * 10),
            label: Math.random()
        }));
        test('should train model successfully', async () => {
            const rawData = sampleTrainingData.map(d => d.features);
            const result = await pipeline.train(rawData);
            expect(result.model).toBeDefined();
            expect(result.metrics.loss).toBeDefined();
            expect(result.metrics.accuracy).toBeDefined();
        });
        test('should make predictions', async () => {
            // First train the model
            const rawData = sampleTrainingData.map(d => d.features);
            await pipeline.train(rawData);
            // Then make predictions
            const testData = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => Math.random() * 10));
            const predictions = await pipeline.predict(testData);
            expect(predictions).toHaveLength(5);
            predictions.forEach(pred => {
                expect(typeof pred).toBe('number');
            });
        });
        test('should throw error when predicting without training', async () => {
            const testData = [[1, 2, 3, 4, 5]];
            await expect(pipeline.predict(testData)).rejects.toThrow(index_1.ModelError);
        });
        test('should handle training progress events', async () => {
            const progressEvents = [];
            pipeline.on('trainingProgress', (metrics) => {
                progressEvents.push(metrics);
            });
            const rawData = sampleTrainingData.map(d => d.features);
            await pipeline.train(rawData);
            expect(progressEvents.length).toBeGreaterThan(0);
            progressEvents.forEach(event => {
                expect(event.epoch).toBeDefined();
                expect(event.loss).toBeDefined();
            });
        });
        test('should save and load model', async () => {
            // Train the model
            const rawData = sampleTrainingData.map(d => d.features);
            await pipeline.train(rawData);
            // Save the model
            const modelPath = 'file://./test-model';
            await pipeline.saveModel(modelPath);
            // Create new pipeline and load the model
            const newPipeline = new index_1.IntegratedMLPipeline(index_1.defaultPipelineConfig);
            await newPipeline.loadModel(modelPath);
            // Make predictions with both models
            const testData = [[1, 2, 3, 4, 5]];
            const predictions1 = await pipeline.predict(testData);
            const predictions2 = await newPipeline.predict(testData);
            // Predictions should be similar (not exactly equal due to floating point)
            expect(Math.abs(predictions1[0] - predictions2[0])).toBeLessThan(1e-5);
        });
    });
    describe('Pipeline Configuration', () => {
        test('should validate configuration correctly', () => {
            expect(() => new index_1.IntegratedMLPipeline({
                ...index_1.defaultPipelineConfig,
                model: {
                    ...index_1.defaultPipelineConfig.model,
                    layers: [] // Invalid: empty layers array
                }
            })).toThrow(index_1.ValidationError);
        });
        test('should handle different model architectures', async () => {
            const customConfig = {
                ...index_1.defaultPipelineConfig,
                model: {
                    ...index_1.defaultPipelineConfig.model,
                    layers: [32, 16, 8],
                    dropoutRate: 0.3
                }
            };
            const customPipeline = new index_1.IntegratedMLPipeline(customConfig);
            const rawData = Array.from({ length: 50 }, () => Array.from({ length: 5 }, () => Math.random() * 10));
            const result = await customPipeline.train(rawData);
            expect(result.model).toBeDefined();
            expect(result.metrics.loss).toBeDefined();
        });
    });
});
//# sourceMappingURL=test-ml-pipeline.js.map