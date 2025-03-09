"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlProcessor = void 0;
const cheerio_1 = require("cheerio");
const nanoid_1 = require("nanoid");
const stagehand_config_1 = __importDefault(require("../../stagehand.config"));
class UrlProcessor {
    static removeUnwantedElements(html) {
        const $ = (0, cheerio_1.load)(html);
        stagehand_config_1.default.extraction.removeSelectors.forEach(selector => {
            $(selector).remove();
        });
        return $.html();
    }
    static extractContent(html) {
        const $ = (0, cheerio_1.load)(html);
        const selectors = stagehand_config_1.default.selectors.article;
        const title = $(selectors.title).first().text().trim();
        const content = $(selectors.content).text().trim();
        const metadata = {};
        const difficultyText = $(selectors.difficulty).text().trim().toLowerCase();
        if (difficultyText) {
            metadata.difficulty = (difficultyText === 'advanced' ? 'advanced' :
                difficultyText === 'intermediate' ? 'intermediate' :
                    'beginner');
        }
        metadata.estimatedTime = $(selectors.duration).text().trim();
        return { title, content, metadata };
    }
    static sanitizeContent(content) {
        return content
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,!?-]/g, '')
            .trim();
    }
    static async processUrl(url, metadata) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }
            const html = await response.text();
            const cleanHtml = this.removeUnwantedElements(html);
            const extracted = this.extractContent(cleanHtml);
            const sanitizedContent = this.sanitizeContent(extracted.content);
            const resource = {
                id: (0, nanoid_1.nanoid)(),
                url,
                title: extracted.title || 'Untitled Resource',
                content: sanitizedContent,
                summary: '',
                type: 'tutorial',
                category: 'dsp',
                metadata: {
                    ...metadata,
                    difficulty: (extracted.metadata.difficulty || metadata.difficulty || 'beginner'),
                    topics: metadata.topics,
                    estimatedTime: extracted.metadata.estimatedTime || metadata.estimatedTime,
                },
                dateAdded: Date.now(),
                lastAccessed: Date.now(),
            };
            return resource;
        }
        catch (error) {
            console.error('Error processing URL:', error);
            throw new Error(`Failed to process URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static async summarizeContent(content, llmManager) {
        try {
            const prompt = `Summarize the following content in a concise way, focusing on the main points and key takeaways:\n\n${content}`;
            const summary = await llmManager.generateResponse(prompt);
            return summary;
        }
        catch (error) {
            console.error('Error generating summary:', error);
            return '';
        }
    }
}
exports.UrlProcessor = UrlProcessor;
//# sourceMappingURL=url-processor.js.map