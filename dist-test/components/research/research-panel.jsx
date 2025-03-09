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
exports.ResearchPanel = void 0;
const react_1 = __importStar(require("react"));
const research_context_1 = require("@/contexts/research-context");
const knowledge_map_1 = require("./knowledge-map");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const ResearchPanel = ({ className = '', width = 900, height = 600, onNodeClick }) => {
    const { lastAnalysis, isAnalyzing, getInsights, incorporateFeedback } = (0, research_context_1.useResearch)();
    const [insights, setInsights] = (0, react_1.useState)([]);
    const [selectedNode, setSelectedNode] = (0, react_1.useState)(null);
    const [isLoadingInsights, setIsLoadingInsights] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (lastAnalysis) {
            loadInsights();
        }
    }, [lastAnalysis]);
    const loadInsights = async () => {
        setIsLoadingInsights(true);
        try {
            const newInsights = await getInsights();
            setInsights(newInsights);
        }
        catch (error) {
            console.error('Error loading insights:', error);
        }
        finally {
            setIsLoadingInsights(false);
        }
    };
    const handleNodeClick = (node) => {
        setSelectedNode(node);
        onNodeClick?.(node);
    };
    const handleFeedback = (insightId, isAccurate) => {
        const insight = insights.find(i => i.title === insightId);
        if (insight) {
            incorporateFeedback({
                themeAccuracy: isAccurate,
                missingConnections: [],
                userInsights: insight.description
            });
        }
    };
    if (!lastAnalysis) {
        return (<div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <p className="text-gray-500">No analysis available yet</p>
      </div>);
    }
    return (<div className={`grid grid-cols-3 gap-4 ${className}`} style={{ width, height }}>
      {/* Knowledge Map */}
      <div className="col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
        <knowledge_map_1.KnowledgeMapView data={lastAnalysis.visualization} width={width * 0.66} height={height} onNodeClick={handleNodeClick}/>
      </div>

      {/* Insights Panel */}
      <div className="col-span-1 space-y-4 overflow-y-auto p-4">
        {/* Selected Node Info */}
        {selectedNode && (<card_1.Card className="p-4 bg-white shadow">
            <h3 className="font-semibold text-lg mb-2">{selectedNode.id}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Depth: {selectedNode.depth}</p>
              <p>Connections: {selectedNode.connections}</p>
            </div>
          </card_1.Card>)}

        {/* Research Insights */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Research Insights</h3>
          {isLoadingInsights ? (<div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            </div>) : (insights.map((insight) => (<card_1.Card key={insight.title} className="p-4 bg-white shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-base">{insight.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${insight.type === 'trend' ? 'bg-blue-100 text-blue-800' :
                insight.type === 'connection' ? 'bg-green-100 text-green-800' :
                    insight.type === 'gap' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-purple-100 text-purple-800'}`}>
                    {insight.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {insight.relatedThemes.map((theme) => (<span key={theme} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {theme}
                    </span>))}
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </div>
                  <div className="space-x-2">
                    <button_1.Button variant="outline" size="sm" onClick={() => handleFeedback(insight.title, false)} className="text-red-600 hover:bg-red-50">
                      Inaccurate
                    </button_1.Button>
                    <button_1.Button variant="outline" size="sm" onClick={() => handleFeedback(insight.title, true)} className="text-green-600 hover:bg-green-50">
                      Accurate
                    </button_1.Button>
                  </div>
                </div>
              </card_1.Card>)))}
        </div>
      </div>
    </div>);
};
exports.ResearchPanel = ResearchPanel;
//# sourceMappingURL=research-panel.jsx.map