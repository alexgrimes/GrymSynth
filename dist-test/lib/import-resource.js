"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importResource = void 0;
const process_resource_1 = require("./process-resource");
const db_1 = require("./db");
async function importResource(resource) {
    const db = await (0, db_1.initDB)();
    try {
        // Process resource through Ollama
        const processed = await (0, process_resource_1.processResource)(resource);
        // Store in IndexedDB
        await db.put('resources', {
            ...resource,
            summary: processed.response,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return true;
    }
    catch (error) {
        console.error('Resource import failed:', error);
        return false;
    }
}
exports.importResource = importResource;
//# sourceMappingURL=import-resource.js.map