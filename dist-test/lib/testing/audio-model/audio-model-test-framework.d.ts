import { TestReport, AudioModel, AudioTestSuite } from '../../types/testing';
export interface AudioModelMetrics {
    latency: {
        singleRequest: number;
        avgConcurrent: number;
        streamingLatency: number;
    };
    quality: {
        audioFidelity: number;
        transcriptionAccuracy: number;
        contextRetention: number;
    };
    resources: {
        memoryUsage: {
            peak: number;
            average: number;
        };
        gpuUtilization: number;
        scalingEfficiency: number;
    };
}
export interface AudioModelTestReport extends TestReport {
    audioMetrics: AudioModelMetrics;
    integrationMetrics: {
        handoffLatency: number;
        errorRecoveryTime: number;
        stateConsistency: number;
    };
}
export declare class AudioModelTestFramework {
    private metrics;
    private testSuite;
    constructor(testSuite?: AudioTestSuite);
    evaluateModel(model: AudioModel, options?: EvaluationOptions): Promise<AudioModelTestReport>;
    private runCapabilityTests;
    private runResourceTests;
    private processTestAudio;
    private transcribeAudio;
    private synthesizeAudio;
    private runIntegrationTests;
    private measureSingleRequestLatency;
    private measureConcurrentRequests;
    private measureStreamingLatency;
    private measureAudioFidelity;
    private measureTranscriptionAccuracy;
    private measureContextRetention;
    private measureHandoffLatency;
    private measureErrorRecoveryTime;
    private measureStateConsistency;
    private measureGPUUtilization;
    private measureScalingEfficiency;
}
interface EvaluationOptions {
    concurrentRequests?: number;
    streamingDuration?: number;
    resourceMonitoringInterval?: number;
}
export {};
