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
async function generateResponse(body) {
    return error_handler_1.errorHandler.withRecovery(async () => {
        const response = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const error = new Error(`Ollama API error: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        return response.json();
    });
}
async function POST(request) {
    try {
        const body = await request.json();
        console.log('Generate request:', {
            model: body.model,
            promptLength: body.prompt?.length || 0
        });
        const data = await generateResponse(body);
        console.log('Generate response:', {
            status: 'success',
            responseLength: data.response?.length || 0
        });
        return server_1.NextResponse.json(data, { headers: corsHeaders });
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