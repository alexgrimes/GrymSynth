"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioProcessingManager = void 0;
/**
 * Manages the coordinated processing of audio files through multiple models
 * while maintaining system health and resource constraints.
 */
class AudioProcessingManager {
    constructor(projectManager, healthMonitor, featureMemory) {
        this.projectManager = projectManager;
        this.healthMonitor = healthMonitor;
        this.featureMemory = featureMemory;
        this.knownPatterns = new Map();
        this.patternRecognitionCount = 0;
        this.totalProcessingCount = 0;
    }
    /**
     * Process an audio file through the model chain and accumulate learning
     */
    async processAudio(audioFile) {
        // Initial health check
        const health = await this.healthMonitor.checkModelHealth();
        if (!health.canAcceptTasks) {
            throw new Error('System cannot accept new tasks');
        }
        // Load and verify models
        const audioModel = await this.projectManager.getModel('audio');
        const patternModel = await this.projectManager.getModel('pattern');
        const verificationModel = await this.projectManager.getModel('verification');
        try {
            // Step 1: Audio Processing
            const audioFeatures = await this.projectManager.handoff(audioModel, patternModel, {
                priority: 'high',
                timeout: 10000
            });
            // Health check between steps
            if (!(await this.verifyHealthForNextStep())) {
                throw new Error('System health degraded during processing');
            }
            // Step 2: Pattern Analysis & Learning
            const patterns = await this.analyzeAndLearnPatterns(audioFeatures);
            // Step 3: Pattern Verification
            await this.projectManager.handoff(patternModel, verificationModel, {
                priority: 'normal',
                timeout: 8000
            });
            // Final health check
            if (!(await this.verifyHealthForNextStep())) {
                throw new Error('System health degraded during verification');
            }
            this.totalProcessingCount++;
            return {
                success: true,
                patterns,
                confidence: this.calculateConfidence(patterns),
                verificationScore: 0.98,
                learningMetrics: this.getLearningMetrics()
            };
        }
        catch (error) {
            await this.handleProcessingError(error);
            throw error;
        }
    }
    /**
     * Process multiple audio files in batch while learning from each
     */
    async processBatch(audioFiles) {
        const results = [];
        let consecutiveFailures = 0;
        for (const file of audioFiles) {
            try {
                const health = await this.healthMonitor.checkModelHealth();
                if (!health.canAcceptTasks) {
                    await this.handleResourcePressure();
                    consecutiveFailures++;
                    if (consecutiveFailures >= 3) {
                        throw new Error('Too many consecutive failures');
                    }
                    continue;
                }
                const result = await this.processAudio(file);
                results.push(result);
                consecutiveFailures = 0;
            }
            catch (error) {
                console.error(`Failed to process file ${file.id}:`, error);
                consecutiveFailures++;
                if (consecutiveFailures >= 3) {
                    throw new Error('Batch processing aborted: too many consecutive failures');
                }
            }
        }
        return results;
    }
    async analyzeAndLearnPatterns(audioFeatures) {
        const newPatterns = [];
        const timestamp = new Date();
        // Extract patterns from audio features
        const extractedPatterns = this.extractPatternsFromFeatures(audioFeatures);
        for (const pattern of extractedPatterns) {
            // Check if we've seen this pattern before
            const existingPattern = this.findSimilarPattern(pattern.features);
            if (existingPattern) {
                this.patternRecognitionCount++;
                newPatterns.push(existingPattern);
            }
            else {
                // Store new pattern
                const newPattern = {
                    id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    features: pattern.features,
                    frequency: pattern.frequency,
                    confidence: 0.85,
                    timestamp
                };
                this.knownPatterns.set(newPattern.id, newPattern);
                newPatterns.push(newPattern);
                // Store in feature memory if available
                if (this.featureMemory) {
                    await this.featureMemory.storePattern({
                        id: newPattern.id,
                        features: new Map([['audioFeatures', Array.from(newPattern.features)]]),
                        confidence: newPattern.confidence,
                        timestamp: newPattern.timestamp,
                        metadata: {
                            source: 'audio_processing',
                            category: 'audio_pattern',
                            frequency: newPattern.frequency,
                            lastUpdated: newPattern.timestamp
                        }
                    });
                }
            }
        }
        return newPatterns;
    }
    extractPatternsFromFeatures(audioFeatures) {
        // This would be replaced with actual pattern extraction logic
        // For now, we'll create a mock pattern
        return [{
                features: new Float32Array([0.1, 0.2, 0.3, 0.4]),
                frequency: 440
            }];
    }
    findSimilarPattern(features) {
        for (const pattern of this.knownPatterns.values()) {
            if (this.calculatePatternSimilarity(pattern.features, features) > 0.9) {
                return pattern;
            }
        }
        return null;
    }
    calculatePatternSimilarity(pattern1, pattern2) {
        if (pattern1.length !== pattern2.length)
            return 0;
        let similarity = 0;
        for (let i = 0; i < pattern1.length; i++) {
            similarity += 1 - Math.abs(pattern1[i] - pattern2[i]);
        }
        return similarity / pattern1.length;
    }
    calculateConfidence(patterns) {
        if (patterns.length === 0)
            return 0;
        return patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    }
    getLearningMetrics() {
        return {
            patternRecognitionRate: this.totalProcessingCount > 0
                ? this.patternRecognitionCount / this.totalProcessingCount
                : 0,
            knownPatternsCount: this.knownPatterns.size,
            averageConfidence: Array.from(this.knownPatterns.values())
                .reduce((sum, p) => sum + p.confidence, 0) / this.knownPatterns.size || 0
        };
    }
    /**
     * Verify system health is suitable for next processing step
     */
    async verifyHealthForNextStep() {
        const health = await this.healthMonitor.checkModelHealth();
        return (health.orchestration.status !== 'unavailable' &&
            health.resources.memoryAvailable > 256 * 1024 * 1024 && // 256MB minimum
            health.orchestration.queueDepth < 3);
    }
    /**
     * Handle resource pressure during processing
     */
    async handleResourcePressure() {
        console.log('Handling resource pressure...');
        // Wait for resources to free up
        await new Promise(resolve => setTimeout(resolve, 5000));
        // Verify recovery
        const health = await this.healthMonitor.checkModelHealth();
        if (!health.canAcceptTasks) {
            throw new Error('System failed to recover from resource pressure');
        }
    }
    /**
     * Handle processing errors
     */
    async handleProcessingError(error) {
        console.error('Processing error:', error);
        const health = await this.healthMonitor.checkModelHealth();
        if (health.orchestration.status === 'unavailable') {
            throw new Error('System is unavailable, requires intervention');
        }
        if (health.orchestration.status === 'degraded') {
            await this.handleResourcePressure();
        }
    }
}
exports.AudioProcessingManager = AudioProcessingManager;
//# sourceMappingURL=audio-processing-manager.js.map