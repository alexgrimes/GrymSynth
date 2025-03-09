import { ValidationResult } from './types';
interface ValidationRule<T> {
    validate: (value: T) => boolean;
    message: string;
    code: string;
    severity: 'critical' | 'warning';
}
export declare class PatternValidator {
    private rules;
    private context;
    constructor();
    /**
     * Validate a pattern against all registered rules
     * @param pattern Pattern to validate
     * @param ruleSet Optional specific rule set to use
     * @returns Validation result
     */
    validate<T>(pattern: T, ruleSet?: string): ValidationResult;
    /**
     * Add a new validation rule
     * @param ruleSet Rule set identifier
     * @param rule Validation rule to add
     */
    addRule<T>(ruleSet: string, rule: ValidationRule<T>): void;
    /**
     * Remove a validation rule
     * @param ruleSet Rule set identifier
     * @param ruleCode Code of the rule to remove
     */
    removeRule(ruleSet: string, ruleCode: string): void;
    /**
     * Clear all validation rules for a rule set
     * @param ruleSet Rule set identifier
     */
    clearRules(ruleSet: string): void;
    private initializeDefaultRules;
}
export {};
