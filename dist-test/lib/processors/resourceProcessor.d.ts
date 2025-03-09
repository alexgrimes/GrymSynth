import type { Resource, ResourceSubmission } from '../types';
export declare class ResourceProcessor {
    processUrl(submission: ResourceSubmission): Promise<Resource>;
    private analyzeWithOllama;
    private extractTitle;
    private determineType;
}
