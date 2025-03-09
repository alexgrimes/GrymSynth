"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hybrid_importance_scorer_1 = require("./hybrid-importance-scorer");
// Mock MLModel implementation
class MockMLModel {
    constructor() {
        this.confidence = 0.8;
        this.predictions = new Map();
    }
    async predict(features) {
        return 0.7; // Default prediction
    }
    async update(params) {
        // Simulate model update
    }
    async getConfidence() {
        return this.confidence;
    }
    setConfidence(value) {
        this.confidence = value;
    }
}
// Mock LearningProfile implementation
class MockLearningProfile {
    constructor() {
        this.accuracy = 0.85;
        this.learningRate = 0.1;
    }
    async updateFromFeedback(feedback) {
        // Simulate learning update
    }
    async getPerformanceMetrics() {
        return {
            accuracy: this.accuracy,
            confidence: 0.8,
            learningRate: this.learningRate
        };
    }
}
describe('HybridImportanceScorer', () => {
    const mockMessage = {
        id: 'test-1',
        content: 'Test message content',
        timestamp: new Date(),
        references: ['ref-1', 'ref-2'],
        hasResponse: true,
        participantCount: 3
    };
    const defaultConfig = {
        weights: {
            recency: 0.2,
            relevance: 0.2,
            interaction: 0.2,
            complexity: 0.1,
            theme: 0.2,
            keyTerms: 0.1
        },
        mlModel: new MockMLModel(),
        learningProfile: new MockLearningProfile(),
        initialMLWeight: 0.3,
        adaptationRate: 0.1,
        minConfidence: 0.4
    };
    it('should calculate hybrid importance score', async () => {
        const scorer = new hybrid_importance_scorer_1.HybridImportanceScorer(defaultConfig);
        const scores = await scorer.calculateImportance([mockMessage], 'test context');
        expect(scores).toHaveLength(1);
        expect(scores[0].mlScore).toBeDefined();
        expect(scores[0].confidence).toBeDefined();
        expect(scores[0].finalScore).toBeGreaterThanOrEqual(0);
        expect(scores[0].finalScore).toBeLessThanOrEqual(1);
    });
    it('should adapt weights based on confidence', async () => {
        const mlModel = new MockMLModel();
        const scorer = new hybrid_importance_scorer_1.HybridImportanceScorer({
            ...defaultConfig,
            mlModel
        });
        // Test with high confidence
        mlModel.setConfidence(0.9);
        let scores = await scorer.calculateImportance([mockMessage], 'test context');
        const highConfidenceWeight = scores[0].mlScore;
        // Test with low confidence
        mlModel.setConfidence(0.3);
        scores = await scorer.calculateImportance([mockMessage], 'test context');
        const lowConfidenceWeight = scores[0].mlScore;
        expect(highConfidenceWeight).toBeGreaterThan(lowConfidenceWeight);
    });
    it('should handle feedback and update model', async () => {
        const scorer = new hybrid_importance_scorer_1.HybridImportanceScorer(defaultConfig);
        const feedback = {
            messageId: mockMessage.id,
            userScore: 0.8,
            actualImportance: 0.9
        };
        await expect(scorer.provideFeedback(feedback)).resolves.not.toThrow();
    });
    it('should maintain base scoring functionality', async () => {
        const scorer = new hybrid_importance_scorer_1.HybridImportanceScorer(defaultConfig);
        const scores = await scorer.calculateImportance([mockMessage], 'test context');
        // Check that base scores are still calculated
        expect(scores[0].scores.recency).toBeDefined();
        expect(scores[0].scores.relevance).toBeDefined();
        expect(scores[0].scores.interaction).toBeDefined();
        expect(scores[0].scores.complexity).toBeDefined();
        expect(scores[0].scores.theme).toBeDefined();
        expect(scores[0].scores.keyTerms).toBeDefined();
    });
    it('should respect minimum confidence threshold', async () => {
        const mlModel = new MockMLModel();
        const scorer = new hybrid_importance_scorer_1.HybridImportanceScorer({
            ...defaultConfig,
            mlModel,
            minConfidence: 0.6
        });
        mlModel.setConfidence(0.5); // Below threshold
        const scores = await scorer.calculateImportance([mockMessage], 'test context');
        // Expect ML influence to be reduced
        expect(scores[0].confidence).toBeLessThan(0.6);
    });
    it('should handle missing message data gracefully', async () => {
        const incompleteMessage = {
            id: 'test-2',
            content: 'Incomplete message',
            timestamp: new Date()
        };
        const scorer = new hybrid_importance_scorer_1.HybridImportanceScorer(defaultConfig);
        const scores = await scorer.calculateImportance([incompleteMessage], 'test context');
        expect(scores).toHaveLength(1);
        expect(scores[0].finalScore).toBeDefined();
        expect(scores[0].mlScore).toBeDefined();
    });
});
//# sourceMappingURL=test-hybrid-importance-scorer.js.map