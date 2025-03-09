"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicThemeDiscovery = void 0;
const theme_graph_1 = require("./theme-graph");
const theme_analyzer_1 = require("./theme-analyzer");
class DynamicThemeDiscovery {
    constructor(llmModel = 'llama2') {
        this.PRUNE_THRESHOLD = 30; // Days before pruning inactive themes
        this.themeGraph = new theme_graph_1.ThemeGraph();
        this.analyzer = new theme_analyzer_1.ThemeAnalyzer(llmModel);
    }
    async analyzeConversation(content, conversationId) {
        try {
            // Get LLM analysis of the conversation
            const analysis = await this.analyzer.analyzeConversation(content);
            // Update theme graph with new information
            this.updateThemeGraph(analysis, conversationId);
            // Look for emerging patterns
            return this.findEmergingPatterns();
        }
        catch (error) {
            console.error('Error in conversation analysis:', error);
            throw new Error('Failed to analyze conversation');
        }
    }
    updateThemeGraph(analysis, conversationId) {
        // Update each concept in the theme graph
        analysis.concepts.forEach(concept => {
            this.themeGraph.updateNode(concept.name, conversationId, concept.related);
        });
        // Add emerging patterns as potential themes
        analysis.patterns.emerging.forEach(pattern => {
            this.themeGraph.addNode(pattern);
        });
    }
    findEmergingPatterns() {
        // Get emerging themes
        const newThemes = this.themeGraph.getEmergingThemes();
        // Get theme connections
        const connections = this.themeGraph.findConnections();
        // Track theme evolution
        const evolvedThemes = new Map();
        newThemes.forEach(theme => {
            const themeDetails = this.themeGraph.getThemeDetails(theme);
            if (themeDetails && themeDetails.evolution.branches.size > 0) {
                // Get the latest branch
                const branches = Array.from(themeDetails.evolution.branches.entries());
                const latestBranch = branches[branches.length - 1];
                if (latestBranch) {
                    evolvedThemes.set(theme, latestBranch[1]);
                }
            }
        });
        return {
            newThemes,
            evolvedThemes,
            connections
        };
    }
    async batchAnalyzeConversations(conversations) {
        // Analyze all conversations
        const analysisResults = await this.analyzer.batchAnalyze(conversations);
        // Update theme graph with all results
        analysisResults.forEach((analysis, conversationId) => {
            this.updateThemeGraph(analysis, conversationId);
        });
        // Find patterns across all analyzed conversations
        return this.findEmergingPatterns();
    }
    findPatterns(timeRange) {
        return this.themeGraph.findPatterns(timeRange);
    }
    getThemeDetails(theme) {
        return this.themeGraph.getThemeDetails(theme);
    }
    getAllThemes() {
        return this.themeGraph.getAllThemes();
    }
    pruneInactiveThemes() {
        this.themeGraph.pruneInactiveThemes(this.PRUNE_THRESHOLD);
    }
    // Helper method to get a summary of the current state
    getDiscoveryStatus() {
        const allThemes = this.getAllThemes();
        const connections = this.themeGraph.findConnections();
        // Sort connections by number of related themes
        const sortedConnections = Array.from(connections.entries())
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 10); // Get top 10 most connected themes
        return {
            totalThemes: allThemes.length,
            activeThemes: this.themeGraph.getEmergingThemes(),
            topConnections: sortedConnections
        };
    }
}
exports.DynamicThemeDiscovery = DynamicThemeDiscovery;
//# sourceMappingURL=dynamic-theme-discovery.js.map