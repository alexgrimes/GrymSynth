interface ValidationResult {
    passed: boolean;
    details: string;
    metrics?: any;
}
declare class AudioLearningValidator {
    private context;
    private audioManager;
    private metrics;
    constructor();
    initialize(): Promise<boolean>;
    runValidation(): Promise<Record<string, ValidationResult>>;
    private getValidationScenarios;
    private createMemoryManagementTest;
    private createAudioStreamingTest;
    private createLargeAudioBuffer;
    private processAudioBuffer;
    private processAudioChunk;
    private updateMemoryMetrics;
    private createAudioManager;
}
export declare const validator: AudioLearningValidator;
export {};
