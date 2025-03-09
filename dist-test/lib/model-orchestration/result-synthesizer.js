"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultSynthesizer = void 0;
const types_1 = require("./types");
/**
 * Combines and formats results from multiple models in the chain
 */
class ResultSynthesizer {
    constructor(config = {
        validateResults: true,
        requireAllPhases: false,
        formatOptions: {
            indentSize: 2,
            maxLineLength: 80,
            includeMetadata: true
        }
    }) {
        this.config = config;
    }
    /**
     * Combine multiple model results into a single result
     */
    async combine(results) {
        try {
            // Validate results if enabled
            if (this.config.validateResults) {
                this.validateResults(results);
            }
            // Check if we have any results
            if (results.length === 0) {
                throw new types_1.ModelOrchestratorError('No results to combine', 'NO_RESULTS');
            }
            // Calculate total metrics
            const metrics = this.calculateTotalMetrics(results);
            // Create phases from results
            const phases = results.map((result, index) => ({
                name: this.getPhaseNameFromIndex(index),
                status: result.success ? 'completed' : 'failed',
                result
            }));
            // Determine overall success
            const success = this.config.requireAllPhases
                ? results.every(r => r.success)
                : results.some(r => r.success);
            // Combine outputs based on result type
            const output = this.combineOutputs(results);
            return {
                success,
                output,
                phases,
                metrics,
                metadata: this.generateMetadata(results)
            };
        }
        catch (error) {
            if (error instanceof types_1.ModelOrchestratorError) {
                throw error;
            }
            throw new types_1.ModelOrchestratorError('Failed to combine results', 'COMBINATION_ERROR', { error });
        }
    }
    /**
     * Validate a combined result
     */
    validate(result) {
        // Check for required fields
        if (!result.phases || !result.metrics) {
            return false;
        }
        // Validate metrics
        if (result.metrics.totalExecutionTime < 0 ||
            result.metrics.totalMemoryUsed < 0 ||
            result.metrics.totalTokensUsed < 0) {
            return false;
        }
        // Validate phases
        for (const phase of result.phases) {
            if (!phase.name || !phase.status || !phase.result) {
                return false;
            }
            if (!['completed', 'failed', 'skipped'].includes(phase.status)) {
                return false;
            }
        }
        // Validate success flag matches phase statuses
        const successMatches = this.config.requireAllPhases
            ? result.success === result.phases.every(p => p.status === 'completed')
            : result.success === result.phases.some(p => p.status === 'completed');
        if (!successMatches) {
            return false;
        }
        return true;
    }
    /**
     * Format a result for output
     */
    format(result) {
        try {
            // Validate result before formatting
            if (!result || result.output === undefined) {
                throw new types_1.ModelOrchestratorError('Invalid result for formatting', 'INVALID_FORMAT_INPUT', { result });
            }
            // Determine initial format based on the output type
            let format = this.determineOutputFormat(result.output);
            // Format the data according to the determined format
            const formattedData = this.formatData(result.output, format);
            // For structured data, ensure proper format and schema
            if (format === 'structured' && !this.hasComplexStructure(formattedData)) {
                format = 'json';
            }
            return {
                data: formattedData,
                format,
                ...(this.config.formatOptions.includeMetadata && {
                    schema: this.generateSchema(formattedData)
                })
            };
        }
        catch (error) {
            if (error instanceof types_1.ModelOrchestratorError) {
                throw error;
            }
            throw new types_1.ModelOrchestratorError('Failed to format result', 'FORMAT_ERROR', { error });
        }
    }
    /**
     * Validate individual results before combining
     */
    validateResults(results) {
        for (const result of results) {
            if (!this.isValidModelResult(result)) {
                throw new types_1.ModelOrchestratorError('Invalid model result', 'INVALID_RESULT', { result });
            }
        }
    }
    /**
     * Check if a model result is valid
     */
    isValidModelResult(result) {
        return (typeof result.success === 'boolean' &&
            result.metrics &&
            typeof result.metrics.executionTime === 'number' &&
            typeof result.metrics.memoryUsed === 'number' &&
            typeof result.metrics.tokensUsed === 'number');
    }
    /**
     * Calculate total metrics from individual results
     */
    calculateTotalMetrics(results) {
        return {
            totalExecutionTime: results.reduce((sum, r) => sum + r.metrics.executionTime, 0),
            totalMemoryUsed: results.reduce((sum, r) => sum + r.metrics.memoryUsed, 0),
            totalTokensUsed: results.reduce((sum, r) => sum + r.metrics.tokensUsed, 0)
        };
    }
    /**
     * Get phase name based on index
     */
    getPhaseNameFromIndex(index) {
        const phases = ['planning', 'context', 'execution', 'review'];
        return phases[index] || `phase-${index}`;
    }
    /**
     * Combine outputs from multiple results
     */
    combineOutputs(results) {
        // If only one result, return its output directly
        if (results.length === 1) {
            return results[0].output;
        }
        // Handle different output types
        if (this.allOutputsAreStrings(results)) {
            return this.combineStringOutputs(results);
        }
        if (this.allOutputsAreArrays(results)) {
            return this.combineArrayOutputs(results);
        }
        if (this.allOutputsAreObjects(results)) {
            return this.combineObjectOutputs(results);
        }
        // Default to array of outputs
        return results.map(r => r.output);
    }
    /**
     * Check if all outputs are strings
     */
    allOutputsAreStrings(results) {
        return results.every(r => typeof r.output === 'string');
    }
    /**
     * Check if all outputs are arrays
     */
    allOutputsAreArrays(results) {
        return results.every(r => Array.isArray(r.output));
    }
    /**
     * Check if all outputs are objects
     */
    allOutputsAreObjects(results) {
        return results.every(r => typeof r.output === 'object' &&
            r.output !== null &&
            !Array.isArray(r.output));
    }
    /**
     * Combine string outputs
     */
    combineStringOutputs(results) {
        return results
            .filter(r => r.success)
            .map(r => r.output)
            .join('\n\n');
    }
    /**
     * Combine array outputs
     */
    combineArrayOutputs(results) {
        return results
            .filter(r => r.success)
            .reduce((acc, r) => [...acc, ...r.output], []);
    }
    /**
     * Combine object outputs
     */
    combineObjectOutputs(results) {
        return results
            .filter(r => r.success)
            .reduce((acc, r) => ({ ...acc, ...r.output }), {});
    }
    /**
     * Generate metadata for the combined result
     */
    generateMetadata(results) {
        return {
            timestamp: new Date().toISOString(),
            resultCount: results.length,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length
        };
    }
    /**
     * Determine the output format based on content
     */
    determineOutputFormat(output) {
        if (typeof output === 'string') {
            if (this.looksLikeCode(output)) {
                return 'code';
            }
            return 'text';
        }
        if (typeof output === 'object' && output !== null) {
            if (this.hasComplexStructure(output)) {
                return 'structured';
            }
            return 'json';
        }
        return 'text';
    }
    /**
     * Check if a string looks like code
     */
    looksLikeCode(str) {
        const codeIndicators = [
            'function',
            'class',
            'import',
            'export',
            'const',
            'let',
            'var',
            '{',
            '}',
            ';'
        ];
        return codeIndicators.some(indicator => str.includes(indicator));
    }
    /**
     * Check if an object has a complex structure
     */
    hasComplexStructure(obj) {
        // Check for nested objects or arrays
        const hasNestedStructures = (value) => {
            if (typeof value !== 'object' || value === null) {
                return false;
            }
            if (Array.isArray(value)) {
                return value.some(item => typeof item === 'object' && item !== null);
            }
            return Object.values(value).some(val => typeof val === 'object' &&
                val !== null &&
                Object.keys(val).length > 0);
        };
        return hasNestedStructures(obj);
    }
    /**
     * Format data according to its type
     */
    formatData(data, format) {
        switch (format) {
            case 'json':
                return typeof data === 'string' ? JSON.parse(data) : data;
            case 'text':
                return String(data);
            case 'code':
                return this.formatCode(String(data));
            case 'structured':
                return this.formatStructured(data);
            default:
                return data;
        }
    }
    /**
     * Format code with proper indentation
     */
    formatCode(code) {
        const lines = code.split('\n');
        let indent = 0;
        return lines
            .map(line => {
            line = line.trim();
            // Decrease indent for closing brackets
            if (line.match(/^[}\])]/) && indent > 0) {
                indent--;
            }
            // Add indentation
            const formatted = ' '.repeat(indent * this.config.formatOptions.indentSize) + line;
            // Increase indent for opening brackets
            if (line.match(/[{\[(]$/)) {
                indent++;
            }
            return formatted;
        })
            .join('\n');
    }
    /**
     * Format structured data
     */
    formatStructured(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.formatStructured(item));
        }
        if (typeof data === 'object' && data !== null) {
            const formatted = {};
            for (const [key, value] of Object.entries(data)) {
                formatted[key] = this.formatStructured(value);
            }
            return formatted;
        }
        return data;
    }
    /**
     * Generate a schema for the formatted data
     */
    generateSchema(data) {
        if (Array.isArray(data)) {
            return {
                type: 'array',
                items: data.length > 0 ? this.generateSchema(data[0]) : {}
            };
        }
        if (typeof data === 'object' && data !== null) {
            const properties = {};
            for (const [key, value] of Object.entries(data)) {
                properties[key] = this.generateSchema(value);
            }
            return {
                type: 'object',
                properties
            };
        }
        return {
            type: typeof data
        };
    }
}
exports.ResultSynthesizer = ResultSynthesizer;
//# sourceMappingURL=result-synthesizer.js.map