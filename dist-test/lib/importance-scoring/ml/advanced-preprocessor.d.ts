import { PreprocessorConfig, PreprocessingResult } from './types';
export declare class AdvancedPreprocessor {
    private config;
    private statistics;
    private featureNames;
    constructor(config: PreprocessorConfig);
    private validateConfig;
    private initializeStatistics;
    preprocessFeatures(data: number[][]): Promise<PreprocessingResult>;
    private handleMissingValues;
    private calculateReplacement;
    private handleOutliers;
    private detectOutliers;
    private engineerFeatures;
    private normalizeFeatures;
    private calculateNormalizationStats;
    private updateFeatureNames;
    private collectTransformations;
}
