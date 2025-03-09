module.exports = {

"[project]/src/lib/utils/id.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "generateId": (()=>generateId)
});
function generateId() {
    // Generate a timestamp-based ID with a random component
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
}
}}),
"[project]/src/lib/storage/db.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "StorageManager": (()=>StorageManager),
    "storage": (()=>storage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2f$id$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/utils/id.ts [app-ssr] (ecmascript)");
;
class StorageManager {
    dbName = 'chatApp';
    version = 1;
    // We use a class to manage database operations because it helps us keep
    // all database logic in one place and maintain a consistent connection
    async initDB() {
        return new Promise((resolve, reject)=>{
            const request = indexedDB.open(this.dbName, this.version);
            // This creates our database structure when it's first opened
            request.onupgradeneeded = (event)=>{
                const db = event.target.result;
                // Store for overall conversation metadata
                if (!db.objectStoreNames.contains('conversations')) {
                    const conversationStore = db.createObjectStore('conversations', {
                        keyPath: 'id'
                    });
                    // Create indexes to help us search and sort conversations
                    conversationStore.createIndex('updatedAt', 'updatedAt');
                    conversationStore.createIndex('title', 'title');
                }
                // Store for individual messages within conversations
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', {
                        keyPath: 'id'
                    });
                    // Index to quickly fetch all messages for a conversation
                    messageStore.createIndex('conversationId', 'conversationId');
                    messageStore.createIndex('timestamp', 'timestamp');
                }
            };
            request.onerror = ()=>reject(request.error);
            request.onsuccess = ()=>resolve(request.result);
        });
    }
    // Conversation management methods
    async createConversation(title, models) {
        const db = await this.initDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction([
                'conversations'
            ], 'readwrite');
            const store = transaction.objectStore('conversations');
            const conversation = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2f$id$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateId"])(),
                title,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                models: {
                    responder: models.responder,
                    listener: models.listener,
                    contexts: {
                        [models.responder]: {
                            understanding: "Initial conversation context.",
                            lastUpdated: Date.now(),
                            messagesSeen: []
                        },
                        [models.listener]: {
                            understanding: "Initial conversation context.",
                            lastUpdated: Date.now(),
                            messagesSeen: []
                        }
                    }
                }
            };
            const request = store.add(conversation);
            request.onerror = ()=>reject(request.error);
            request.onsuccess = ()=>resolve(conversation.id);
        });
    }
    async saveMessage(message) {
        const db = await this.initDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction([
                'messages',
                'conversations'
            ], 'readwrite');
            // Save the message
            const messageStore = transaction.objectStore('messages');
            messageStore.add(message);
            // Update the conversation's updatedAt timestamp
            const conversationStore = transaction.objectStore('conversations');
            const getConversation = conversationStore.get(message.conversationId);
            getConversation.onsuccess = ()=>{
                const conversation = getConversation.result;
                conversation.updatedAt = Date.now();
                conversationStore.put(conversation);
            };
            transaction.oncomplete = ()=>resolve();
            transaction.onerror = ()=>reject(transaction.error);
        });
    }
    // Retrieval methods with useful filters and sorting
    async getConversations() {
        const db = await this.initDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction([
                'conversations'
            ], 'readonly');
            const store = transaction.objectStore('conversations');
            const index = store.index('updatedAt');
            // Get conversations sorted by most recently updated
            const request = index.getAll();
            request.onerror = ()=>reject(request.error);
            request.onsuccess = ()=>{
                const conversations = request.result;
                resolve(conversations.sort((a, b)=>b.updatedAt - a.updatedAt));
            };
        });
    }
    async updateModelContext(conversationId, modelName, context) {
        const db = await this.initDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction([
                'conversations'
            ], 'readwrite');
            const store = transaction.objectStore('conversations');
            const getRequest = store.get(conversationId);
            getRequest.onsuccess = ()=>{
                const conversation = getRequest.result;
                conversation.models.contexts[modelName] = context;
                conversation.updatedAt = Date.now();
                store.put(conversation);
            };
            transaction.oncomplete = ()=>resolve();
            transaction.onerror = ()=>reject(transaction.error);
        });
    }
    async switchModelRoles(conversationId) {
        const db = await this.initDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction([
                'conversations'
            ], 'readwrite');
            const store = transaction.objectStore('conversations');
            const getRequest = store.get(conversationId);
            getRequest.onsuccess = ()=>{
                const conversation = getRequest.result;
                if (!conversation) {
                    reject(new Error('Conversation not found'));
                    return;
                }
                // Swap the roles while preserving contexts
                const oldResponder = conversation.models.responder;
                const oldListener = conversation.models.listener;
                conversation.models = {
                    responder: oldListener,
                    listener: oldResponder,
                    contexts: conversation.models.contexts
                };
                conversation.updatedAt = Date.now();
                store.put(conversation);
            };
            transaction.oncomplete = ()=>resolve();
            transaction.onerror = ()=>reject(transaction.error);
        });
    }
    async addSystemMessage(conversationId, content) {
        const message = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2f$id$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateId"])(),
            conversationId,
            role: 'system',
            content,
            timestamp: Date.now()
        };
        await this.saveMessage(message);
        return message;
    }
    async getConversation(conversationId) {
        const db = await this.initDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction([
                'conversations'
            ], 'readonly');
            const store = transaction.objectStore('conversations');
            const request = store.get(conversationId);
            request.onerror = ()=>reject(request.error);
            request.onsuccess = ()=>resolve(request.result);
        });
    }
    async getConversationMessages(conversationId) {
        const db = await this.initDB();
        return new Promise((resolve, reject)=>{
            const transaction = db.transaction([
                'messages'
            ], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('conversationId');
            const request = index.getAll(IDBKeyRange.only(conversationId));
            request.onerror = ()=>reject(request.error);
            request.onsuccess = ()=>{
                const messages = request.result;
                resolve(messages.sort((a, b)=>a.timestamp - b.timestamp));
            };
        });
    }
}
const storage = new StorageManager();
}}),
"[project]/src/lib/llm/providers/ollama-provider.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "OllamaProvider": (()=>OllamaProvider)
});
class OllamaProvider {
    name = 'Ollama';
    endpoint = 'http://localhost:11434';
    model;
    context = null;
    constructor(model){
        this.model = model;
    }
    async getResponse(prompt) {
        const response = await fetch(`${this.endpoint}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
            headers: {
                'Content-Type': 'application/json'
            },
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
        while(true){
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, {
                stream: true
            });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines){
                if (line.trim()) {
                    try {
                        const chunk = JSON.parse(line);
                        if (chunk.context) {
                            this.context = chunk.context;
                        }
                        yield chunk;
                    } catch (e) {
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
}}),
"[project]/src/lib/llm/multi-provider-chat.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "SequentialChat": (()=>SequentialChat)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$providers$2f$ollama$2d$provider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/llm/providers/ollama-provider.ts [app-ssr] (ecmascript)");
;
class SequentialChat {
    providers = new Map();
    activeProvider = null;
    conversationHistory = [];
    constructor(providers){
        Object.entries(providers).forEach(([key, provider])=>{
            this.providers.set(key, provider);
        });
        // Set first provider as active by default
        this.activeProvider = Object.values(providers)[0];
    }
    setActiveProvider(providerKey) {
        const provider = this.providers.get(providerKey);
        if (!provider) {
            throw new Error(`Provider ${providerKey} not found`);
        }
        this.activeProvider = provider;
    }
    async getResponse(message, config = {}) {
        if (!this.activeProvider) {
            throw new Error('No active provider set');
        }
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: message,
            provider: this.activeProvider.name
        });
        try {
            const response = await this.activeProvider.getResponse(message);
            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response,
                provider: this.activeProvider.name
            });
            return response;
        } catch (error) {
            console.error(`Error from ${this.activeProvider.name}:`, error);
            throw error;
        }
    }
    async *streamResponse(message, config = {}) {
        if (!this.activeProvider) {
            throw new Error('No active provider set');
        }
        if (!this.activeProvider.streamResponse) {
            throw new Error(`${this.activeProvider.name} does not support streaming`);
        }
        this.conversationHistory.push({
            role: 'user',
            content: message,
            provider: this.activeProvider.name
        });
        let fullResponse = '';
        try {
            for await (const chunk of this.activeProvider.streamResponse(message)){
                if (chunk.response) {
                    fullResponse += chunk.response;
                    yield chunk;
                }
            }
            this.conversationHistory.push({
                role: 'assistant',
                content: fullResponse,
                provider: this.activeProvider.name
            });
        } catch (error) {
            console.error(`Streaming error from ${this.activeProvider.name}:`, error);
            throw error;
        }
    }
    getConversationHistory() {
        return this.conversationHistory;
    }
    clearHistory() {
        this.conversationHistory = [];
        // Clear context for providers that support it
        this.providers.forEach((provider)=>{
            if (provider instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$providers$2f$ollama$2d$provider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OllamaProvider"]) {
                provider.clearContext();
            }
        });
    }
} // Example usage:
 /*
const chat = new SequentialChat({
  ollama: new OllamaProvider('deepseek-r1:14b'),
  lmStudio: new LMStudioProvider('qwen2.5-coder')
});

// Start with Ollama
chat.setActiveProvider('ollama');
const ollamaResponse = await chat.getResponse('What is TypeScript?');
console.log('Ollama:', ollamaResponse);

// Switch to LM Studio for implementation details
chat.setActiveProvider('lmStudio');
const lmStudioResponse = await chat.getResponse('How would you implement this in Python?');
console.log('LM Studio:', lmStudioResponse);

// Switch back to Ollama for architecture discussion
chat.setActiveProvider('ollama');
const architectureResponse = await chat.getResponse('What are the architectural implications?');
console.log('Ollama:', architectureResponse);
*/ 
}}),
"[project]/src/lib/llm/providers/lm-studio-provider.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "LMStudioProvider": (()=>LMStudioProvider)
});
class LMStudioProvider {
    name = 'LM Studio';
    endpoint = 'http://127.0.0.1:1234';
    model;
    constructor(model){
        this.model = model;
    }
    async getResponse(prompt) {
        const messages = [
            {
                role: 'user',
                content: prompt
            }
        ];
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: false
            })
        });
        if (!response.ok) {
            throw new Error(`LM Studio API error: ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
    // Note: LM Studio's streaming implementation follows OpenAI's format
    async *streamResponse(prompt) {
        const messages = [
            {
                role: 'user',
                content: prompt
            }
        ];
        const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                stream: true
            })
        });
        if (!response.ok) {
            throw new Error(`LM Studio API error: ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is null');
        }
        const decoder = new TextDecoder();
        let buffer = '';
        while(true){
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, {
                stream: true
            });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines){
                if (line.trim() && line.startsWith('data: ')) {
                    try {
                        const jsonData = line.slice(6); // Remove 'data: ' prefix
                        if (jsonData === '[DONE]') continue;
                        const parsed = JSON.parse(jsonData);
                        if (parsed.choices?.[0]?.delta?.content) {
                            yield {
                                model: this.model,
                                created_at: new Date().toISOString(),
                                response: parsed.choices[0].delta.content,
                                done: false
                            };
                        }
                    } catch (e) {
                        console.error('Error parsing streaming response:', e);
                    }
                }
            }
        }
    }
}
}}),
"[project]/src/lib/llm/test-sequential-chat.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$multi$2d$provider$2d$chat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/llm/multi-provider-chat.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$providers$2f$ollama$2d$provider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/llm/providers/ollama-provider.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$providers$2f$lm$2d$studio$2d$provider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/llm/providers/lm-studio-provider.ts [app-ssr] (ecmascript)");
;
;
;
async function testSequentialChat() {
    // Initialize providers with specific models
    const chat = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$multi$2d$provider$2d$chat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SequentialChat"]({
        ollama: new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$providers$2f$ollama$2d$provider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OllamaProvider"]('deepseek-r1:14b'),
        lmStudio: new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$providers$2f$lm$2d$studio$2d$provider$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LMStudioProvider"]('qwen2.5-coder') // Using Qwen for LM Studio
    });
    try {
        // Test 1: Use Ollama for initial question
        console.log('\n=== Test 1: Ollama Initial Question ===');
        chat.setActiveProvider('ollama');
        const ollamaResponse = await chat.getResponse('What are the key differences between TypeScript and JavaScript?');
        console.log('Ollama Response:', ollamaResponse);
        // Test 2: Switch to LM Studio for implementation details
        console.log('\n=== Test 2: LM Studio Implementation Details ===');
        chat.setActiveProvider('lmStudio');
        const lmStudioResponse = await chat.getResponse('Based on the previous explanation, show me how to implement a TypeScript interface with generics.');
        console.log('LM Studio Response:', lmStudioResponse);
        // Test 3: Back to Ollama for architectural discussion
        console.log('\n=== Test 3: Ollama Architecture Discussion ===');
        chat.setActiveProvider('ollama');
        const architectureResponse = await chat.getResponse('What are the architectural benefits of using TypeScript in a large-scale application?');
        console.log('Ollama Architecture Response:', architectureResponse);
        // Test 4: Streaming response from Ollama
        console.log('\n=== Test 4: Ollama Streaming Response ===');
        chat.setActiveProvider('ollama');
        console.log('Streaming response (each chunk on new line):');
        for await (const chunk of chat.streamResponse('Explain how TypeScript\'s type system helps with refactoring.')){
            process.stdout.write(chunk.response);
        }
        console.log('\n');
        // Get conversation history
        console.log('\n=== Conversation History ===');
        const history = chat.getConversationHistory();
        history.forEach((msg, i)=>{
            console.log(`${i + 1}. [${msg.provider}] ${msg.role}: ${msg.content.substring(0, 50)}...`);
        });
    } catch (error) {
        console.error('Error during sequential chat test:', error);
    } finally{
        // Clean up
        chat.clearHistory();
    }
}
// Run the test if this file is executed directly
if (("TURBOPACK ident replacement", __turbopack_require_stub__).main === module) {
    console.log('Starting Sequential Chat Test...');
    testSequentialChat().then(()=>{
        console.log('Test completed.');
    }).catch((error)=>{
        console.error('Test failed:', error);
    });
} /*
To run this test:
1. Make sure Ollama is running with the deepseek-r1:14b model:
   ollama run deepseek-r1:14b

2. Make sure LM Studio is running with the qwen2.5-coder model loaded
   and the API server enabled on port 1234

3. Run the test:
   ts-node src/lib/llm/test-sequential-chat.ts
*/ 
}}),
"[project]/src/lib/chat/message-handler.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "MessageHandler": (()=>MessageHandler)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$test$2d$sequential$2d$chat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/llm/test-sequential-chat.ts [app-ssr] (ecmascript)");
;
class MessageHandler {
    storage;
    sequentialChat;
    constructor(storage){
        this.storage = storage;
        this.sequentialChat = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$llm$2f$test$2d$sequential$2d$chat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SequentialChat"]();
    }
    async processNewMessage(conversation, content, role) {
        try {
            // First, save the new message
            const message = await this.saveMessage(conversation.id, content, role);
            // If this is a user message, we need to:
            // 1. Update the listener's context
            // 2. Get a response from the responder
            if (role === 'user') {
                try {
                    // Switch to listener model for context update
                    await this.sequentialChat.switchProvider('lmstudio');
                    await this.updateListenerContext(conversation, message);
                } catch (error) {
                    console.error('Failed to update listener context:', error);
                // Continue even if listener update fails
                }
                // Switch to responder model for reply
                await this.sequentialChat.switchProvider('ollama');
                const response = await this.getResponderReply(conversation, message);
                // Save the response as a new message
                await this.saveMessage(conversation.id, response, 'assistant');
            }
        } catch (error) {
            console.error('Error in processNewMessage:', error);
            throw new Error(`Failed to process message: ${error.message}`);
        }
    }
    async saveMessage(conversationId, content, role) {
        const message = {
            id: Date.now().toString(),
            conversationId,
            role,
            content,
            timestamp: Date.now()
        };
        await this.storage.saveMessage(message);
        return message;
    }
    async updateListenerContext(conversation, newMessage) {
        if (!conversation.models) {
            throw new Error('Models not configured for conversation');
        }
        const listenerModel = conversation.models.listener;
        if (!listenerModel) {
            throw new Error('Listener model not configured for conversation');
        }
        // Ensure contexts object exists and is properly initialized
        if (!conversation.models.contexts || typeof conversation.models.contexts !== 'object') {
            conversation.models.contexts = {};
        }
        // Initialize or get the current context
        let currentContext = conversation.models.contexts[listenerModel];
        if (!currentContext) {
            currentContext = {
                understanding: "Initial conversation context.",
                lastUpdated: Date.now(),
                messagesSeen: []
            };
            conversation.models.contexts[listenerModel] = currentContext;
        }
        try {
            const prompt = `You are observing a conversation to build your understanding. 
      Your current understanding: ${currentContext.understanding}
      
      New message: ${newMessage.content}
      
      Update your understanding of the conversation, maintaining your unique perspective.
      Focus on the key points that would be relevant if you need to respond later.`;
            const response = await this.sequentialChat.chat(prompt);
            // Update the listener's context in storage
            await this.storage.updateModelContext(conversation.id, listenerModel, {
                understanding: response,
                lastUpdated: Date.now(),
                messagesSeen: [
                    ...currentContext.messagesSeen,
                    parseInt(newMessage.id)
                ]
            });
        } catch (error) {
            console.error('Failed to update listener context:', error);
        }
    }
    async getResponderReply(conversation, message) {
        try {
            if (!conversation.models) {
                throw new Error('Models not configured for conversation');
            }
            const responderModel = conversation.models.responder;
            if (!responderModel) {
                throw new Error('Responder model not configured for conversation');
            }
            // Get all messages in the conversation
            const conversationMessages = await this.storage.getConversationMessages(conversation.id);
            // Build the conversation history as a single prompt
            const history = conversationMessages.map((msg)=>`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
            const prompt = `You are ${responderModel}, an AI assistant. Be helpful, clear, and concise in your responses.
      
Previous conversation:
${history}

User: ${message.content}`;
            const response = await this.sequentialChat.chat(prompt);
            return response;
        } catch (error) {
            console.error('Error in getResponderReply:', error);
            throw new Error(`Failed to get AI response: ${error.message}`);
        }
    }
    async addSystemMessage(conversationId, content) {
        return this.saveMessage(conversationId, content, 'system');
    }
}
}}),
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "cn": (()=>cn),
    "generateId": (()=>generateId)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$0$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/tailwind-merge@2.6.0/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$tailwind$2d$merge$40$2$2e$6$2e$0$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$clsx$40$2$2e$1$2e$1$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
}
}}),
"[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "Button": (()=>Button)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, variant = 'default', ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background", {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === 'default',
            "border border-input hover:bg-accent hover:text-accent-foreground": variant === 'outline',
            "hover:bg-accent hover:text-accent-foreground": variant === 'ghost'
        }, "h-10 py-2 px-4", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 12,
        columnNumber: 7
    }, this);
});
Button.displayName = "Button";
;
}}),
"[project]/src/components/ui/input.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "Input": (()=>Input)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
const Input = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, type, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/input.tsx",
        lineNumber: 10,
        columnNumber: 7
    }, this);
});
Input.displayName = "Input";
;
}}),
"[project]/src/components/ui/alert.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "Alert": (()=>Alert),
    "AlertDescription": (()=>AlertDescription),
    "AlertTitle": (()=>AlertTitle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$class$2d$variance$2d$authority$40$0$2e$7$2e$1$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/class-variance-authority@0.7.1/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
const alertVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$class$2d$variance$2d$authority$40$0$2e$7$2e$1$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", {
    variants: {
        variant: {
            default: "bg-background text-foreground",
            destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Alert = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, variant, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        role: "alert",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(alertVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 25,
        columnNumber: 3
    }, this));
Alert.displayName = "Alert";
const AlertTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("mb-1 font-medium leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 38,
        columnNumber: 3
    }, this));
AlertTitle.displayName = "AlertTitle";
const AlertDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-sm [&_p]:leading-relaxed", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 50,
        columnNumber: 3
    }, this));
AlertDescription.displayName = "AlertDescription";
;
}}),
"[project]/src/lib/ollama/test-connection.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "testOllamaConnection": (()=>testOllamaConnection)
});
async function testOllamaConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 10000); // 10 second timeout
        const response = await fetch('/api/test-connection', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        console.log('Ollama test response:', data);
        if (!response.ok || !data.success) {
            throw new Error(data.error || `Connection test failed: ${response.statusText}`);
        }
        return {
            success: true,
            deepseek: data.deepseek,
            qwen: data.qwen
        };
    } catch (error) {
        console.error('Ollama connection test failed:', error);
        if (error.name === 'AbortError') {
            throw new Error('Connection test timed out. Please check if Ollama server is responding.');
        }
        throw new Error(error.message || 'Failed to connect to Ollama server');
    }
}
}}),
"[project]/src/lib/ollama/connection.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "verifyOllamaSetup": (()=>verifyOllamaSetup)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ollama$2f$test$2d$connection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/ollama/test-connection.ts [app-ssr] (ecmascript)");
;
async function verifyOllamaSetup() {
    try {
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ollama$2f$test$2d$connection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["testOllamaConnection"])();
        console.log('Setup verification succeeded:', result);
        return {
            success: true
        };
    } catch (error) {
        console.error('Setup verification failed:', error);
        return {
            success: false,
            error: error.message || 'Failed to connect to Ollama server'
        };
    }
}
}}),
"[project]/src/components/conversation-list.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "ConversationList": (()=>ConversationList)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
"use client";
;
function ConversationList({ conversations, currentId, onSelect }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border-r w-64 p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-2",
            children: conversations.map((conversation)=>{
                const activeModel = conversation.models.responder;
                const timestamp = new Date(conversation.updatedAt).toLocaleDateString();
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>onSelect(conversation.id),
                    className: `w-full text-left p-3 rounded-lg ${conversation.id === currentId ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "font-medium",
                            children: conversation.title
                        }, void 0, false, {
                            fileName: "[project]/src/components/conversation-list.tsx",
                            lineNumber: 31,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-sm text-gray-500",
                            children: [
                                "Responder: ",
                                activeModel
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/conversation-list.tsx",
                            lineNumber: 32,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-gray-400",
                            children: timestamp
                        }, void 0, false, {
                            fileName: "[project]/src/components/conversation-list.tsx",
                            lineNumber: 35,
                            columnNumber: 15
                        }, this)
                    ]
                }, conversation.id, true, {
                    fileName: "[project]/src/components/conversation-list.tsx",
                    lineNumber: 22,
                    columnNumber: 13
                }, this);
            })
        }, void 0, false, {
            fileName: "[project]/src/components/conversation-list.tsx",
            lineNumber: 16,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/conversation-list.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/components/ui/model-role-switcher.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "ModelRoleSwitcher": (()=>ModelRoleSwitcher)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$474$2e$0_react$40$19$2e$0$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__ = __turbopack_import__("[project]/node_modules/.pnpm/lucide-react@0.474.0_react@19.0.0/node_modules/lucide-react/dist/esm/icons/arrow-up-down.js [app-ssr] (ecmascript) <export default as ArrowUpDown>");
"use client";
;
;
;
function ModelRoleSwitcher({ models, onSwitch, disabled }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-4 p-4 border-b",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 p-3 rounded-lg bg-blue-50 border border-blue-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm font-medium",
                        children: "Responder"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                        lineNumber: 20,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-blue-600",
                        children: models.responder
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                        lineNumber: 21,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                variant: "outline",
                onClick: onSwitch,
                disabled: disabled,
                title: "Switch model roles",
                className: "h-10 w-10 p-0",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$lucide$2d$react$40$0$2e$474$2e$0_react$40$19$2e$0$2e$0$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__["ArrowUpDown"], {
                    className: "h-4 w-4"
                }, void 0, false, {
                    fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 p-3 rounded-lg bg-gray-50 border border-gray-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm font-medium",
                        children: "Listener"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-600",
                        children: models.listener
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/model-role-switcher.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/model-role-switcher.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/components/chat-panel.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__, z: __turbopack_require_stub__ } = __turbopack_context__;
{
__turbopack_esm__({
    "ChatPanel": (()=>ChatPanel)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/.pnpm/next@15.1.6_@playwright+test@1.50.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/storage/db.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2f$message$2d$handler$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/chat/message-handler.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/button.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/input.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/alert.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ollama$2f$connection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/ollama/connection.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$conversation$2d$list$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/conversation-list.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$model$2d$role$2d$switcher$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/model-role-switcher.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
;
;
function ChatPanel() {
    const [currentConversation, setCurrentConversation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [conversations, setConversations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isServerConnected, setIsServerConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastConnectionCheck, setLastConnectionCheck] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    // Create a stable instance of MessageHandler
    const messageHandler = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chat$2f$message$2d$handler$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MessageHandler"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"]), []);
    // Check Ollama server connection and verify model functionality
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function verifyConnection() {
            // Only check if it's been more than 10 seconds since the last check
            const now = Date.now();
            if (now - lastConnectionCheck < 10000) {
                return;
            }
            setLastConnectionCheck(now);
            try {
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$ollama$2f$connection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["verifyOllamaSetup"])();
                setIsServerConnected(result.success);
                if (!result.success) {
                    setError(result.error || 'Unable to connect to Ollama server or model test failed. Please ensure Ollama is running and the model is properly installed.');
                } else {
                    setError(null);
                }
            } catch (error) {
                setIsServerConnected(false);
                setError(error.message || 'Ollama server not running or model test failed. Please start Ollama and ensure the model is installed.');
            }
        }
        verifyConnection();
        // Check connection every minute
        const interval = setInterval(verifyConnection, 60000);
        return ()=>clearInterval(interval);
    }, [
        lastConnectionCheck
    ]);
    // Load all conversations on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function loadConversations() {
            try {
                const allConversations = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].getConversations();
                setConversations(allConversations);
                // If we have conversations, load the most recent one
                if (allConversations.length > 0) {
                    await loadConversation(allConversations[0].id);
                } else {
                    // Create a new conversation if none exist
                    const newId = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].createConversation('New Chat', {
                        responder: 'deepseek-r1:14b',
                        listener: 'qwen2.5-coder:latest'
                    });
                    const conversations = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].getConversations();
                    setConversations(conversations);
                    const newConversation = conversations.find((conv)=>conv.id === newId);
                    if (newConversation) {
                        setCurrentConversation(newConversation);
                        setMessages([]);
                    }
                }
            } catch (error) {
                const errorMessage = error.message || 'Failed to initialize chat';
                console.error(errorMessage, error);
                setError(errorMessage);
            }
        }
        loadConversations();
    }, []);
    async function loadConversation(id) {
        try {
            const conversation = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].getConversation(id);
            if (!conversation) {
                throw new Error('Conversation not found');
            }
            const messages = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].getConversationMessages(id);
            setCurrentConversation(conversation);
            setMessages(messages);
        } catch (error) {
            const errorMessage = error.message || 'Failed to load conversation';
            console.error(errorMessage, error);
            setError(errorMessage);
        }
    }
    async function handleRoleSwitch() {
        if (!currentConversation || isLoading) return;
        setIsLoading(true);
        try {
            // Add a system message to mark the switch
            const switchMessage = await messageHandler.addSystemMessage(currentConversation.id, `Switching roles - ${currentConversation.models.listener} is now responding`);
            // Update the conversation roles in storage
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].switchModelRoles(currentConversation.id);
            // Get the updated conversation
            const updatedConversation = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].getConversation(currentConversation.id);
            setCurrentConversation(updatedConversation);
            // Update messages to include the switch notification
            setMessages((prev)=>[
                    ...prev,
                    switchMessage
                ]);
        } catch (error) {
            const errorMessage = error.message || 'Failed to switch roles';
            console.error(errorMessage, error);
            setError(errorMessage);
        } finally{
            setIsLoading(false);
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        if (!input.trim() || isLoading || !currentConversation || !isServerConnected) return;
        setIsLoading(true);
        setError(null); // Clear any previous errors
        try {
            // First save the user's message
            const userMessage = {
                id: Date.now().toString(),
                conversationId: currentConversation.id,
                role: 'user',
                content: input,
                timestamp: Date.now()
            };
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].saveMessage(userMessage);
            setMessages((prev)=>[
                    ...prev,
                    userMessage
                ]);
            setInput(''); // Clear input after sending
            // Then process the message and get AI response
            try {
                await messageHandler.processNewMessage(currentConversation, input, 'user');
                // Reload messages to get the AI response
                const updatedMessages = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].getConversationMessages(currentConversation.id);
                setMessages(updatedMessages);
            } catch (error) {
                // If the AI response fails, show the error but keep the user's message
                const errorMessage = error.message || 'Failed to get AI response';
                console.error(errorMessage, error);
                setError(errorMessage);
                // Add a system message to indicate the error
                const errorSystemMessage = {
                    id: Date.now().toString(),
                    conversationId: currentConversation.id,
                    role: 'system',
                    content: `Error: ${errorMessage}. Please try again.`,
                    timestamp: Date.now()
                };
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$storage$2f$db$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storage"].saveMessage(errorSystemMessage);
                setMessages((prev)=>[
                        ...prev,
                        errorSystemMessage
                    ]);
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to process message';
            console.error(errorMessage, error);
            setError(errorMessage);
        } finally{
            setIsLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$conversation$2d$list$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConversationList"], {
                conversations: conversations,
                currentId: currentConversation?.id || '',
                onSelect: loadConversation
            }, void 0, false, {
                fileName: "[project]/src/components/chat-panel.tsx",
                lineNumber: 193,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col flex-1 relative",
                children: [
                    currentConversation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$model$2d$role$2d$switcher$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ModelRoleSwitcher"], {
                        models: currentConversation.models,
                        onSwitch: handleRoleSwitch,
                        disabled: isLoading
                    }, void 0, false, {
                        fileName: "[project]/src/components/chat-panel.tsx",
                        lineNumber: 200,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 overflow-auto p-4 space-y-4",
                        children: [
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Alert"], {
                                variant: "destructive",
                                className: "mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlertTitle"], {
                                        children: "Error"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/chat-panel.tsx",
                                        lineNumber: 209,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                        children: [
                                            error,
                                            error.includes('deepseek-r1:14b') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: "Run this command to load the DeepSeek model:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/chat-panel.tsx",
                                                        lineNumber: 214,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                        className: "bg-gray-800 text-white p-2 mt-1 rounded",
                                                        children: "ollama pull deepseek-r1:14b"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/chat-panel.tsx",
                                                        lineNumber: 215,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/chat-panel.tsx",
                                                lineNumber: 213,
                                                columnNumber: 19
                                            }, this),
                                            error.includes('qwen2.5-coder') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: "Run this command to load the Qwen model:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/chat-panel.tsx",
                                                        lineNumber: 220,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                                        className: "bg-gray-800 text-white p-2 mt-1 rounded",
                                                        children: "ollama pull qwen2.5-coder"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/chat-panel.tsx",
                                                        lineNumber: 221,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/chat-panel.tsx",
                                                lineNumber: 219,
                                                columnNumber: 19
                                            }, this),
                                            error.includes('not running') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-2",
                                                children: "Make sure Ollama is installed and running on your system."
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/chat-panel.tsx",
                                                lineNumber: 225,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/chat-panel.tsx",
                                        lineNumber: 210,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/chat-panel.tsx",
                                lineNumber: 208,
                                columnNumber: 13
                            }, this),
                            messages.map((message)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `flex ${message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-blue-500 text-white' : message.role === 'system' ? 'bg-gray-200 text-gray-600 text-sm' : 'bg-gray-100'}`,
                                        children: message.content
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/chat-panel.tsx",
                                        lineNumber: 241,
                                        columnNumber: 15
                                    }, this)
                                }, message.id, false, {
                                    fileName: "[project]/src/components/chat-panel.tsx",
                                    lineNumber: 231,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/chat-panel.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: handleSubmit,
                        className: "p-4 border-t",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"], {
                                        value: input,
                                        onChange: (e)=>setInput(e.target.value),
                                        placeholder: isServerConnected ? "Type your message..." : "Connecting to Ollama server...",
                                        disabled: isLoading || !isServerConnected
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/chat-panel.tsx",
                                        lineNumber: 258,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "submit",
                                        disabled: isLoading || !isServerConnected,
                                        title: !isServerConnected ? "Waiting for Ollama server connection" : undefined,
                                        children: isLoading ? 'Sending...' : 'Send'
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/chat-panel.tsx",
                                        lineNumber: 264,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/chat-panel.tsx",
                                lineNumber: 257,
                                columnNumber: 11
                            }, this),
                            !isServerConnected && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Alert"], {
                                className: "mt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlertTitle"], {
                                        children: "Connecting..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/chat-panel.tsx",
                                        lineNumber: 274,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$1$2e$6_$40$playwright$2b$test$40$1$2e$50$2e$0_react$2d$dom$40$19$2e$0$2e$0_react$40$19$2e$0$2e$0_$5f$react$40$19$2e$0$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                        children: "Attempting to connect to Ollama server..."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/chat-panel.tsx",
                                        lineNumber: 275,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/chat-panel.tsx",
                                lineNumber: 273,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/chat-panel.tsx",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/chat-panel.tsx",
                lineNumber: 198,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/chat-panel.tsx",
        lineNumber: 192,
        columnNumber: 5
    }, this);
}
}}),
"[project]/src/app/page.tsx [app-rsc] (ecmascript, Next.js server component, client modules ssr)": ((__turbopack_context__) => {

var { r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, b: __turbopack_worker_blob_url__, g: global, __dirname, t: __turbopack_require_real__ } = __turbopack_context__;
{
}}),

};

//# sourceMappingURL=src_e89dbb._.js.map