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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelLearningView = void 0;
const react_1 = __importStar(require("react"));
const learning_profiles_1 = require("../../lib/learning-profiles");
const react_force_graph_2d_1 = __importDefault(require("react-force-graph-2d"));
function ModelLearningView({ modelId, width = 600, height = 400 }) {
    const [profile, setProfile] = (0, react_1.useState)(null);
    const [graphData, setGraphData] = (0, react_1.useState)({ nodes: [], links: [] });
    (0, react_1.useEffect)(() => {
        const loadProfile = async () => {
            const data = await (0, learning_profiles_1.visualizeProfile)(modelId);
            setProfile(data);
        };
        loadProfile();
    }, [modelId]);
    (0, react_1.useEffect)(() => {
        if (!profile)
            return;
        // Convert profile data to graph format
        const nodes = profile.domains.map(domain => ({
            id: domain.name,
            name: domain.name,
            val: Math.max(5, domain.confidence * 20),
            color: getMasteryColor(domain.mastery),
            mastery: domain.mastery,
            confidence: domain.confidence
        }));
        const links = profile.domains.flatMap(domain => domain.connections.map(conn => ({
            source: domain.name,
            target: conn.to,
            value: conn.strength
        })));
        setGraphData({ nodes, links });
    }, [profile]);
    if (!profile) {
        return <div>Loading learning profile...</div>;
    }
    return (<div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Model Learning Graph</h3>
        <div className="border rounded">
          <react_force_graph_2d_1.default graphData={graphData} width={width} height={height} nodeLabel={node => `${node.name} (${Math.round(node.confidence * 100)}% confident)`} linkWidth={link => link.value * 2} nodeRelSize={6} linkColor={() => '#999'} nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.fillStyle = node.color;
            ctx.beginPath();
            ctx.arc(0, 0, node.val, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, 0, 0);
        }}/>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Learning Timeline</h3>
        <div className="space-y-2">
          {profile.timeline.map((event, i) => (<div key={i} className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </span>
              <span className="font-medium">{event.domain}</span>
              <span className="text-gray-600">
                {formatEvent(event.event)}
              </span>
            </div>))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Domain Mastery</h3>
        <div className="grid grid-cols-2 gap-4">
          {profile.domains.map(domain => (<div key={domain.name} className="border rounded p-2">
              <div className="font-medium">{domain.name}</div>
              <div className="flex items-center space-x-2">
                <div className="h-2 flex-grow rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${domain.confidence * 100}%` }}/>
                </div>
                <span className="text-sm text-gray-600">
                  {Math.round(domain.confidence * 100)}%
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {domain.mastery}
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
exports.ModelLearningView = ModelLearningView;
function getMasteryColor(mastery) {
    switch (mastery) {
        case 'novice':
            return '#60A5FA'; // blue-400
        case 'competent':
            return '#34D399'; // green-400
        case 'expert':
            return '#F59E0B'; // yellow-500
        default:
            return '#9CA3AF'; // gray-400
    }
}
function formatEvent(event) {
    switch (event) {
        case 'interaction':
            return 'New interaction';
        case 'mastery_change':
            return 'Mastery level changed';
        case 'connection_formed':
            return 'New connection discovered';
        default:
            return event;
    }
}
//# sourceMappingURL=ModelLearningView.jsx.map