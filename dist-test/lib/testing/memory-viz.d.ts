import { MemorySnapshot, ModelEvent } from './memory-profile';
export interface MemoryVisualization {
    timestamps: number[];
    heapUsage: number[];
    externalUsage: number[];
    modelEvents: {
        time: number;
        event: 'load' | 'unload';
        model: string;
    }[];
}
export declare class MemoryVisualizer {
    private data;
    track(snapshot: MemorySnapshot, event?: ModelEvent): void;
    private generateChartConfig;
    generateReport(outputPath: string, memoryLimit: number): Promise<void>;
    private generateEventMarkers;
    private formatTime;
    getVisualizationData(): MemoryVisualization;
}
