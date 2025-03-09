"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestMessage = void 0;
const createTestMessage = (content) => ({
    content,
    role: 'user',
    timestamp: Date.now()
});
exports.createTestMessage = createTestMessage;
//# sourceMappingURL=test-helpers.js.map