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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPipelineConfig = exports.defaultPreprocessorConfig = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./advanced-preprocessor"), exports);
__exportStar(require("./integrated-pipeline"), exports);
// Re-export commonly used configurations
exports.defaultPreprocessorConfig = {
    missingValueStrategy: 'mean',
    outlierDetectionMethod: 'zscore',
    featureEngineeringConfig: {
        interactions: true,
        polynomialDegree: 2
    },
    normalizationMethod: 'standardization'
};
exports.defaultPipelineConfig = {
    preprocessing: exports.defaultPreprocessorConfig,
    training: {
        batchSize: 32,
        epochs: 100,
        validationSplit: 0.2,
        earlyStoppingPatience: 10
    },
    model: {
        layers: [64, 32, 16],
        dropoutRate: 0.2,
        learningRate: 0.001
    }
};
//# sourceMappingURL=index.js.map