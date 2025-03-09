"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const error_handler_1 = require("../../../lib/error-handler");
const OLLAMA_ENDPOINT = 'http://127.0.0.1:11434';
async function ollamaChat(model, messages, stream = false) {
    const requestBody = {
        model,
        messages,
        stream,
        options: {
            temperature: 0.7,
            num_predict: 1024,
            top_k: 40,
            top_p: 0.9,
            repeat_penalty: 1.1,
        },
    };
    return error_handler_1.errorHandler.withRecovery(async () => {
        const response = await fetch(`${OLLAMA_ENDPOINT}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = new Error(`Ollama API error: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        return response;
    });
}
async function POST(req) {
    try {
        const body = await req.json();
        const { model, messages, stream = false } = body;
        console.log('Received chat request:', {
            model,
            messageCount: messages.length,
            stream
        });
        const response = await ollamaChat(model, messages, stream);
        if (stream) {
            const reader = response.body?.getReader();
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            return new Response(new ReadableStream({
                async start(controller) {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done)
                                break;
                            const chunk = decoder.decode(value);
                            const lines = chunk.split('\n');
                            for (const line of lines) {
                                if (line.trim()) {
                                    controller.enqueue(encoder.encode(`data: ${line}\n\n`));
                                }
                            }
                        }
                        controller.close();
                    }
                    catch (error) {
                        console.error('Stream error:', error);
                        controller.error(error);
                    }
                },
            }), {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            });
        }
        else {
            const data = await response.json();
            console.log('API response:', {
                status: 'success',
                messageLength: data.message?.content?.length || 0
            });
            return server_1.NextResponse.json(data);
        }
    }
    catch (error) {
        return (0, error_handler_1.handleApiError)(error);
    }
}
exports.POST = POST;
//# sourceMappingURL=route.js.map