/// <reference types="node" />
import { EventEmitter } from 'events';
import { PipelineConfig, TrainingMetrics, TFSequentialModel } from './types';
export declare class IntegratedMLPipeline extends EventEmitter {
    private preprocessor;
    private model;
    private pipelineState;
    private config;
    constructor(config: PipelineConfig);
    private validateConfig;
    train(rawData: any[]): Promise<{
        model: TFSequentialModel;
        metrics: TrainingMetrics;
    }>;
    predict(newData: any[]): Promise<number[]>;
    private createModel;
    private trainModel;
    private convertToTensors;
    private applyPreprocessing;
    private applyTransformation;
    private applyMissingValueTransform;
    private applyOutlierTransform;
    private applyFeatureEngineeringTransform;
    private applyNormalizationTransform;
    private isOutlier;
    private postProcessPredictions;
    private updateTrainingProgress;
    private calculateTrainingMetrics;
    private calculateConfidenceScore;
    saveModel(path: string): Promise<void>;
    loadModel(path: string): Promise<void>;
}
