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
exports.useResearch = exports.ResearchProvider = void 0;
const react_1 = __importStar(require("react"));
const research_assistant_1 = require("@/lib/research-assistant/research-assistant");
const ResearchContext = (0, react_1.createContext)(null);
const ResearchProvider = ({ children, llmProvider }) => {
    const [researchAssistant] = (0, react_1.useState)(() => new research_assistant_1.ResearchAssistant(llmProvider));
    const [lastAnalysis, setLastAnalysis] = (0, react_1.useState)(null);
    const [isAnalyzing, setIsAnalyzing] = (0, react_1.useState)(false);
    const analyzeConversation = (0, react_1.useCallback)(async (conversation, conversationId) => {
        setIsAnalyzing(true);
        try {
            const result = await researchAssistant.analyzeConversation(conversation, conversationId);
            setLastAnalysis(result);
            return result;
        }
        finally {
            setIsAnalyzing(false);
        }
    }, [researchAssistant]);
    const getVisualization = (0, react_1.useCallback)(() => {
        return researchAssistant.getVisualization();
    }, [researchAssistant]);
    const getInsights = (0, react_1.useCallback)(async () => {
        return researchAssistant.getInsights();
    }, [researchAssistant]);
    const getEmergingThemes = (0, react_1.useCallback)(() => {
        return researchAssistant.getEmergingThemes();
    }, [researchAssistant]);
    const incorporateFeedback = (0, react_1.useCallback)((feedback) => {
        researchAssistant.incorporateFeedback(feedback);
    }, [researchAssistant]);
    const value = {
        analyzeConversation,
        getVisualization,
        getInsights,
        getEmergingThemes,
        incorporateFeedback,
        lastAnalysis,
        isAnalyzing
    };
    return (<ResearchContext.Provider value={value}>
      {children}
    </ResearchContext.Provider>);
};
exports.ResearchProvider = ResearchProvider;
const useResearch = () => {
    const context = (0, react_1.useContext)(ResearchContext);
    if (!context) {
        throw new Error('useResearch must be used within a ResearchProvider');
    }
    return context;
};
exports.useResearch = useResearch;
//# sourceMappingURL=research-context.jsx.map