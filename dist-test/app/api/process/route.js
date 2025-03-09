"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.OPTIONS = void 0;
const server_1 = require("next/server");
const error_handler_1 = require("../../../lib/error-handler");
const OLLAMA_ENDPOINT = 'http://127.0.0.1:11434';
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
async function OPTIONS() {
    return server_1.NextResponse.json({}, { headers: corsHeaders });
}
exports.OPTIONS = OPTIONS;
async function fetchWebContent(url) {
    return error_handler_1.errorHandler.withRecovery(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            });
            if (!response.ok) {
                const error = new Error(`Website returned ${response.status} status`);
                error.status = response.status;
                throw error;
            }
            return response.text();
        }
        finally {
            clearTimeout(timeoutId);
        }
    });
}
async function verifyOllamaModel() {
    return error_handler_1.errorHandler.withRecovery(async () => {
        const response = await fetch(`${OLLAMA_ENDPOINT}/api/tags`);
        if (!response.ok) {
            throw new Error('Ollama server unavailable');
        }
        const { models } = await response.json();
        if (!models.some((m) => m.name === process.env.OLLAMA_MODEL)) {
            throw new Error(`Model ${process.env.OLLAMA_MODEL} not found`);
        }
        return true;
    });
}
async function processWithOllama(content) {
    return error_handler_1.errorHandler.withRecovery(async () => {
        const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL,
                prompt: `Analyze this web content:\n\n${content.substring(0, 5000)}`,
                stream: false,
            }),
        });
        if (!response.ok) {
            const error = new Error('Ollama processing failed');
            error.status = response.status;
            throw error;
        }
        return response.json();
    });
}
async function POST(request) {
    try {
        const { url } = await request.json();
        console.log('Processing URL:', url);
        // Step 1: Fetch web content
        const content = await fetchWebContent(url);
        console.log('Content fetched successfully');
        // Step 2: Verify Ollama model
        await verifyOllamaModel();
        console.log('Ollama model verified');
        // Step 3: Process through Ollama
        const result = await processWithOllama(content);
        console.log('Content processed successfully');
        return server_1.NextResponse.json({
            url,
            response: result.response,
            timestamp: Date.now()
        }, { headers: corsHeaders });
    }
    catch (error) {
        // Use our error handler to format the response, but add CORS headers
        const errorResponse = (0, error_handler_1.handleApiError)(error);
        // Add CORS headers to the error response
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
    }
}
exports.POST = POST;
//# sourceMappingURL=route.js.map