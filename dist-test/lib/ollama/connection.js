"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOllamaSetup = void 0;
const test_connection_1 = require("./test-connection");
async function verifyOllamaSetup() {
    try {
        const result = await (0, test_connection_1.testOllamaConnection)();
        console.log('Setup verification succeeded:', result);
        return { success: true };
    }
    catch (error) {
        console.error('Setup verification failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to connect to Ollama server'
        };
    }
}
exports.verifyOllamaSetup = verifyOllamaSetup;
//# sourceMappingURL=connection.js.map