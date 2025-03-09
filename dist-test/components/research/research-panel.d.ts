import React from 'react';
import { KnowledgeMapNode } from '@/lib/research-assistant/types';
interface ResearchPanelProps {
    className?: string;
    width?: number;
    height?: number;
    onNodeClick?: (node: KnowledgeMapNode) => void;
}
export declare const ResearchPanel: React.FC<ResearchPanelProps>;
export {};
