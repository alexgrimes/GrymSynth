export interface ModelType {
    id: string;
    name: string;
    memoryRequirement: number;
    capabilities: {
        transcription?: boolean;
        synthesis?: boolean;
        streaming?: boolean;
    };
}
export interface AudioTask {
    id: string;
    type: 'transcription' | 'synthesis' | 'analysis';
    input: AudioBuffer | string;
    requirements?: {
        quality: number;
        maxLatency?: number;
    };
}
export interface ProcessingStep {
    modelType: ModelType;
    operation: string;
    input: any;
    expectedOutput: any;
}
export declare class SequentialOrchestrator {
    private activeModel;
    private memoryLimit;
    private currentMemoryUsage;
    constructor(memoryLimit?: number);
    private getMemoryUsage;
    loadModel(type: ModelType): Promise<void>;
    unloadModel(): Promise<void>;
    planTask(task: AudioTask): Promise<ProcessingStep[]>;
    processTask(task: AudioTask): Promise<any>;
    private executeStep;
    getCurrentMemoryUsage(): number;
    getMemoryLimit(): number;
}
