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
exports.ImportanceTrainingPipeline = void 0;
const tf = __importStar(require("@tensorflow/tfjs"));
class ImportanceTrainingPipeline {
    constructor(inputFeatureSize) {
        this.trainingBuffer = [];
        this.minTrainingExamples = 100;
        this.inputFeatureSize = inputFeatureSize;
        this.initializeModel();
    }
    initializeModel() {
        this.model = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    inputShape: [this.inputFeatureSize]
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.1 }),
                tf.layers.dense({
                    units: 1,
                    activation: 'sigmoid'
                })
            ]
        });
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });
    }
    async trainModel() {
        if (this.trainingBuffer.length < this.minTrainingExamples) {
            throw new Error('Insufficient training data');
        }
        const startTime = Date.now();
        const processedData = await this.preprocessData(this.trainingBuffer);
        const history = await this.model.fit(processedData.features, processedData.labels, {
            batchSize: 32,
            epochs: 10,
            validationSplit: 0.2,
            callbacks: [
                {
                    onEpochEnd: async (epoch, logs) => {
                        console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
                    }
                }
            ]
        });
        // Clear training buffer after successful training
        this.trainingBuffer = [];
        return history;
    }
    async preprocessData(data) {
        // Convert features and labels to tensors
        const features = tf.tensor2d(data.map(example => example.features));
        const labels = tf.tensor2d(data.map(example => [example.label]));
        return { features, labels };
    }
    async addTrainingExample(example) {
        this.trainingBuffer.push(example);
        if (this.trainingBuffer.length >= this.minTrainingExamples) {
            await this.trainModel();
        }
    }
    async saveModel(path) {
        await this.model.save(`file://${path}`);
    }
    async loadModel(path) {
        this.model = await tf.loadLayersModel(`file://${path}`);
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });
    }
    calculateConfidenceScore(history) {
        const lastEpochIndex = history.history.loss.length - 1;
        const validationAccuracy = history.history.val_acc?.[lastEpochIndex] || 0;
        const validationLoss = history.history.val_loss?.[lastEpochIndex] || 1;
        return (validationAccuracy * (1 - Math.min(validationLoss, 1))) / 2;
    }
}
exports.ImportanceTrainingPipeline = ImportanceTrainingPipeline;
//# sourceMappingURL=training-pipeline.js.map