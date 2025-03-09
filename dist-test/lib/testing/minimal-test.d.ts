interface MemorySnapshot {
    timestamp: number;
    heapUsed: number;
    external: number;
    total: number;
}
export declare class MinimalTestFramework {
    private orchestrator;
    private memorySnapshots;
    constructor(memoryLimit?: number);
    private takeMemorySnapshot;
    modelTests(): Promise<{
        loadUnload: boolean;
        basicProcessing: boolean;
        memoryProfile: {
            passed: boolean;
            profile: MemorySnapshot[];
        };
    }>;
    orchestrationTests(): Promise<{
        taskPlanning: boolean;
        modelHandoff: boolean;
        errorRecovery: boolean;
    }>;
    private testLoadUnload;
    private testBasicProcessing;
    private testMemoryProfile;
    private testTaskPlanning;
    private testModelHandoff;
    private testErrorRecovery;
    getMemoryProfile(): MemorySnapshot[];
}
export {};
