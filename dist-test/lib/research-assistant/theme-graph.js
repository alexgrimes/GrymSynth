"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeGraph = void 0;
class ThemeGraph {
    constructor() {
        this.nodes = new Map();
    }
    addNode(concept) {
        if (!this.nodes.has(concept)) {
            this.nodes.set(concept, {
                id: concept,
                occurrences: 1,
                relatedConcepts: new Map(),
                firstSeen: new Date(),
                lastSeen: new Date(),
                conversations: new Set(),
                evolution: {
                    branches: new Map(),
                    depth: 1,
                    breadth: 0
                }
            });
        }
    }
    updateNode(concept, conversationId, related) {
        const node = this.nodes.get(concept);
        if (!node) {
            this.addNode(concept);
            return this.updateNode(concept, conversationId, related);
        }
        // Update basic metrics
        node.occurrences++;
        node.lastSeen = new Date();
        node.conversations.add(conversationId);
        // Update related concepts
        related.forEach(rel => {
            const current = node.relatedConcepts.get(rel) || 0;
            node.relatedConcepts.set(rel, current + 1);
        });
        // Update evolution metrics
        node.evolution.breadth = node.relatedConcepts.size;
        node.evolution.depth = Math.max(node.evolution.depth, Math.ceil(Math.log2(node.occurrences + 1)));
        // Add to branches if new relationships found
        const branchKey = new Date().toISOString().split('T')[0];
        node.evolution.branches.set(branchKey, related);
    }
    getNode(concept) {
        return this.nodes.get(concept);
    }
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
    findConnections() {
        const connections = new Map();
        this.nodes.forEach((node, concept) => {
            const related = Array.from(node.relatedConcepts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([rel]) => rel);
            connections.set(concept, related);
        });
        return connections;
    }
    getEmergingThemes() {
        const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 1 week
        const emerging = Array.from(this.nodes.entries())
            .filter(([_, node]) => {
            const isRecent = node.firstSeen >= recentThreshold;
            const hasConnections = node.relatedConcepts.size >= 2;
            const isGrowing = node.evolution.depth >= 2;
            return isRecent && hasConnections && isGrowing;
        })
            .map(([concept]) => concept);
        return emerging;
    }
    createKnowledgeMap() {
        const nodes = [];
        const links = [];
        const clusters = [];
        // Create nodes
        this.nodes.forEach((node, id) => {
            nodes.push({
                id,
                size: node.occurrences,
                depth: node.evolution.depth,
                connections: node.relatedConcepts.size
            });
            // Create links
            node.relatedConcepts.forEach((strength, target) => {
                if (this.nodes.has(target)) {
                    links.push({
                        source: id,
                        target,
                        strength: strength / Math.max(node.occurrences, 1)
                    });
                }
            });
        });
        // Create clusters using simple grouping by connection density
        const grouped = this.groupByConnectivity(nodes, links);
        grouped.forEach((themes, id) => {
            clusters.push({
                id: `cluster-${id}`,
                themes,
                centroid: this.calculateCentroid(themes)
            });
        });
        return { nodes, links, clusters };
    }
    groupByConnectivity(nodes, links) {
        const groups = new Map();
        const visited = new Set();
        const findConnectedNodes = (nodeId, groupId) => {
            if (visited.has(nodeId))
                return;
            visited.add(nodeId);
            const group = groups.get(groupId) || [];
            group.push(nodeId);
            groups.set(groupId, group);
            links
                .filter(link => link.source === nodeId || link.target === nodeId)
                .forEach(link => {
                const nextNode = link.source === nodeId ? link.target : link.source;
                findConnectedNodes(nextNode, groupId);
            });
        };
        let groupId = 0;
        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                findConnectedNodes(node.id, groupId++);
            }
        });
        return groups;
    }
    calculateCentroid(themes) {
        // Simple placeholder - in real implementation, would use force-directed layout positions
        return { x: Math.random() * 100, y: Math.random() * 100 };
    }
    pruneInactiveThemes(threshold) {
        const cutoff = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000);
        this.nodes.forEach((node, concept) => {
            if (node.lastSeen < cutoff && node.occurrences < 3) {
                this.nodes.delete(concept);
            }
        });
    }
}
exports.ThemeGraph = ThemeGraph;
//# sourceMappingURL=theme-graph.js.map