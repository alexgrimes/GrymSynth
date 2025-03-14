"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportanceScorer = void 0;
class ImportanceScorer {
    constructor(config) {
        this.weights = config.weights;
        this.llmService = config.llmService;
        this.themeDetector = config.themeDetector;
    }
    async calculateImportance(messages, currentContext) {
        return Promise.all(messages.map(async (message, index) => {
            const scores = await this.calculateScores(message, index, messages.length, currentContext);
            return {
                scores,
                finalScore: this.calculateFinalScore(scores)
            };
        }));
    }
    async calculateScores(message, index, total, currentContext) {
        return {
            recency: this.calculateRecencyScore(index, total),
            relevance: await this.calculateRelevanceScore(message, currentContext),
            interaction: this.calculateInteractionScore(message),
            complexity: this.calculateComplexityScore(message),
            theme: await this.calculateThemeScore(message),
            keyTerms: this.calculateKeyTermsScore(message)
        };
    }
    calculateRecencyScore(index, total) {
        // Exponential decay for older messages
        return Math.exp(-(total - index - 1) / total);
    }
    async calculateRelevanceScore(message, currentContext) {
        if (!this.llmService) {
            return 0.5; // Default score if LLM service is not available
        }
        try {
            // Use LLM service for semantic similarity analysis
            const similarity = await this.llmService.calculateSimilarity(message.content, currentContext);
            return Math.min(Math.max(similarity, 0), 1); // Ensure score is between 0 and 1
        }
        catch (error) {
            console.error('Error calculating relevance score:', error);
            return 0.5; // Fallback score on error
        }
    }
    calculateInteractionScore(message) {
        let score = 0;
        // Response presence (+0.3)
        if (message.hasResponse) {
            score += 0.3;
        }
        // Active discussion participation (+0.4)
        if (message.participantCount && message.participantCount > 1) {
            score += Math.min((message.participantCount - 1) * 0.1, 0.4);
        }
        // Reference count (up to +0.3)
        if (message.references?.length) {
            score += Math.min(message.references.length * 0.1, 0.3);
        }
        return Math.min(score, 1); // Cap at 1.0
    }
    calculateComplexityScore(message) {
        let score = 0;
        // Content length (0-0.2)
        const lengthScore = Math.min(message.content.length / 1000, 0.2);
        score += lengthScore;
        // Code block presence (0-0.2)
        const hasCodeBlock = /\`\`\`[\s\S]*?\`\`\`/.test(message.content);
        if (hasCodeBlock) {
            score += 0.2;
        }
        // Technical term density (0-0.2)
        const technicalTerms = this.countTechnicalTerms(message.content);
        const termDensity = Math.min(technicalTerms / 10, 0.2);
        score += termDensity;
        // Structural complexity (0-0.2)
        const structuralScore = this.calculateStructuralComplexity(message.content);
        score += structuralScore;
        // Conceptual density (0-0.2)
        const conceptualScore = this.calculateConceptualDensity(message.content);
        score += conceptualScore;
        return Math.min(score, 1); // Cap at 1.0
    }
    async calculateThemeScore(message) {
        if (!this.themeDetector) {
            return 0.5; // Default score if theme detector is not available
        }
        try {
            // Use theme detector service to evaluate alignment
            const themeAlignment = await this.themeDetector.analyzeThemeAlignment(message.content);
            return Math.min(Math.max(themeAlignment, 0), 1);
        }
        catch (error) {
            console.error('Error calculating theme score:', error);
            return 0.5; // Fallback score on error
        }
    }
    calculateKeyTermsScore(message) {
        const terms = this.extractKeyTerms(message.content);
        const normalizedScore = Math.min(terms.length / 10, 1);
        return normalizedScore;
    }
    calculateFinalScore(scores) {
        return Object.entries(scores)
            .reduce((total, [key, score]) => total + score * this.weights[key], 0);
    }
    // Helper methods for complexity scoring
    countTechnicalTerms(content) {
        // Simple technical term detection - could be enhanced with a comprehensive dictionary
        const technicalTerms = [
            'api', 'function', 'class', 'interface', 'async', 'await',
            'promise', 'component', 'service', 'database', 'algorithm'
        ];
        const words = content.toLowerCase().split(/\W+/);
        return words.filter(word => technicalTerms.includes(word)).length;
    }
    calculateStructuralComplexity(content) {
        // Analyze structural elements like lists, headings, code blocks
        const structuralElements = [
            content.match(/#{1,6}\s/g)?.length || 0,
            content.match(/[\*\-\+]\s/g)?.length || 0,
            content.match(/\`\`\`[\s\S]*?\`\`\`/g)?.length || 0,
            content.match(/\[.*?\]\(.*?\)/g)?.length || 0 // Links
        ];
        const totalElements = structuralElements.reduce((sum, count) => sum + count, 0);
        return Math.min(totalElements * 0.05, 0.2); // Scale and cap at 0.2
    }
    calculateConceptualDensity(content) {
        // Analyze sentence complexity and concept relationships
        const sentences = content.split(/[.!?]+/);
        const avgWordsPerSentence = sentences
            .map(s => s.trim().split(/\s+/).length)
            .reduce((sum, count) => sum + count, 0) / sentences.length;
        return Math.min(avgWordsPerSentence / 50, 0.2); // Scale and cap at 0.2
    }
    extractKeyTerms(content) {
        // Extract domain-specific terminology
        // This is a simplified implementation - could be enhanced with NLP
        const words = content.toLowerCase().split(/\W+/);
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to']);
        return words.filter(word => word.length > 3 && // Filter out short words
            !commonWords.has(word) && // Filter out common words
            /^[a-z]+$/.test(word) // Only include pure words
        );
    }
}
exports.ImportanceScorer = ImportanceScorer;
//# sourceMappingURL=importance-scorer.js.map