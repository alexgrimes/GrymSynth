interface SelectorConfig {
    title: string;
    content: string;
    [key: string]: string;
}
interface StagehandConfig {
    env: {
        browserbaseApiKey: string;
    };
    selectors: {
        article: SelectorConfig;
        tutorial: SelectorConfig;
        documentation: SelectorConfig;
    };
    extraction: {
        removeSelectors: string[];
        includeHtml: boolean;
        timeout: number;
    };
}
declare const config: StagehandConfig;
export default config;
