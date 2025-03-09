"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchAssistant = void 0;
const theme_graph_1 = require("./theme-graph");
const insight_generator_1 = require("./insight-generator");
class ResearchAssistant {
    constructor(llmProvider) {
        this.themeGraph = new theme_graph_1.ThemeGraph();
        this.insightGenerator = new insight_generator_1.ResearchInsightGenerator(llmProvider, this.themeGraph);
    }
    async analyzeConversation(conversation, conversationId) {
        // Extract themes and relationships from conversation
        const themes = await this.extractThemes(conversation);
        // Update theme graph
        themes.concepts.forEach(concept => {
            this.themeGraph.addNode(concept.name);
            this.themeGraph.updateNode(concept.name, conversationId, concept.related);
        });
        // Generate visualization data
        const visualization = this.themeGraph.createKnowledgeMap();
        // Generate insights
        const insights = await this.insightGenerator.generateInsights();
        // Generate suggestions for further exploration
        const suggestedExplorations = await this.insightGenerator.generateSuggestions();
        return {
            analysis: themes,
            visualization,
            insights,
            suggestedExplorations
        };
    }
    async extractThemes(content) {
        // This would typically use the LLM to extract themes
        // For now, return a simple analysis based on word frequency
        const words = content.toLowerCase().split(/\W+/);
        const wordFreq = new Map();
        words.forEach(word => {
            if (word.length > 3) { // Skip short words
                wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
            }
        });
        // Get top themes
        const sortedWords = Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        // Create simple relationships based on word proximity
        const concepts = sortedWords.map(([word, count]) => {
            const related = sortedWords
                .filter(([other]) => other !== word)
                .slice(0, 3)
                .map(([other]) => other);
            return {
                name: word,
                related,
                depth: Math.min(Math.ceil(Math.log2(count + 1)), 5)
            };
        });
        return {
            concepts,
            patterns: {
                recurring: sortedWords.slice(0, 3).map(([word]) => word),
                emerging: sortedWords.slice(3, 5).map(([word]) => word)
            }
        };
    }
    incorporateFeedback(feedback) {
        // Update theme weights based on accuracy feedback
        if (!feedback.themeAccuracy) {
            this.themeGraph.pruneInactiveThemes(7); // Remove themes inactive for 7 days
        }
        // Add missing connections
        feedback.missingConnections.forEach(connection => {
            const [source, target] = connection.split('-');
            if (source && target) {
                this.themeGraph.addNode(source);
                this.themeGraph.addNode(target);
                this.themeGraph.updateNode(source, 'feedback', [target]);
                this.themeGraph.updateNode(target, 'feedback', [source]);
            }
        });
    }
    getEmergingThemes() {
        return this.themeGraph.getEmergingThemes();
    }
    async getInsights() {
        return this.insightGenerator.generateInsights();
    }
    getVisualization() {
        return this.themeGraph.createKnowledgeMap();
    }
}
exports.ResearchAssistant = ResearchAssistant;
//# sourceMappingURL=research-assistant.js.map