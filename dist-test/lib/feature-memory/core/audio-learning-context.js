"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioLearningManager = void 0;
class AudioLearningManager {
    constructor(featureMemory) {
        this.featureMemory = featureMemory;
        this.context = this.initializeContext();
    }
    initializeContext() {
        return {
            patterns: [],
            knowledgeBase: {
                patterns: new Map(),
                relationshipGraph: new Map(),
                confidenceScores: new Map()
            },
            learningProgress: {
                totalPatternsLearned: 0,
                averageConfidence: 0,
                recognitionRate: 0,
                lastUpdated: new Date().toISOString()
            }
        };
    }
    async preserveContext(modelId) {
        const contextPattern = {
            id: `${modelId}:context`,
            features: new Map([
                ['type', 'learning_context'],
                ['modelId', modelId],
                ['context', JSON.stringify(this.context)]
            ]),
            confidence: 1,
            timestamp: new Date(),
            metadata: {
                source: 'audio_learning_manager',
                category: 'context',
                frequency: 1,
                lastUpdated: new Date()
            }
        };
        const result = await this.featureMemory.storePattern(contextPattern);
        this.updateLearningMetrics();
        return result;
    }
    async retrieveContext(modelId) {
        const searchCriteria = {
            metadata: {
                category: 'context',
                source: 'audio_learning_manager'
            },
            features: new Map([['type', 'learning_context'], ['modelId', modelId]])
        };
        const result = await this.featureMemory.searchPatterns(searchCriteria);
        if (result.data && result.data.length > 0) {
            const contextData = result.data[0].features.get('context');
            if (contextData) {
                this.context = JSON.parse(contextData);
            }
        }
        return this.context;
    }
    async accumulatePattern(fftData, metadata) {
        const pattern = {
            id: `pattern_${Date.now()}`,
            features: new Map([
                ['type', 'audio_pattern'],
                ['fftData', Array.from(fftData)]
            ]),
            confidence: 1,
            timestamp: new Date(),
            metadata: {
                ...metadata,
                category: 'audio_pattern',
                lastUpdated: new Date()
            }
        };
        const result = await this.featureMemory.storePattern(pattern);
        if (result.success) {
            this.context.knowledgeBase.patterns.set(pattern.id, pattern);
            this.context.knowledgeBase.confidenceScores.set(pattern.id, pattern.confidence);
            this.context.patterns.push(pattern);
            this.updateLearningMetrics();
        }
    }
    async recognizePattern(fftData) {
        const features = new Map([
            ['type', 'audio_pattern'],
            ['fftData', Array.from(fftData)]
        ]);
        const result = await this.featureMemory.recognizePattern(features);
        if (result.matches && result.matches.length > 0) {
            const matchedPattern = result.matches[0];
            const matchedAudioPattern = this.context.knowledgeBase.patterns.get(matchedPattern.id);
            if (matchedAudioPattern) {
                this.context.learningProgress.recognitionRate =
                    (this.context.learningProgress.recognitionRate + 1) / 2;
                return matchedAudioPattern;
            }
        }
        return null;
    }
    updateLearningMetrics() {
        const scores = Array.from(this.context.knowledgeBase.confidenceScores.values());
        this.context.learningProgress = {
            totalPatternsLearned: this.context.patterns.length,
            averageConfidence: scores.reduce((a, b) => a + b, 0) / scores.length || 0,
            recognitionRate: this.context.learningProgress.recognitionRate,
            lastUpdated: new Date().toISOString()
        };
    }
    getContext() {
        return this.context;
    }
    getLearningProgress() {
        return this.context.learningProgress;
    }
}
exports.AudioLearningManager = AudioLearningManager;
//# sourceMappingURL=audio-learning-context.js.map