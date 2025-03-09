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
exports.PatternStorage = exports.PatternValidator = exports.PatternRecognizer = void 0;
__exportStar(require("./core/types"), exports);
var pattern_recognizer_1 = require("./core/pattern-recognizer");
Object.defineProperty(exports, "PatternRecognizer", { enumerable: true, get: function () { return pattern_recognizer_1.PatternRecognizer; } });
var pattern_validator_1 = require("./core/pattern-validator");
Object.defineProperty(exports, "PatternValidator", { enumerable: true, get: function () { return pattern_validator_1.PatternValidator; } });
var pattern_storage_1 = require("./core/pattern-storage");
Object.defineProperty(exports, "PatternStorage", { enumerable: true, get: function () { return pattern_storage_1.PatternStorage; } });
/**
 * Feature Memory System
 *
 * A comprehensive system for pattern recognition, validation, and storage with:
 * - High-performance pattern recognition (< 50ms)
 * - Efficient storage operations (< 20ms)
 * - Memory optimization (< 100MB overhead)
 * - CPU usage optimization (< 10%)
 * - Low error rate (< 0.1%)
 *
 * Key components:
 * - PatternRecognizer: Identifies and analyzes patterns in feature sets
 * - PatternValidator: Ensures data integrity and validation
 * - PatternStorage: Manages persistent storage and retrieval
 *
 * Usage example:
 * ```typescript
 * import { PatternRecognizer, PatternValidator, PatternStorage } from './feature-memory';
 *
 * // Initialize components
 * const validator = new PatternValidator();
 * const storage = new PatternStorage({ maxPatterns: 10000 }, validator);
 * const recognizer = new PatternRecognizer();
 *
 * // Use the system
 * const pattern = {
 *   id: 'pattern_1',
 *   features: new Map([['key', 'value']]),
 *   confidence: 0.95,
 *   timestamp: new Date(),
 *   metadata: {
 *     source: 'user_input',
 *     category: 'interaction',
 *     frequency: 1,
 *     lastUpdated: new Date()
 *   }
 * };
 *
 * // Store pattern
 * await storage.store(pattern);
 *
 * // Recognize patterns
 * const matches = await recognizer.recognizePatterns(pattern.features);
 * ```
 */ 
//# sourceMappingURL=index.js.map