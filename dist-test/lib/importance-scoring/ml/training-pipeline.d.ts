import * as tf from '@tensorflow/tfjs';
import { TrainingData } from './types';
export declare class ImportanceTrainingPipeline {
    private model;
    private trainingBuffer;
    private readonly minTrainingExamples;
    private readonly inputFeatureSize;
    constructor(inputFeatureSize: number);
    private initializeModel;
    trainModel(): Promise<tf.History>;
    private preprocessData;
    addTrainingExample(example: TrainingData): Promise<void>;
    saveModel(path: string): Promise<void>;
    loadModel(path: string): Promise<void>;
    private calculateConfidenceScore;
}
