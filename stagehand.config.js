"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    env: {
        browserbaseApiKey: process.env.BROWSERBASE_API_KEY || '',
    },
    selectors: {
        article: {
            title: 'h1, .article-title, .post-title',
            content: 'article, .article-content, .post-content, main',
            date: 'time, .published-date, .post-date',
            author: '.author-name, .post-author',
        },
        tutorial: {
            title: 'h1, .tutorial-title',
            content: '.tutorial-content, .lesson-content, main',
            difficulty: '.difficulty, .level',
            duration: '.duration, .time-estimate',
        },
        documentation: {
            title: 'h1, .doc-title',
            content: '.doc-content, main',
            version: '.version-info, .doc-version',
            api: '.api-section, .reference',
        },
    },
    extraction: {
        removeSelectors: [
            'script',
            'style',
            'iframe',
            'nav',
            'footer',
            'header',
            'aside',
            '.ad',
            '.advertisement',
            '.popup',
            '.modal',
            '.cookie-notice',
            '.newsletter-signup',
            '#comments',
        ],
        includeHtml: true,
        timeout: 30000,
    },
};
exports.default = config;
//# sourceMappingURL=stagehand.config.js.map