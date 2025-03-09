"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processResource = void 0;
async function processResource(resource) {
    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resource),
        });
        if (!response.ok) {
            throw new Error('Resource processing failed');
        }
        return await response.json();
    }
    catch (error) {
        console.error('Resource processing error:', error);
        throw error;
    }
}
exports.processResource = processResource;
//# sourceMappingURL=process-resource.js.map