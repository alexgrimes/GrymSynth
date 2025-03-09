import { RecoveryValidator, ValidationRule, ValidationContext, RecoveryConfig } from './types';
export declare class HealthRecoveryValidator implements RecoveryValidator {
    private readonly validationRules;
    private readonly config;
    constructor(config: RecoveryConfig);
    validateRecovery(context: ValidationContext): boolean;
    private validateDegradation;
    private validateRecoveryToHealthy;
    private validateUnhealthyProgression;
    addValidationRule(rule: ValidationRule): void;
    getRequiredSamples(): number;
    getValidationWindow(): number;
    private initializeDefaultRules;
}
