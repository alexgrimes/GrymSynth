"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchResultSchema = exports.NormalizedResourceSchema = exports.normalizeResources = void 0;
const zod_1 = require("zod");
const crypto_1 = __importDefault(require("crypto"));
function normalizeResources(resources) {
    return resources.map(resource => ({
        id: crypto_1.default.randomUUID(),
        source: new URL(resource.url).hostname,
        type: 'documentation',
        title: resource.title,
        description: resource.content.slice(0, 200),
        content: resource.content,
        tags: [],
        url: resource.url,
        publishedAt: new Date(),
        author: 'unknown',
        language: 'en'
    }));
}
exports.normalizeResources = normalizeResources;
exports.NormalizedResourceSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    source: zod_1.z.string(),
    type: zod_1.z.enum(['tutorial', 'documentation', 'video', 'book']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    content: zod_1.z.string().default(''),
    tags: zod_1.z.array(zod_1.z.string()),
    url: zod_1.z.string().url(),
    publishedAt: zod_1.z.date().optional(),
    author: zod_1.z.string().optional(),
    language: zod_1.z.string().default('en'),
});
exports.SearchResultSchema = zod_1.z.object({
    query: zod_1.z.string(),
    results: zod_1.z.array(exports.NormalizedResourceSchema),
});
//# sourceMappingURL=core.js.map