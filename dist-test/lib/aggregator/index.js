"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatorService = void 0;
const sdk_1 = require("@browserbasehq/sdk");
const exporter_1 = require("./ollama/exporter");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
class AggregatorService {
    constructor() {
        this.browserbase = new sdk_1.Browserbase();
        // Set output directory to project root/output
        const outputDir = path_1.default.join(process.cwd(), 'output');
        this.exporter = new exporter_1.OllamaExporter(outputDir);
    }
    async processResource(url) {
        try {
            const rawResource = await this.browserbase.scrape(url);
            const normalizedResource = {
                id: crypto_1.default.randomUUID(),
                source: new URL(url).hostname,
                type: 'documentation',
                title: rawResource.title || 'Untitled',
                description: (rawResource.content || '').slice(0, 200),
                content: rawResource.content || '',
                tags: [],
                url: url,
                publishedAt: new Date(),
                author: 'unknown',
                language: 'en'
            };
            // Export to Ollama format
            await this.exporter.export([normalizedResource], 'resources.jsonl');
            return normalizedResource;
        }
        catch (error) {
            console.error('Error processing resource:', error);
            throw error;
        }
    }
}
exports.AggregatorService = AggregatorService;
__exportStar(require("./core"), exports);
//# sourceMappingURL=index.js.map