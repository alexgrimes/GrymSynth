import type { Page, Resource, SiteAdapter } from '../core';
export declare class JuceAdapter implements SiteAdapter {
    private readonly baseUrl;
    canHandle(url: string): boolean;
    extract(page: Page): Promise<Resource>;
    private extractVersion;
    private extractSections;
}
