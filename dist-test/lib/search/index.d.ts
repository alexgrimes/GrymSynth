export declare class SearchIndex {
    private index;
    private stemmer;
    private fuseOptions;
    buildIndex(): Promise<void>;
    private indexResource;
    private extractSearchTerms;
    search(query: string): string[];
}
