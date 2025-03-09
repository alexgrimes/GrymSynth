/// <reference types="node" />
import { EventEmitter } from 'events';
export interface MemorySnapshot {
    timestamp: number;
    heap: number;
    external: number;
    arrayBuffers: number;
    total: number;
    rss: number;
    label?: string;
}
export interface ModelEvent {
    type: 'load' | 'unload';
    model: string;
    timestamp: number;
}
export declare class MemoryProfiler extends EventEmitter {
    private snapshots;
    private memoryLimit;
    private isTracking;
    private intervalId?;
    private startTime;
    constructor(memoryLimit?: number);
    start(): void;
    stop(): void;
    getActualMemoryUsage(): Promise<MemorySnapshot>;
    startTracking(intervalMs?: number): void;
    stopTracking(): void;
    takeSnapshot(label: string): Promise<MemorySnapshot>;
    checkMemoryUsage(): boolean;
    getMemoryDelta(startLabel: string, endLabel: string): {
        heapDelta: number;
        totalDelta: number;
    } | null;
    getPeakMemoryUsage(): number;
    getMemoryLimit(): number;
    getAllSnapshots(): MemorySnapshot[];
    formatBytes(bytes: number): string;
}
