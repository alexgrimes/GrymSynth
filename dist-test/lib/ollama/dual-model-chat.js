"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DualModelChat = exports.AVAILABLE_MODELS = void 0;
exports.AVAILABLE_MODELS = {
    architect: 'deepseek-r1:14b',
    developer: 'deepseek-r1:14b'
};
const DEFAULT_OPTIONS = {
    stream: true,
    temperature: 0.7
};
const ROLE_PROMPTS = {
    architect: `You are a senior software architect focused on high-level system design, architecture patterns, and best practices. 
Analyze requests from an architectural perspective, considering:
- System design and architecture
- Scalability and performance
- Integration patterns
- Best practices and design principles
- Trade-offs and technical decisions

Question/Request: `,
    developer: `You are a senior software developer focused on practical implementation details and coding. 
Analyze requests from a development perspective, considering:
- Code implementation details
- Programming patterns and practices
- Error handling and edge cases
- Testing and debugging approaches
- Performance optimizations

Question/Request: `
};
class DualModelChat {
    async makeRequest(endpoint, body) {
        const response = await fetch(`http://localhost:11434/api/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
        }
        return response;
    }
    async getStreamingResponse(message, role, onChunk, options = DEFAULT_OPTIONS) {
        const prompt = ROLE_PROMPTS[role] + message;
        try {
            const response = await this.makeRequest('generate', {
                model: exports.AVAILABLE_MODELS[role],
                prompt,
                stream: true,
                temperature: options.temperature
            });
            const reader = response.body?.getReader();
            if (!reader)
                throw new Error('Response body is null');
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.response) {
                            onChunk(parsed.response);
                        }
                    }
                    catch (e) {
                        console.error('Failed to parse streaming response:', e);
                    }
                }
            }
        }
        catch (error) {
            console.error('Streaming request failed:', error);
            throw error;
        }
    }
    async getResponse(message, role, options = DEFAULT_OPTIONS) {
        const prompt = ROLE_PROMPTS[role] + message;
        try {
            const response = await this.makeRequest('generate', {
                model: exports.AVAILABLE_MODELS[role],
                prompt,
                stream: false,
                temperature: options.temperature
            });
            const data = await response.json();
            return data.response;
        }
        catch (error) {
            console.error('Non-streaming request failed:', error);
            throw error;
        }
    }
}
exports.DualModelChat = DualModelChat;
//# sourceMappingURL=dual-model-chat.js.map