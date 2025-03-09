"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridImportanceScorer = void 0;
const importance_scorer_1 = require("./importance-scorer");
class HybridImportanceScorer extends importance_scorer_1.ImportanceScorer {
    constructor(config) {
        super(config);
        this.mlModel = config.mlModel;
        this.learningProfile = config.learningProfile;
        this.initialMLWeight = config.initialMLWeight ?? 0.3;
        this.adaptationRate = config.adaptationRate ?? 0.1;
        this.minConfidence = config.minConfidence ?? 0.4;
        this.currentMLWeight = this.initialMLWeight;
    }
    async calculateImportance(messages, currentContext) {
        const baseScores = await super.calculateImportance(messages, currentContext);
        return Promise.all(baseScores.map(async (score, index) => {
            const message = messages[index];
            const mlScore = await this.calculateMLScore(message);
            const confidence = await this.mlModel.getConfidence();
            const weight = await this.calculateAdaptiveWeight(confidence);
            // Combine base score with ML score
            const finalScore = this.combineScores(score.finalScore, mlScore, weight);
            return {
                ...score,
                mlScore,
                confidence,
                finalScore
            };
        }));
    }
    async calculateMLScore(message) {
        const features = await this.extractFeatures(message);
        return this.mlModel.predict(features);
    }
    async extractFeatures(message) {
        const metrics = await this.collectMetrics(message);
        return [
            // User interaction features
            metrics.userActions.messageViews / 100,
            metrics.userActions.timeSpent / 60,
            metrics.userActions.references,
            metrics.userActions.reactions,
            // Contextual features
            metrics.contextualMetrics.followupRate,
            metrics.contextualMetrics.influenceScore,
            metrics.contextualMetrics.themeAlignment
        ];
    }
    async collectMetrics(message) {
        // Default metrics if actual data is not available
        return {
            userActions: {
                messageViews: message.references?.length ?? 0,
                timeSpent: 0,
                references: message.references?.length ?? 0,
                reactions: 0
            },
            contextualMetrics: {
                followupRate: message.hasResponse ? 1 : 0,
                influenceScore: message.participantCount ? Math.min(message.participantCount / 5, 1) : 0,
                themeAlignment: 0.5 // Default alignment
            }
        };
    }
    async calculateAdaptiveWeight(confidence) {
        if (confidence < this.minConfidence) {
            return Math.max(this.currentMLWeight - this.adaptationRate, 0.1);
        }
        const metrics = await this.learningProfile.getPerformanceMetrics();
        const targetWeight = Math.min(this.initialMLWeight + (metrics.accuracy * this.adaptationRate), 0.9);
        // Gradually adjust weight
        this.currentMLWeight = this.currentMLWeight +
            (targetWeight - this.currentMLWeight) * this.adaptationRate;
        return this.currentMLWeight;
    }
    combineScores(userScore, mlScore, weight) {
        return (userScore * (1 - weight)) + (mlScore * weight);
    }
    async provideFeedback(feedback) {
        const message = await this.getMessage(feedback.messageId);
        if (!message)
            return;
        const features = await this.extractFeatures(message);
        await this.learningProfile.updateFromFeedback({
            prediction: await this.calculateMLScore(message),
            actual: feedback.actualImportance,
            features
        });
        await this.mlModel.update({
            features,
            label: feedback.actualImportance,
            learningRate: (await this.learningProfile.getPerformanceMetrics()).learningRate
        });
    }
    async getMessage(messageId) {
        // Implementation would depend on your message storage system
        // This is a placeholder that should be replaced with actual message retrieval
        return null;
    }
}
exports.HybridImportanceScorer = HybridImportanceScorer;
//# sourceMappingURL=hybrid-importance-scorer.js.map