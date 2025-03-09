import { Result, ModelResult, FormattedResult } from './types';
/**
 * Combines and formats results from multiple models in the chain
 */
export declare class ResultSynthesizer {
    private config;
    constructor(config?: {
        validateResults: boolean;
        requireAllPhases: boolean;
        formatOptions: {
            indentSize: number;
            maxLineLength: number;
            includeMetadata: boolean;
        };
    });
    /**
     * Combine multiple model results into a single result
     */
    combine(results: ModelResult[]): Promise<Result>;
    /**
     * Validate a combined result
     */
    validate(result: Result): boolean;
    /**
     * Format a result for output
     */
    format(result: Result): FormattedResult;
    /**
     * Validate individual results before combining
     */
    private validateResults;
    /**
     * Check if a model result is valid
     */
    private isValidModelResult;
    /**
     * Calculate total metrics from individual results
     */
    private calculateTotalMetrics;
    /**
     * Get phase name based on index
     */
    private getPhaseNameFromIndex;
    /**
     * Combine outputs from multiple results
     */
    private combineOutputs;
    /**
     * Check if all outputs are strings
     */
    private allOutputsAreStrings;
    /**
     * Check if all outputs are arrays
     */
    private allOutputsAreArrays;
    /**
     * Check if all outputs are objects
     */
    private allOutputsAreObjects;
    /**
     * Combine string outputs
     */
    private combineStringOutputs;
    /**
     * Combine array outputs
     */
    private combineArrayOutputs;
    /**
     * Combine object outputs
     */
    private combineObjectOutputs;
    /**
     * Generate metadata for the combined result
     */
    private generateMetadata;
    /**
     * Determine the output format based on content
     */
    private determineOutputFormat;
    /**
     * Check if a string looks like code
     */
    private looksLikeCode;
    /**
     * Check if an object has a complex structure
     */
    private hasComplexStructure;
    /**
     * Format data according to its type
     */
    private formatData;
    /**
     * Format code with proper indentation
     */
    private formatCode;
    /**
     * Format structured data
     */
    private formatStructured;
    /**
     * Generate a schema for the formatted data
     */
    private generateSchema;
}
