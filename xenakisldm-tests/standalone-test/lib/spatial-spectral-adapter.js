/**
 * Adapter to connect pattern analysis infrastructure with spatial-spectral transformations
 */
const {
    PatternLearningSystem,
    PatternRecognizer,
    CrossPatternAnalyzer,
    IntegratedPatternAnalyzer
} = require('../mocks/pattern-analysis-mock');

const SpectralPatternStore = require('./spectral-pattern-store');

class SpatialSpectralAdapter {
    constructor(config = {}) {
        this.config = {
            G: 9.81e-3,             // Gravitational constant
            minFreq: 20,            // Minimum frequency (Hz)
            maxFreq: 20000,         // Maximum frequency (Hz)
            resolution: 2048,        // FFT size
            patternThreshold: 0.3,   // Minimum pattern significance
            relationshipThreshold: 0.4, // Minimum relationship strength
            ...config
        };

        // Initialize pattern analysis components using mocks for testing
        this.patternSystem = new PatternLearningSystem();
        this.recognizer = new PatternRecognizer();
        this.crossAnalyzer = new CrossPatternAnalyzer();
        this.integratedAnalyzer = new IntegratedPatternAnalyzer();

        // Initialize pattern store
        this.store = new SpectralPatternStore();
    }

    /**
     * Convert pattern analysis results to spatial-spectral parameters
     */
    async analyzeAndMap(audioBuffer) {
        console.log('Analyzing audio patterns...');

        // Clear previous analysis
        this.store.clear();

        // Get pattern analysis from mocked infrastructure
        const patterns = await this.patternSystem.analyzeAudio(audioBuffer);
        console.log('Detected patterns:', patterns.length);

        const relationships = await this.crossAnalyzer.analyzePatterns(patterns);
        console.log('Pattern relationships:', relationships.length);

        const integrated = await this.integratedAnalyzer.analyze(patterns, relationships);
        console.log('Integrated analysis:', integrated);

        // Store analysis results
        this.store.storePatterns(patterns);
        this.store.storeRelationships(relationships);
        this.store.storeGlobalParams(integrated);

        // Map patterns to gravitational fields
        return this._createSpectralFields();
    }

    /**
     * Convert pattern analysis results to spatial-spectral parameters
     */
    _createSpectralFields() {
        const fields = [];
        const patterns = this.store.getAllPatterns();
        const relationships = this.store.getAllRelationships();

        // Convert significant patterns to gravitational fields
        patterns.forEach(pattern => {
            if (pattern.significance > this.config.patternThreshold) {
                const field = this._patternToField(pattern);
                fields.push(field);
            }
        });

        // Add relationship-based fields
        relationships.forEach(rel => {
            if (rel.strength > this.config.relationshipThreshold) {
                const field = this._relationshipToField(rel);
                fields.push(field);
            }
        });

        console.log('Created spectral fields:', fields.length);
        return {
            fields,
            globalParams: this.store.getGlobalParams()
        };
    }

    /**
     * Convert a single pattern to a gravitational field
     */
    _patternToField(pattern) {
        // Calculate field parameters based on pattern characteristics
        const strength = pattern.significance *
                        pattern.consistency *
                        pattern.clarity;

        // Find related patterns
        const relatedPatterns = this.store.getAllRelationships()
            .filter(rel => rel.source === pattern.id || rel.target === pattern.id)
            .map(rel => {
                const relatedId = rel.target === pattern.id ? rel.source : rel.target;
                const relatedPattern = this.store.getPattern(relatedId);
                return {
                    frequency: relatedPattern.frequency,
                    strength: rel.strength
                };
            });

        return {
            type: 'pattern',
            center: pattern.frequency,
            bandwidth: pattern.bandwidth,
            strength: strength,
            modulation: pattern.temporalEvolution,
            relationships: relatedPatterns
        };
    }

    /**
     * Convert a pattern relationship to a gravitational field
     */
    _relationshipToField(relationship) {
        const sourcePattern = this.store.getPattern(relationship.source);
        const targetPattern = this.store.getPattern(relationship.target);

        return {
            type: 'relationship',
            sourceFreq: sourcePattern.frequency,
            targetFreq: targetPattern.frequency,
            strength: relationship.strength,
            bandwidth: Math.abs(targetPattern.frequency - sourcePattern.frequency) / 2,
            correlation: relationship.correlation
        };
    }

    /**
     * Calculate gravitational effect at a specific frequency
     */
    calculateFieldEffect(frequency, fields) {
        let totalEffect = 0;

        fields.forEach(field => {
            if (field.type === 'pattern') {
                totalEffect += this._calculatePatternFieldEffect(frequency, field);
            } else if (field.type === 'relationship') {
                totalEffect += this._calculateRelationshipFieldEffect(frequency, field);
            }
        });

        return totalEffect;
    }

    /**
     * Calculate gravitational effect from a pattern-based field
     */
    _calculatePatternFieldEffect(frequency, field) {
        const distance = Math.abs(frequency - field.center);
        if (distance < 1e-6) return field.strength; // Avoid division by zero

        // Calculate base gravitational effect
        let effect = (this.config.G * field.strength) / (distance * distance);

        // Apply bandwidth-based falloff
        effect *= Math.exp(-Math.pow(distance / field.bandwidth, 2));

        // Apply modulation
        if (field.modulation) {
            effect *= (1 + field.modulation * Math.sin(2 * Math.PI * distance / field.bandwidth));
        }

        return effect;
    }

    /**
     * Calculate gravitational effect from a relationship-based field
     */
    _calculateRelationshipFieldEffect(frequency, field) {
        const centerFreq = (field.sourceFreq + field.targetFreq) / 2;
        const distance = Math.abs(frequency - centerFreq);
        if (distance < 1e-6) return field.strength;

        // Calculate effect based on relationship strength and correlation
        let effect = (this.config.G * field.strength * field.correlation) /
                    (distance * distance);

        // Apply bandwidth-based modulation
        effect *= Math.exp(-Math.pow(distance / field.bandwidth, 2));

        return effect;
    }
}

module.exports = SpatialSpectralAdapter;
