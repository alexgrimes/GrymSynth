"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.OPTIONS = void 0;
const server_1 = require("next/server");
const error_handler_1 = require("../../../lib/error-handler");
const OLLAMA_HOST = '127.0.0.1';
const OLLAMA_PORT = 11434;
const OLLAMA_ENDPOINT = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
async function OPTIONS() {
    return server_1.NextResponse.json({}, { headers: corsHeaders });
}
exports.OPTIONS = OPTIONS;
async function makeRequest(path, method = 'GET', body) {
    return error_handler_1.errorHandler.withRecovery(async () => {
        const response = await fetch(`${OLLAMA_ENDPOINT}${path}`, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        const data = await response.json();
        return data;
    });
}
async function GET() {
    try {
        console.log('Checking Ollama server connection...');
        // Test server connection
        const version = await makeRequest('/api/version');
        console.log('Ollama version:', version);
        // Get list of available models
        const models = await makeRequest('/api/tags');
        const modelNames = models.models?.map((m) => m.name) || [];
        console.log('Available models:', modelNames);
        // Check if required models are available
        const hasDeepseek = modelNames.includes('deepseek-r1:14b');
        const hasQwen = modelNames.includes('qwen2.5-coder:latest');
        if (!hasDeepseek || !hasQwen) {
            const missingModels = [];
            if (!hasDeepseek)
                missingModels.push('deepseek-r1:14b');
            if (!hasQwen)
                missingModels.push('qwen2.5-coder:latest');
            return server_1.NextResponse.json({
                error: `Missing required models: ${missingModels.join(', ')}. Please install them using 'ollama pull' command.`,
                models: modelNames
            }, {
                status: 503,
                headers: corsHeaders
            });
        }
        return server_1.NextResponse.json({
            success: true,
            version: version.version,
            models: modelNames
        }, { headers: corsHeaders });
    }
    catch (error) {
        console.error('Connection test failed:', error);
        // Use our error handler to format the response
        return (0, error_handler_1.handleApiError)(error);
    }
}
exports.GET = GET;
//# sourceMappingURL=route.js.map