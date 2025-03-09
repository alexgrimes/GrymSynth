import { LayersModel, Tensor2D } from '@tensorflow/tfjs';
interface FeatureMetrics {
    contribution: number;
    correlation: number;
    stability: number;
}
export declare class FeatureImportanceAnalyzer {
    private features;
    private featureNames;
    constructor(featureNames: string[]);
    calculateFeatureImportance(model: LayersModel, dataset: Tensor2D): Promise<Array<{
        feature: string;
        importance: number;
    }>>;
    private getBaselinePrediction;
    private calculatePermutationImportance;
    private calculateCorrelation;
    private calculateStability;
    private shuffleArray;
    getFeatureMetrics(feature: string): FeatureMetrics | undefined;
    getAllFeatureMetrics(): Map<string, FeatureMetrics>;
}
export {};
