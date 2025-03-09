"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedPreprocessor = void 0;
const types_1 = require("./types");
class AdvancedPreprocessor {
    constructor(config) {
        this.validateConfig(config);
        this.config = config;
        this.statistics = this.initializeStatistics();
        this.featureNames = [];
    }
    validateConfig(config) {
        if (!config.missingValueStrategy || !config.outlierDetectionMethod || !config.normalizationMethod) {
            throw new types_1.ValidationError('Invalid preprocessor configuration: missing required fields');
        }
    }
    initializeStatistics() {
        return {
            missingValues: {
                total: 0,
                handledCount: 0,
                strategy: this.config.missingValueStrategy
            },
            outliers: {
                detected: 0,
                handled: 0,
                method: this.config.outlierDetectionMethod
            },
            featureEngineering: {
                originalFeatures: 0,
                engineeredFeatures: 0,
                interactions: 0
            },
            normalization: {
                method: this.config.normalizationMethod,
                statistics: new Map()
            }
        };
    }
    async preprocessFeatures(data) {
        try {
            if (!data.length || !data[0]?.length) {
                throw new types_1.ValidationError('Input data is empty or malformed');
            }
            // 1. Handle missing values
            const withoutMissing = await this.handleMissingValues(data);
            // 2. Detect and handle outliers
            const withoutOutliers = await this.handleOutliers(withoutMissing);
            // 3. Engineer features
            const engineered = await this.engineerFeatures(withoutOutliers);
            // 4. Normalize features
            const normalized = await this.normalizeFeatures(engineered);
            // Update feature names
            this.updateFeatureNames(normalized[0].length);
            // Prepare processed data
            const processedData = {
                processedFeatures: normalized,
                labels: [],
                featureNames: this.featureNames,
                transformations: this.collectTransformations()
            };
            return {
                processedData,
                statistics: this.statistics
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new types_1.PreprocessingError(`Preprocessing failed: ${error.message}`);
            }
            throw new types_1.PreprocessingError('Preprocessing failed with an unknown error');
        }
    }
    async handleMissingValues(data) {
        const result = data.map(row => [...row]);
        const columnCount = data[0].length;
        for (let col = 0; col < columnCount; col++) {
            const column = data.map(row => row[col]);
            const missingCount = column.filter(val => val === null || isNaN(val)).length;
            this.statistics.missingValues.total += missingCount;
            if (missingCount > 0) {
                const replacement = this.calculateReplacement(column, this.config.missingValueStrategy);
                result.forEach((row, i) => {
                    if (row[col] === null || isNaN(row[col])) {
                        row[col] = replacement;
                        this.statistics.missingValues.handledCount++;
                    }
                });
            }
        }
        return result;
    }
    calculateReplacement(values, strategy) {
        const validValues = values.filter(v => v !== null && !isNaN(v));
        if (!validValues.length)
            return 0;
        switch (strategy) {
            case 'mean':
                return validValues.reduce((a, b) => a + b, 0) / validValues.length;
            case 'median': {
                const sorted = [...validValues].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            }
            case 'mode': {
                const counts = new Map();
                validValues.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
                let mode = validValues[0];
                let maxCount = 0;
                counts.forEach((count, value) => {
                    if (count > maxCount) {
                        maxCount = count;
                        mode = value;
                    }
                });
                return mode;
            }
            case 'constant':
                return 0;
            default:
                throw new types_1.ValidationError(`Unknown missing value strategy: ${strategy}`);
        }
    }
    async handleOutliers(data) {
        const result = data.map(row => [...row]);
        const columnCount = data[0].length;
        for (let col = 0; col < columnCount; col++) {
            const column = data.map(row => row[col]);
            const outliers = this.detectOutliers(column);
            this.statistics.outliers.detected += outliers.length;
            if (outliers.length > 0) {
                const validValues = column.filter((_, i) => !outliers.includes(i));
                const replacement = this.calculateReplacement(validValues, 'median');
                outliers.forEach(idx => {
                    result[idx][col] = replacement;
                    this.statistics.outliers.handled++;
                });
            }
        }
        return result;
    }
    detectOutliers(values) {
        const outlierIndices = [];
        if (this.config.outlierDetectionMethod === 'zscore') {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
            const threshold = 3; // Standard 3-sigma rule
            values.forEach((value, index) => {
                if (Math.abs((value - mean) / std) > threshold) {
                    outlierIndices.push(index);
                }
            });
        }
        else if (this.config.outlierDetectionMethod === 'iqr') {
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            values.forEach((value, index) => {
                if (value < lowerBound || value > upperBound) {
                    outlierIndices.push(index);
                }
            });
        }
        return outlierIndices;
    }
    async engineerFeatures(data) {
        const result = data.map(row => [...row]);
        this.statistics.featureEngineering.originalFeatures = data[0].length;
        if (this.config.featureEngineeringConfig.interactions) {
            // Add interaction terms
            for (let i = 0; i < data[0].length; i++) {
                for (let j = i + 1; j < data[0].length; j++) {
                    data.forEach((row, idx) => {
                        result[idx].push(row[i] * row[j]);
                    });
                    this.statistics.featureEngineering.interactions++;
                }
            }
        }
        if (this.config.featureEngineeringConfig.polynomialDegree > 1) {
            // Add polynomial features
            for (let i = 0; i < data[0].length; i++) {
                for (let degree = 2; degree <= this.config.featureEngineeringConfig.polynomialDegree; degree++) {
                    data.forEach((row, idx) => {
                        result[idx].push(Math.pow(row[i], degree));
                    });
                }
            }
        }
        this.statistics.featureEngineering.engineeredFeatures = result[0].length;
        return result;
    }
    async normalizeFeatures(data) {
        const result = data.map(row => [...row]);
        const columnCount = data[0].length;
        for (let col = 0; col < columnCount; col++) {
            const column = data.map(row => row[col]);
            const stats = this.calculateNormalizationStats(column);
            this.statistics.normalization.statistics.set(`feature_${col}`, stats);
            if (this.config.normalizationMethod === 'standardization') {
                data.forEach((row, i) => {
                    result[i][col] = (row[col] - stats.mean) / (stats.std || 1);
                });
            }
            else if (this.config.normalizationMethod === 'minmax') {
                const range = stats.max - stats.min;
                data.forEach((row, i) => {
                    result[i][col] = range === 0 ? 0 : (row[col] - stats.min) / range;
                });
            }
        }
        return result;
    }
    calculateNormalizationStats(values) {
        const stats = {};
        if (this.config.normalizationMethod === 'standardization') {
            stats.mean = values.reduce((a, b) => a + b, 0) / values.length;
            stats.std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - stats.mean, 2), 0) / values.length);
        }
        else if (this.config.normalizationMethod === 'minmax') {
            stats.min = Math.min(...values);
            stats.max = Math.max(...values);
        }
        return stats;
    }
    updateFeatureNames(totalFeatures) {
        const baseFeatures = Array.from({ length: this.statistics.featureEngineering.originalFeatures }, (_, i) => `feature_${i}`);
        const interactionFeatures = Array.from({ length: this.statistics.featureEngineering.interactions }, (_, i) => `interaction_${i}`);
        const polynomialFeatures = Array.from({ length: totalFeatures - baseFeatures.length - interactionFeatures.length }, (_, i) => `polynomial_${i}`);
        this.featureNames = [...baseFeatures, ...interactionFeatures, ...polynomialFeatures];
    }
    collectTransformations() {
        return new Map([
            ['missingValues', {
                    strategy: this.config.missingValueStrategy,
                    statistics: this.statistics.missingValues
                }],
            ['outliers', {
                    method: this.config.outlierDetectionMethod,
                    statistics: this.statistics.outliers
                }],
            ['featureEngineering', {
                    config: this.config.featureEngineeringConfig,
                    statistics: this.statistics.featureEngineering
                }],
            ['normalization', {
                    method: this.config.normalizationMethod,
                    statistics: this.statistics.normalization.statistics
                }]
        ]);
    }
}
exports.AdvancedPreprocessor = AdvancedPreprocessor;
//# sourceMappingURL=advanced-preprocessor.js.map