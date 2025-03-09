import type { Resource, ResourceSubmission } from './types';
export declare class UrlProcessor {
    private static removeUnwantedElements;
    private static extractContent;
    private static sanitizeContent;
    static processUrl(url: string, metadata: ResourceSubmission['metadata']): Promise<Resource>;
    static summarizeContent(content: string, llmManager: any): Promise<string>;
}
