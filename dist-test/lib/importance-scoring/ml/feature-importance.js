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
exports.FeatureImportanceAnalyzer = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
class FeatureImportanceAnalyzer {
    constructor(featureNames) {
        this.features = new Map();
        this.featureNames = [];
        this.featureNames = featureNames;
        featureNames.forEach(feature => {
            this.features.set(feature, {
                contribution: 0,
                correlation: 0,
                stability: 0
            });
        });
    }
    async calculateFeatureImportance(model, dataset) {
        const baselineScore = await this.getBaselinePrediction(model, dataset);
        const importanceScores = await Promise.all(this.featureNames.map(async (feature) => {
            const permutedScore = await this.calculatePermutationImportance(model, dataset, feature);
            const contribution = Math.abs(baselineScore - permutedScore);
            const correlation = await this.calculateCorrelation(dataset, feature);
            const stability = await this.calculateStability(model, dataset, feature);
            this.features.set(feature, {
                contribution,
                correlation,
                stability
            });
            // Weighted importance score combining all metrics
            const importance = (contribution * 0.5 + // Higher weight for direct contribution
                correlation * 0.3 + // Medium weight for correlation
                stability * 0.2 // Lower weight for stability
            );
            return {
                feature,
                importance
            };
        }));
        return importanceScores.sort((a, b) => b.importance - a.importance);
    }
    async getBaselinePrediction(model, dataset) {
        const predictions = model.predict(dataset);
        const meanPrediction = await predictions.mean().data();
        predictions.dispose();
        return meanPrediction[0];
    }
    async calculatePermutationImportance(model, dataset, feature) {
        const featureIndex = this.featureNames.indexOf(feature);
        if (featureIndex === -1) {
            throw new Error(`Feature ${feature} not found`);
        }
        return tf.tidy(() => {
            // Create a copy of the dataset
            const permutedData = dataset.clone();
            const values = dataset.slice([0, featureIndex], [-1, 1]);
            // Shuffle the feature values
            const shuffledValues = tf.tensor1d(this.shuffleArray(Array.from(values.dataSync())));
            // Replace the feature column
            const indices = tf.range(0, permutedData.shape[0]).reshape([-1, 1]);
            const updated = permutedData.scatter(indices, shuffledValues);
            // Get predictions with permuted feature
            const predictions = model.predict(updated);
            const meanPrediction = predictions.mean().dataSync()[0];
            return meanPrediction;
        });
    }
    async calculateCorrelation(dataset, feature) {
        const featureIndex = this.featureNames.indexOf(feature);
        if (featureIndex === -1) {
            throw new Error(`Feature ${feature} not found`);
        }
        return tf.tidy(() => {
            const featureValues = dataset.slice([0, featureIndex], [-1, 1]);
            const target = dataset.slice([0, -1], [-1, 1]); // Assuming last column is target
            const meanX = featureValues.mean();
            const meanY = target.mean();
            const centeredX = featureValues.sub(meanX);
            const centeredY = target.sub(meanY);
            const numerator = centeredX.mul(centeredY).mean();
            const denominator = centeredX.square().mean().sqrt()
                .mul(centeredY.square().mean().sqrt());
            const correlation = numerator.div(denominator);
            return Math.abs(correlation.dataSync()[0]); // Return absolute correlation
        });
    }
    async calculateStability(model, dataset, feature) {
        const NUM_ITERATIONS = 5;
        const predictions = [];
        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const permutedScore = await this.calculatePermutationImportance(model, dataset, feature);
            predictions.push(permutedScore);
        }
        // Calculate coefficient of variation (lower means more stable)
        const mean = predictions.reduce((a, b) => a + b) / predictions.length;
        const variance = predictions.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / predictions.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean;
        // Convert to stability score (1 - cv, normalized to [0,1])
        return 1 / (1 + cv);
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    getFeatureMetrics(feature) {
        return this.features.get(feature);
    }
    getAllFeatureMetrics() {
        return new Map(this.features);
    }
}
exports.FeatureImportanceAnalyzer = FeatureImportanceAnalyzer;
//# sourceMappingURL=feature-importance.js.map