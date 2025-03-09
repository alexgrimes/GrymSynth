"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeGraph = void 0;
class ThemeGraph {
    constructor() {
        this.SIGNIFICANCE_THRESHOLD = 3; // Minimum occurrences to be considered significant
        this.EVOLUTION_THRESHOLD = 0.3; // Minimum change rate to be considered evolved
        this.nodes = new Map();
    }
    addNode(concept) {
        if (!this.nodes.has(concept)) {
            this.nodes.set(concept, {
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
            this.updateNode(concept, conversationId, related);
            return;
        }
        node.occurrences++;
        node.lastSeen = new Date();
        node.conversations.add(conversationId);
        node.evolution.breadth = Math.max(node.evolution.breadth, related.length);
        // Update related concepts
        related.forEach(rel => {
            const count = node.relatedConcepts.get(rel) || 0;
            node.relatedConcepts.set(rel, count + 1);
            // Add bidirectional relationship
            this.addNode(rel);
            const relNode = this.nodes.get(rel);
            const relCount = relNode.relatedConcepts.get(concept) || 0;
            relNode.relatedConcepts.set(concept, relCount + 1);
        });
        // Update evolution metrics
        this.updateEvolutionMetrics(concept);
    }
    updateEvolutionMetrics(concept) {
        const node = this.nodes.get(concept);
        if (!node)
            return;
        // Calculate depth based on relationship strength
        const relationshipStrength = Array.from(node.relatedConcepts.values())
            .reduce((sum, count) => sum + count, 0) / node.relatedConcepts.size;
        node.evolution.depth = Math.max(node.evolution.depth, Math.log2(1 + relationshipStrength));
        // Update branches based on strong relationships
        const strongRelations = Array.from(node.relatedConcepts.entries())
            .filter(([_, count]) => count >= this.SIGNIFICANCE_THRESHOLD)
            .map(([rel]) => rel);
        node.evolution.branches.set(new Date().toISOString(), strongRelations);
    }
    getEmergingThemes() {
        return Array.from(this.nodes.entries())
            .filter(([_, node]) => this.isSignificantTheme(node))
            .map(([concept]) => concept);
    }
    isSignificantTheme(node) {
        return node.occurrences >= this.SIGNIFICANCE_THRESHOLD &&
            node.evolution.depth >= 2 &&
            node.evolution.breadth >= 2;
    }
    findConnections() {
        const connections = new Map();
        this.nodes.forEach((node, concept) => {
            if (!this.isSignificantTheme(node))
                return;
            const strongConnections = Array.from(node.relatedConcepts.entries())
                .filter(([relConcept, count]) => {
                const relNode = this.nodes.get(relConcept);
                return relNode &&
                    this.isSignificantTheme(relNode) &&
                    count >= this.SIGNIFICANCE_THRESHOLD;
            })
                .map(([relConcept]) => relConcept);
            if (strongConnections.length > 0) {
                connections.set(concept, strongConnections);
            }
        });
        return connections;
    }
    findPatterns(timeRange) {
        const patterns = [];
        this.nodes.forEach((node, concept) => {
            if (!this.isSignificantTheme(node))
                return;
            if (timeRange &&
                (node.lastSeen < timeRange.start || node.firstSeen > timeRange.end)) {
                return;
            }
            const metrics = this.calculateEvolutionMetrics(node);
            const relatedThemes = Array.from(node.relatedConcepts.entries())
                .filter(([_, count]) => count >= this.SIGNIFICANCE_THRESHOLD)
                .map(([theme]) => theme);
            patterns.push({
                theme: concept,
                confidence: this.calculateConfidence(node),
                relatedThemes,
                metrics
            });
        });
        return patterns.sort((a, b) => b.confidence - a.confidence);
    }
    calculateEvolutionMetrics(node) {
        const timespan = node.lastSeen.getTime() - node.firstSeen.getTime();
        const daysActive = timespan / (1000 * 60 * 60 * 24);
        const velocity = node.occurrences / Math.max(daysActive, 1);
        const stability = node.conversations.size / node.occurrences;
        return {
            depth: node.evolution.depth,
            breadth: node.evolution.breadth,
            velocity,
            stability
        };
    }
    calculateConfidence(node) {
        const metrics = this.calculateEvolutionMetrics(node);
        // Weighted combination of various factors
        return ((0.3 * (node.occurrences / this.SIGNIFICANCE_THRESHOLD)) +
            (0.2 * (metrics.depth / 5)) +
            (0.2 * (metrics.breadth / 10)) +
            (0.15 * metrics.velocity) +
            (0.15 * metrics.stability));
    }
    pruneInactiveThemes(threshold) {
        const now = new Date();
        this.nodes.forEach((node, concept) => {
            const daysSinceLastSeen = (now.getTime() - node.lastSeen.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastSeen > threshold && !this.isSignificantTheme(node)) {
                this.nodes.delete(concept);
            }
        });
    }
    getThemeDetails(concept) {
        return this.nodes.get(concept);
    }
    getAllThemes() {
        return Array.from(this.nodes.keys());
    }
}
exports.ThemeGraph = ThemeGraph;
//# sourceMappingURL=theme-graph.js.map