import { HealthStatusType, HealthIndicators } from '../types';
import type { HealthMetrics as BaseHealthMetrics } from '../types';
export type HealthMetrics = BaseHealthMetrics;
export interface StateTransition {
    from: HealthStatusType;
    to: HealthStatusType;
    timestamp: number;
    reason: string;
}
export interface StateHistory {
    transitions: StateTransition[];
    samples: HealthState[];
    getRecentSamples(window: number): HealthState[];
}
export interface HealthState {
    status: HealthStatusType;
    indicators: HealthIndicators;
    timestamp: number;
}
export interface GuardCondition {
    evaluate(from: HealthState, to: HealthState): boolean;
    reason: string;
}
export interface MetricThresholds {
    warning: number;
    critical: number;
    recovery: number;
}
export interface ThresholdConfig {
    memory: {
        heapUsage: MetricThresholds;
        cacheUtilization: MetricThresholds;
    };
    performance: {
        latency: MetricThresholds;
        throughput: MetricThresholds;
    };
    error: {
        errorRate: MetricThresholds;
    };
}
export interface MetricValidationResult {
    isValid: boolean;
    violations: string[];
    recommendations: string[];
    score: number;
}
export interface RecoveryConfig {
    minHealthySamples: number;
    validationWindow: number;
    requiredSuccessRate: number;
    cooldownPeriod: number;
}
export interface ValidationRule {
    validate(metrics: HealthMetrics, history: StateHistory): boolean;
    description: string;
}
export interface ValidationContext {
    currentState: HealthState;
    history: StateHistory;
    thresholds: ThresholdConfig;
    recovery: RecoveryConfig;
}
export interface StateManager {
    currentState: HealthState;
    history: StateHistory;
    canTransition(from: HealthState, to: HealthState): boolean;
    transition(to: HealthState): void;
    addGuardCondition(condition: GuardCondition): void;
}
export interface MetricEvaluator {
    evaluateMemoryHealth(metrics: MemoryMetrics): MetricValidationResult;
    evaluatePerformanceHealth(metrics: PerformanceMetrics): MetricValidationResult;
    evaluateErrorHealth(metrics: ErrorMetrics): MetricValidationResult;
    getAggregateScore(results: MetricValidationResult[]): number;
}
export interface ThresholdManager {
    config: ThresholdConfig;
    validate(metrics: HealthMetrics): ValidationResult;
    isRecoveryThresholdMet(metrics: HealthMetrics): boolean;
    adjustThresholds(history: MetricHistory): void;
}
export interface RecoveryValidator {
    validateRecovery(context: ValidationContext): boolean;
    addValidationRule(rule: ValidationRule): void;
    getRequiredSamples(): number;
    getValidationWindow(): number;
}
export interface MemoryMetrics {
    heapUsage: number;
    heapLimit: number;
    cacheUtilization: number;
    timestamp: number;
}
export interface PerformanceMetrics {
    latencies: number[];
    throughput: number;
    timestamp: number;
}
export interface ErrorMetrics {
    errorCount: number;
    totalOperations: number;
    timestamp: number;
}
export interface MetricHistory {
    memory: MemoryMetrics[];
    performance: PerformanceMetrics[];
    error: ErrorMetrics[];
    window: number;
}
export interface ValidationResult {
    isValid: boolean;
    violations: string[];
    recommendations: string[];
    metrics: {
        memory: MetricValidationResult;
        performance: MetricValidationResult;
        error: MetricValidationResult;
    };
}
