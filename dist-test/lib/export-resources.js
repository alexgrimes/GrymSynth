"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportResources = void 0;
const db_1 = require("./db");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function exportResources(outputDir) {
    const db = await (0, db_1.initDB)();
    const resources = await db.getAll('resources');
    const jsonl = resources
        .map((resource) => JSON.stringify({
        prompt: resource.content,
        completion: resource.summary,
        metadata: {
            type: resource.type,
            difficulty: resource.metadata.difficulty,
            tags: resource.metadata.tags || [],
        }
    }))
        .join('\n');
    await promises_1.default.mkdir(outputDir, { recursive: true });
    await promises_1.default.writeFile(path_1.default.join(outputDir, 'resources.jsonl'), jsonl);
}
exports.exportResources = exportResources;
//# sourceMappingURL=export-resources.js.map