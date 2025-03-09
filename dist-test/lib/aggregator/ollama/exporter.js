"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaExporter = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class OllamaExporter {
    constructor(outputDir) {
        this.outputDir = outputDir;
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
    }
    async export(resources, filename) {
        const filePath = path_1.default.join(this.outputDir, filename);
        const lines = resources.map(resource => JSON.stringify({
            id: resource.id,
            content: this.formatContent(resource),
            metadata: {
                source: resource.source,
                type: resource.type,
                tags: resource.tags,
                url: resource.url
            }
        })).join('\n');
        return fs_1.default.promises.writeFile(filePath, lines);
    }
    formatContent(resource) {
        return `Title: ${resource.title}\n\n` +
            `Description: ${resource.description}\n\n` +
            `Content: ${resource.content}\n\n` +
            `Published: ${resource.publishedAt?.toISOString() || 'unknown'}\n` +
            `Author: ${resource.author || 'unknown'}\n` +
            `Language: ${resource.language}`;
    }
}
exports.OllamaExporter = OllamaExporter;
//# sourceMappingURL=exporter.js.map