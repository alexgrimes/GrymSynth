"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = void 0;
function generateId() {
    // Generate a timestamp-based ID with a random component
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
}
exports.generateId = generateId;
//# sourceMappingURL=id.js.map