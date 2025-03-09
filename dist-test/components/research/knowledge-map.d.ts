import React from 'react';
import { KnowledgeMap, ThemeVisualizerOptions } from '@/lib/research-assistant/types';
interface KnowledgeMapProps extends ThemeVisualizerOptions {
    data: KnowledgeMap;
    className?: string;
}
export declare const KnowledgeMapView: React.FC<KnowledgeMapProps>;
export {};
