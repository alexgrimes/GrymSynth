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
exports.IntegratedMLPipeline = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
const events_1 = require("events");
const types_1 = require("./types");
const advanced_preprocessor_1 = require("./advanced-preprocessor");
class IntegratedMLPipeline extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.validateConfig(config);
        this.config = config;
        this.preprocessor = new advanced_preprocessor_1.AdvancedPreprocessor(config.preprocessing);
        this.model = null;
        this.pipelineState = {
            preprocessedData: null,
            features: [],
            transformations: new Map()
        };
    }
    validateConfig(config) {
        if (!config.preprocessing || !config.training || !config.model) {
            throw new types_1.ValidationError('Invalid pipeline configuration: missing required sections');
        }
        if (!Array.isArray(config.model.layers) || config.model.layers.length === 0) {
            throw new types_1.ValidationError('Invalid model configuration: layers must be a non-empty array');
        }
    }
    async train(rawData) {
        try {
            // 1. Preprocess Data
            const preprocessed = await this.preprocessor.preprocessFeatures(rawData);
            this.pipelineState = {
                preprocessedData: preprocessed.processedData,
                features: preprocessed.processedData.featureNames,
                transformations: preprocessed.processedData.transformations
            };
            // 2. Convert to tensors
            const tensors = await this.convertToTensors(preprocessed.processedData);
            // 3. Create and train model
            this.model = await this.createModel(tensors.features.shape[1], this.config.model);
            // 4. Train model
            const trainingMetrics = await this.trainModel(tensors);
            return {
                model: this.model,
                metrics: trainingMetrics
            };
        }
        catch (error) {
            if (error instanceof Error) {
                if (error instanceof types_1.PreprocessingError) {
                    throw error;
                }
                throw new types_1.ModelError(`Training pipeline error: ${error.message}`);
            }
            throw new types_1.ModelError('Training pipeline failed with an unknown error');
        }
    }
    async predict(newData) {
        try {
            if (!this.model) {
                throw new types_1.ModelError('Model not trained. Call train() first.');
            }
            // 1. Preprocess using saved transformations
            const preprocessed = await this.applyPreprocessing(newData);
            // 2. Convert to tensor
            const tensor = await this.convertToTensors(preprocessed);
            // 3. Get predictions
            const predictions = this.model.predict(tensor.features);
            // 4. Post-process predictions
            const processedPredictions = await this.postProcessPredictions(predictions);
            return processedPredictions;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_1.ModelError(`Prediction error: ${error.message}`);
            }
            throw new types_1.ModelError('Prediction failed with an unknown error');
        }
    }
    async createModel(inputFeatures, config) {
        const model = tf.sequential();
        // Input layer
        model.add(tf.layers.dense({
            units: config.layers[0],
            activation: 'relu',
            inputShape: [inputFeatures]
        }));
        // Hidden layers
        for (const units of config.layers.slice(1)) {
            model.add(tf.layers.dense({ units, activation: 'relu' }));
            model.add(tf.layers.dropout({ rate: config.dropoutRate }));
        }
        // Output layer
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({
            optimizer: tf.train.adam(config.learningRate),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });
        return model;
    }
    async trainModel(tensors) {
        const { features, labels } = tensors;
        const trainLogs = await this.model.fit(features, labels, {
            batchSize: this.config.training.batchSize,
            epochs: this.config.training.epochs,
            validationSplit: this.config.training.validationSplit,
            callbacks: [
                {
                    onEpochEnd: async (epoch, logs) => {
                        await this.updateTrainingProgress(epoch, logs);
                    }
                }
            ]
        });
        return this.calculateTrainingMetrics(trainLogs);
    }
    async convertToTensors(data) {
        return tf.tidy(() => {
            const features = tf.tensor2d(data.processedFeatures);
            const labels = tf.tensor2d(data.labels.map((l) => [l]));
            return { features, labels };
        });
    }
    async applyPreprocessing(data) {
        if (!this.pipelineState.transformations) {
            throw new types_1.PreprocessingError('No preprocessing state available. Train the model first.');
        }
        // Apply saved transformations in the correct order
        const orderedTransformations = [
            'missingValues',
            'outliers',
            'featureEngineering',
            'normalization'
        ];
        let processedData = [...data];
        for (const transform of orderedTransformations) {
            const transformConfig = this.pipelineState.transformations.get(transform);
            if (transformConfig) {
                processedData = await this.applyTransformation(processedData, transformConfig);
            }
        }
        return {
            processedFeatures: processedData,
            labels: [],
            featureNames: this.pipelineState.features
        };
    }
    async applyTransformation(data, config) {
        // Apply the transformation based on saved configuration
        switch (config.type) {
            case 'missingValues':
                return this.applyMissingValueTransform(data, config);
            case 'outliers':
                return this.applyOutlierTransform(data, config);
            case 'featureEngineering':
                return this.applyFeatureEngineeringTransform(data, config);
            case 'normalization':
                return this.applyNormalizationTransform(data, config);
            default:
                throw new types_1.PreprocessingError(`Unknown transformation type: ${config.type}`);
        }
    }
    async applyMissingValueTransform(data, config) {
        // Apply missing value handling using saved statistics
        return data.map(row => row.map((value, index) => {
            if (value === null || isNaN(value)) {
                const stats = config.statistics[`feature_${index}`];
                return stats.replacement;
            }
            return value;
        }));
    }
    async applyOutlierTransform(data, config) {
        // Apply outlier handling using saved statistics
        return data.map(row => row.map((value, index) => {
            const stats = config.statistics[`feature_${index}`];
            if (this.isOutlier(value, stats)) {
                return stats.replacement;
            }
            return value;
        }));
    }
    async applyFeatureEngineeringTransform(data, config) {
        // Apply feature engineering using saved configuration
        const result = [...data];
        if (config.interactions) {
            // Add interaction terms
            for (let i = 0; i < data[0].length; i++) {
                for (let j = i + 1; j < data[0].length; j++) {
                    data.forEach((row, idx) => {
                        result[idx].push(row[i] * row[j]);
                    });
                }
            }
        }
        return result;
    }
    async applyNormalizationTransform(data, config) {
        // Apply normalization using saved statistics
        return data.map(row => row.map((value, index) => {
            const stats = config.statistics[`feature_${index}`];
            if (config.method === 'standardization') {
                return (value - stats.mean) / (stats.std || 1);
            }
            else if (config.method === 'minmax') {
                const range = stats.max - stats.min;
                return range === 0 ? 0 : (value - stats.min) / range;
            }
            return value;
        }));
    }
    isOutlier(value, stats) {
        if (stats.method === 'zscore') {
            return Math.abs((value - stats.mean) / stats.std) > 3;
        }
        else if (stats.method === 'iqr') {
            return value < stats.lowerBound || value > stats.upperBound;
        }
        return false;
    }
    async postProcessPredictions(predictions) {
        const predArray = await predictions.array();
        return predArray.map((p) => p[0]);
    }
    async updateTrainingProgress(epoch, logs) {
        const metrics = {
            epoch,
            loss: logs.loss,
            valLoss: logs.val_loss,
            mae: logs.mae,
            valMae: logs.val_mae
        };
        this.emit('trainingProgress', metrics);
    }
    calculateTrainingMetrics(trainResults) {
        const lastEpoch = trainResults.history.loss.length - 1;
        return {
            accuracy: trainResults.history.acc?.[lastEpoch] || 0,
            loss: trainResults.history.loss[lastEpoch],
            confidenceScore: this.calculateConfidenceScore(trainResults),
            featureImportance: new Map() // Feature importance would be calculated separately
        };
    }
    calculateConfidenceScore(trainResults) {
        const validationAccuracy = trainResults.history.val_acc?.[trainResults.history.val_acc.length - 1] || 0;
        const validationLoss = trainResults.history.val_loss?.[trainResults.history.val_loss.length - 1] || 0;
        return (validationAccuracy * (1 - Math.min(validationLoss, 1))) / 2;
    }
    // Model persistence methods
    async saveModel(path) {
        if (!this.model) {
            throw new types_1.ModelError('No model to save. Train the model first.');
        }
        await this.model.save(`file://${path}`);
    }
    async loadModel(path) {
        this.model = await tf.loadLayersModel(`file://${path}`);
    }
}
exports.IntegratedMLPipeline = IntegratedMLPipeline;
//# sourceMappingURL=integrated-pipeline.js.map