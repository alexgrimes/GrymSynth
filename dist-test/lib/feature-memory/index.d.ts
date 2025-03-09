export * from './core/types';
export { PatternRecognizer } from './core/pattern-recognizer';
export { PatternValidator } from './core/pattern-validator';
export { PatternStorage } from './core/pattern-storage';
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
