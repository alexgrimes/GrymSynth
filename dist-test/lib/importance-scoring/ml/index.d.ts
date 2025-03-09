export * from './types';
export * from './advanced-preprocessor';
export * from './integrated-pipeline';
export declare const defaultPreprocessorConfig: {
    missingValueStrategy: "mean";
    outlierDetectionMethod: "zscore";
    featureEngineeringConfig: {
        interactions: boolean;
        polynomialDegree: number;
    };
    normalizationMethod: "standardization";
};
export declare const defaultPipelineConfig: {
    preprocessing: {
        missingValueStrategy: "mean";
        outlierDetectionMethod: "zscore";
        featureEngineeringConfig: {
            interactions: boolean;
            polynomialDegree: number;
        };
        normalizationMethod: "standardization";
    };
    training: {
        batchSize: number;
        epochs: number;
        validationSplit: number;
        earlyStoppingPatience: number;
    };
    model: {
        layers: number[];
        dropoutRate: number;
        learningRate: number;
    };
};
