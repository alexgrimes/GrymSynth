import React from 'react';
import 'chart.js/auto';
interface TrainingMetricsChartProps {
    data: {
        epochs: number[];
        loss: number[];
        accuracy: number[];
        validationLoss?: number[];
        validationAccuracy?: number[];
    };
}
interface TrainingVisualizationProps {
    trainingMetrics: TrainingMetricsChartProps['data'];
    featureImportance: Map<string, number>;
}
export declare const TrainingVisualization: React.FC<TrainingVisualizationProps>;
export {};
