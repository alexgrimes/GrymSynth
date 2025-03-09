"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelEvaluator = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
class ModelEvaluator {
    async evaluateModel(model, testData) {
        const startTime = Date.now();
        // Calculate performance metrics
        const performanceMetrics = await this.calculatePerformanceMetrics(model, testData);
        // Calculate stability metrics
        const stabilityMetrics = await this.assessModelStability(model, testData);
        // Calculate resource usage
        const endTime = Date.now();
        const resourceMetrics = {
            inferenceTime: endTime - startTime,
            memoryUsage: await this.measureMemoryUsage(model)
        };
        return {
            performance: performanceMetrics,
            stability: stabilityMetrics,
            resourceUsage: resourceMetrics
        };
    }
    async calculatePerformanceMetrics(model, testData) {
        return tf.tidy(() => {
            const predictions = model.predict(testData.features);
            const binaryPredictions = predictions.greater(ModelEvaluator.PREDICTION_THRESHOLD);
            const confusionMatrix = this.calculateConfusionMatrix(binaryPredictions, testData.labels);
            const accuracy = this.calculateAccuracy(confusionMatrix);
            const precision = this.calculatePrecision(confusionMatrix);
            const recall = this.calculateRecall(confusionMatrix);
            const f1Score = this.calculateF1Score(precision, recall);
            return {
                accuracy,
                precision,
                recall,
                f1Score
            };
        });
    }
    calculateConfusionMatrix(predictions, labels) {
        const predArray = predictions.dataSync();
        const labelArray = labels.dataSync();
        let truePositives = 0;
        let falsePositives = 0;
        let trueNegatives = 0;
        let falseNegatives = 0;
        for (let i = 0; i < predArray.length; i++) {
            if (predArray[i] === 1 && labelArray[i] === 1) {
                truePositives++;
            }
            else if (predArray[i] === 1 && labelArray[i] === 0) {
                falsePositives++;
            }
            else if (predArray[i] === 0 && labelArray[i] === 0) {
                trueNegatives++;
            }
            else {
                falseNegatives++;
            }
        }
        return {
            truePositives,
            falsePositives,
            trueNegatives,
            falseNegatives
        };
    }
    calculateAccuracy(cm) {
        const total = cm.truePositives + cm.trueNegatives + cm.falsePositives + cm.falseNegatives;
        return total > 0 ? (cm.truePositives + cm.trueNegatives) / total : 0;
    }
    calculatePrecision(cm) {
        return cm.truePositives + cm.falsePositives > 0
            ? cm.truePositives / (cm.truePositives + cm.falsePositives)
            : 0;
    }
    calculateRecall(cm) {
        return cm.truePositives + cm.falseNegatives > 0
            ? cm.truePositives / (cm.truePositives + cm.falseNegatives)
            : 0;
    }
    calculateF1Score(precision, recall) {
        return precision + recall > 0
            ? (2 * precision * recall) / (precision + recall)
            : 0;
    }
    async assessModelStability(model, testData) {
        const NUM_ITERATIONS = 5;
        const predictions = [];
        // Run multiple predictions to assess stability
        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const result = await tf.tidy(() => {
                const preds = model.predict(testData.features);
                return Array.from(preds.dataSync());
            });
            predictions.push(result);
        }
        // Calculate variance across predictions
        const varianceScore = this.calculatePredictionVariance(predictions);
        // Calculate consistency score
        const consistencyScore = this.calculateConsistencyScore(predictions);
        return {
            varianceScore,
            consistencyScore
        };
    }
    calculatePredictionVariance(predictions) {
        const numPredictions = predictions.length;
        const numSamples = predictions[0].length;
        let totalVariance = 0;
        for (let i = 0; i < numSamples; i++) {
            const samplePredictions = predictions.map(p => p[i]);
            const mean = samplePredictions.reduce((a, b) => a + b) / numPredictions;
            const variance = samplePredictions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numPredictions;
            totalVariance += variance;
        }
        return 1 - (totalVariance / numSamples); // Normalize and invert so higher is better
    }
    calculateConsistencyScore(predictions) {
        const numPredictions = predictions.length;
        const numSamples = predictions[0].length;
        let consistentPredictions = 0;
        for (let i = 0; i < numSamples; i++) {
            const samplePredictions = predictions.map(p => p[i] > ModelEvaluator.PREDICTION_THRESHOLD);
            const allMatch = samplePredictions.every(p => p === samplePredictions[0]);
            if (allMatch)
                consistentPredictions++;
        }
        return consistentPredictions / numSamples;
    }
    async measureMemoryUsage(model) {
        // Get model memory usage through TensorFlow.js memory() API
        const memoryInfo = tf.memory();
        const modelWeights = model.getWeights();
        // Calculate total bytes used by model weights
        const weightBytes = modelWeights.reduce((total, w) => {
            const bytesPerElement = w.dtype === 'float32' ? 4 : 1; // float32 = 4 bytes, int8 = 1 byte
            return total + (w.size * bytesPerElement);
        }, 0);
        // Clean up
        modelWeights.forEach(w => w.dispose());
        // Return total memory usage (model weights + runtime memory)
        return weightBytes + memoryInfo.numBytes;
    }
}
exports.ModelEvaluator = ModelEvaluator;
ModelEvaluator.PREDICTION_THRESHOLD = 0.5;
//# sourceMappingURL=model-evaluator.js.map