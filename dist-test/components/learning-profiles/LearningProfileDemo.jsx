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
exports.LearningProfileDemo = void 0;
const react_1 = __importStar(require("react"));
const ModelLearningView_1 = require("./ModelLearningView");
const learning_enhanced_provider_1 = require("../../lib/llm/providers/learning-enhanced-provider");
const DEMO_PROMPTS = [
    {
        topic: 'TypeScript',
        prompt: 'Explain TypeScript interfaces and how they help with code organization.'
    },
    {
        topic: 'React',
        prompt: 'What are React hooks and how do they improve component development?'
    },
    {
        topic: 'Node.js',
        prompt: 'Explain Node.js event loop and how it handles asynchronous operations.'
    },
    {
        topic: 'GraphQL',
        prompt: 'Compare GraphQL with REST APIs and explain its advantages.'
    }
];
function LearningProfileDemo() {
    const [provider, setProvider] = (0, react_1.useState)(null);
    const [modelId, setModelId] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [currentPrompt, setCurrentPrompt] = (0, react_1.useState)(0);
    const [response, setResponse] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const initProvider = async () => {
            try {
                const enhancedProvider = (0, learning_enhanced_provider_1.createLearningEnhancedOllamaProvider)('codellama', 'code');
                setProvider(enhancedProvider);
                setModelId(`ollama-codellama`);
                setLoading(false);
            }
            catch (error) {
                console.error('Failed to initialize provider:', error);
                setLoading(false);
            }
        };
        initProvider();
    }, []);
    const handleNextPrompt = async () => {
        if (!provider)
            return;
        setLoading(true);
        try {
            const prompt = DEMO_PROMPTS[currentPrompt];
            const result = await provider.chat({
                messages: [
                    {
                        role: 'user',
                        content: prompt.prompt
                    }
                ]
            });
            setResponse(result.content);
            setCurrentPrompt((prev) => (prev + 1) % DEMO_PROMPTS.length);
        }
        catch (error) {
            console.error('Failed to get response:', error);
        }
        setLoading(false);
    };
    if (!provider || !modelId) {
        return <div>Initializing learning profile demo...</div>;
    }
    return (<div className="space-y-8 p-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Model Learning Profile Demo</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Current Topic: {DEMO_PROMPTS[currentPrompt].topic}</h3>
            <p className="text-gray-600">{DEMO_PROMPTS[currentPrompt].prompt}</p>
          </div>

          {response && (<div className="bg-gray-50 rounded p-4">
              <h4 className="font-medium mb-2">Model Response:</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
            </div>)}

          <button onClick={handleNextPrompt} disabled={loading} className={`px-4 py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}>
            {loading ? 'Processing...' : 'Try Next Prompt'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <ModelLearningView_1.ModelLearningView modelId={modelId}/>
      </div>
    </div>);
}
exports.LearningProfileDemo = LearningProfileDemo;
//# sourceMappingURL=LearningProfileDemo.jsx.map