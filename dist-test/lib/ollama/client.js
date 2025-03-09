"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaClient = exports.OllamaClient = void 0;
const error_handler_1 = require("../error-handler");
class OllamaClient {
    async chat({ messages, model }) {
        return error_handler_1.errorHandler.withRecovery(async () => {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model || 'deepseek-r1:14b',
                    messages: messages,
                    stream: false
                })
            });
            // If response isn't ok, get the error details
            if (!response.ok) {
                const errorData = await response.json();
                const error = new Error(`Ollama error: ${errorData.error || response.statusText}`);
                // Add additional properties to help with error recovery decisions
                error.status = response.status;
                error.statusText = response.statusText;
                error.details = errorData;
                throw error;
            }
            const data = await response.json();
            return {
                content: data.message?.content || ''
            };
        });
    }
    async testConnection(model = 'deepseek-r1:14b') {
        return error_handler_1.errorHandler.withRecovery(async () => {
            const response = await fetch('/api/test-connection');
            const data = await response.json();
            if (!response.ok || !data.success) {
                const error = new Error('Connection test failed');
                error.status = response.status;
                error.details = data;
                throw error;
            }
            return true;
        }).catch(error => {
            console.error('Connection test failed:', error);
            return false;
        });
    }
}
exports.OllamaClient = OllamaClient;
// Export a default instance
exports.ollamaClient = new OllamaClient();
//# sourceMappingURL=client.js.map