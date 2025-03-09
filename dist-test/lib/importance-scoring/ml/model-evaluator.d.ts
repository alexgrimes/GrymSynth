import { LayersModel, Tensor2D } from '@tensorflow/tfjs';
export interface ModelMetrics {
    performance: {
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
    };
    stability: {
        varianceScore: number;
        consistencyScore: number;
    };
    resourceUsage: {
        inferenceTime: number;
        memoryUsage: number;
    };
}
export declare class ModelEvaluator {
    private static PREDICTION_THRESHOLD;
    evaluateModel(model: LayersModel, testData: {
        features: Tensor2D;
        labels: Tensor2D;
    }): Promise<ModelMetrics>;
    private calculatePerformanceMetrics;
    private calculateConfusionMatrix;
    private calculateAccuracy;
    private calculatePrecision;
    private calculateRecall;
    private calculateF1Score;
    private assessModelStability;
    private calculatePredictionVariance;
    private calculateConsistencyScore;
    private measureMemoryUsage;
}
