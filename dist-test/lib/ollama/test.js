"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_connection_1 = require("./test-connection");
async function runTest() {
    console.log('Testing Ollama connection...');
    const result = await (0, test_connection_1.testOllamaConnection)();
    console.log('Connection test result:', result);
}
runTest().catch(console.error);
//# sourceMappingURL=test.js.map