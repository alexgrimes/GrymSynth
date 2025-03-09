import type { NormalizedResource } from './core';
export declare class AggregatorService {
    private browserbase;
    private exporter;
    constructor();
    processResource(url: string): Promise<NormalizedResource>;
}
export * from './core';
