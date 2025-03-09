"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanel = void 0;
const react_1 = __importStar(require("react"));
const nanoid_1 = require("nanoid");
const button_1 = require("./ui/button");
const input_1 = require("./ui/input");
const db_1 = require("../lib/storage/db");
const client_1 = require("../lib/ollama/client");
const context_manager_1 = require("../lib/context/context-manager");
function ChatPanel() {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [conversationId, setConversationId] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [input, setInput] = (0, react_1.useState)('');
    const contextManager = (0, react_1.useRef)(new context_manager_1.ContextManager());
    // Initialize conversation if needed
    (0, react_1.useEffect)(() => {
        async function init() {
            if (!conversationId) {
                const newId = await db_1.storage.createConversation('New Chat', {
                    responder: 'deepseek-r1:14b',
                    listener: 'qwen2.5-coder'
                });
                setConversationId(newId);
            }
            // Load existing messages
            if (conversationId) {
                const existingMessages = await db_1.storage.getMessages(conversationId);
                setMessages(existingMessages);
                // Initialize context with existing messages
                for (const message of existingMessages) {
                    await contextManager.current.updateContext(message, message.role === 'assistant' ? message.content : '');
                }
            }
        }
        init();
    }, [conversationId]);
    async function handleSubmit(e) {
        e.preventDefault();
        if (!input.trim() || isLoading || !conversationId)
            return;
        setIsLoading(true);
        try {
            // Save user message
            const userMessage = {
                id: (0, nanoid_1.nanoid)(),
                content: input,
                role: 'user',
                timestamp: Date.now(),
                conversationId
            };
            await db_1.storage.saveMessage(userMessage);
            setMessages(prev => [...prev, userMessage]);
            setInput('');
            // Get current context for the chat
            const context = contextManager.current.getContext();
            const contextMessages = [
                // Add summaries as system messages
                ...context.summaries.map(summary => ({
                    role: 'system',
                    content: `Previous conversation summary: ${summary}`
                })),
                // Add recent messages
                ...context.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                // Add current message
                { role: 'user', content: input }
            ];
            // Get model response with context
            const response = await client_1.ollamaClient.chat({
                messages: contextMessages,
                model: 'deepseek-r1:14b'
            });
            // Save model response
            const assistantMessage = {
                id: (0, nanoid_1.nanoid)(),
                content: response.content,
                role: 'assistant',
                timestamp: Date.now(),
                conversationId,
                model: 'deepseek-r1:14b'
            };
            await db_1.storage.saveMessage(assistantMessage);
            setMessages(prev => [...prev, assistantMessage]);
            // Update context with new messages
            const updatedContext = await contextManager.current.updateContext(userMessage, response.content);
            // Update model context in storage
            await db_1.storage.updateModelContext(conversationId, 'deepseek-r1:14b', {
                understanding: updatedContext.summaries.join('\n'),
                messagesSeen: messages.map(m => parseInt(m.id)).filter(id => !isNaN(id))
            });
        }
        catch (error) {
            console.error('Chat error:', error);
        }
        finally {
            setIsLoading(false);
        }
    }
    return (<div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        {messages.map(message => (<div key={message.id} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100'}`}>
              {message.content}
            </div>
          </div>))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input_1.Input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." disabled={isLoading}/>
          <button_1.Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button_1.Button>
        </div>
      </form>
    </div>);
}
exports.ChatPanel = ChatPanel;
//# sourceMappingURL=chat-panel.jsx.map