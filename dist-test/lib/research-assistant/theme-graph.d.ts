import { ThemeNode, KnowledgeMap } from './types';
export declare class ThemeGraph {
    private nodes;
    constructor();
    addNode(concept: string): void;
    updateNode(concept: string, conversationId: string, related: string[]): void;
    getNode(concept: string): ThemeNode | undefined;
    getAllNodes(): ThemeNode[];
    findConnections(): Map<string, string[]>;
    getEmergingThemes(): string[];
    createKnowledgeMap(): KnowledgeMap;
    private groupByConnectivity;
    private calculateCentroid;
    pruneInactiveThemes(threshold: number): void;
}
