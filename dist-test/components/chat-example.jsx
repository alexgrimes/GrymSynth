"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatExample = void 0;
const react_1 = require("react");
const dual_model_chat_1 = require("../lib/ollama/dual-model-chat");
const button_1 = require("./ui/button");
const input_1 = require("./ui/input");
function ChatExample() {
    const [message, setMessage] = (0, react_1.useState)('');
    const [response, setResponse] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const chat = new dual_model_chat_1.DualModelChat();
    const handleSubmit = async (role) => {
        if (!message.trim())
            return;
        setIsLoading(true);
        setResponse('');
        try {
            // Example of streaming response
            await chat.getStreamingResponse(message, role, (chunk) => {
                setResponse(prev => prev + chunk);
            }, { temperature: 0.7 });
        }
        catch (error) {
            console.error('Chat error:', error);
            setResponse('Error: Failed to get response from the model.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex gap-2">
        <input_1.Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter your message..." disabled={isLoading} onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit('developer');
            }
        }}/>
        <button_1.Button onClick={() => handleSubmit('architect')} disabled={isLoading}>
          Ask Architect
        </button_1.Button>
        <button_1.Button onClick={() => handleSubmit('developer')} disabled={isLoading}>
          Ask Developer
        </button_1.Button>
      </div>

      {isLoading && (<div className="text-sm text-gray-500">
          Thinking...
        </div>)}

      {response && (<div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4">
          {response}
        </div>)}
    </div>);
}
exports.ChatExample = ChatExample;
//# sourceMappingURL=chat-example.jsx.map