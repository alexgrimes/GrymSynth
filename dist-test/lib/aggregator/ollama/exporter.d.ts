import { NormalizedResource } from '../core';
export declare class OllamaExporter {
    private outputDir;
    constructor(outputDir: string);
    export(resources: NormalizedResource[], filename: string): Promise<void>;
    private formatContent;
}
