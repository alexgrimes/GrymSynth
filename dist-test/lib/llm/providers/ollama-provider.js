"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
class OllamaProvider {
    constructor(model) {
        this.name = 'Ollama';
        this.endpoint = 'http://localhost:11434';
        this.context = null;
        this.model = model;
    }
    async getResponse(prompt) {
        const response = await fetch(`${this.endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                context: this.context
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.context) {
            this.context = data.context;
        }
        return data.response;
    }
    async *streamResponse(prompt) {
        const response = await fetch(`${this.endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: true,
                context: this.context
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is null');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const chunk = JSON.parse(line);
                        if (chunk.context) {
                            this.context = chunk.context;
                        }
                        yield chunk;
                    }
                    catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
        }
    }
    clearContext() {
        this.context = null;
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollama-provider.js.map