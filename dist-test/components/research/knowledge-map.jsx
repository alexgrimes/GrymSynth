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
exports.KnowledgeMapView = void 0;
const react_1 = __importStar(require("react"));
const dynamic_1 = __importDefault(require("next/dynamic"));
// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = (0, dynamic_1.default)(() => Promise.resolve().then(() => __importStar(require('react-force-graph-2d'))), { ssr: false });
const defaultNodeColor = (node) => {
    const depthColors = [
        '#60A5FA',
        '#34D399',
        '#F472B6',
        '#A78BFA',
        '#FBBF24', // amber-400
    ];
    return depthColors[Math.min(node.depth - 1, depthColors.length - 1)];
};
const defaultNodeSize = (node) => Math.sqrt(node.size) * 5;
const defaultLinkStrength = (link) => link.strength;
const KnowledgeMapView = ({ data, width, height, nodeColor = defaultNodeColor, nodeSize = defaultNodeSize, linkStrength = defaultLinkStrength, onNodeClick, className = '', }) => {
    const graphRef = (0, react_1.useRef)(null);
    const handleNodeClick = (0, react_1.useCallback)((node) => {
        if (onNodeClick) {
            onNodeClick(node);
        }
        // Center view on clicked node
        const distance = 200;
        const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0);
        if (graphRef.current) {
            graphRef.current.centerAt(node.x || 0, node.y || 0, 1000 // transition duration
            );
            graphRef.current.zoom(2, 1000); // zoom level and duration
        }
    }, [onNodeClick]);
    (0, react_1.useEffect)(() => {
        // Initial zoom to fit
        if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
        }
    }, [data]);
    const graphData = {
        nodes: data.nodes,
        links: data.links
    };
    return (<div className={`relative ${className}`} style={{ width, height }}>
      <ForceGraph2D ref={graphRef} graphData={graphData} nodeColor={(node) => nodeColor(node)} nodeVal={(node) => nodeSize(node)} linkStrength={linkStrength} nodeLabel={(node) => {
            const n = node;
            return `${n.id}\nDepth: ${n.depth}\nConnections: ${n.connections}`;
        }} onNodeClick={handleNodeClick} width={width} height={height} linkDirectionalParticles={2} linkDirectionalParticleSpeed={(d) => d.strength * 0.01} d3VelocityDecay={0.3} cooldownTime={3000} nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node;
            const label = n.id;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x || 0, node.y || 0, nodeSize(n) / globalScale, 0, 2 * Math.PI);
            ctx.fillStyle = nodeColor(n);
            ctx.fill();
            // Draw label background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect((node.x || 0) - bckgDimensions[0] / 2, (node.y || 0) + nodeSize(n) / globalScale + 2, bckgDimensions[0], bckgDimensions[1]);
            // Draw label text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000';
            ctx.fillText(label, node.x || 0, (node.y || 0) + nodeSize(n) / globalScale + 2 + bckgDimensions[1] / 2);
        }}/>
    </div>);
};
exports.KnowledgeMapView = KnowledgeMapView;
//# sourceMappingURL=knowledge-map.jsx.map