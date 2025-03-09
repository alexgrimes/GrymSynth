/**
 * Manages pattern data and relationships for spatial-spectral transformations
 */
class SpectralPatternStore {
    constructor() {
        this.patterns = new Map();
        this.relationships = new Map();
        this.globalParams = {};
    }

    storePatterns(patterns) {
        patterns.forEach(pattern => {
            this.patterns.set(pattern.id, pattern);
        });
    }

    storeRelationships(relationships) {
        relationships.forEach(rel => {
            const key = `${rel.source}-${rel.target}`;
            this.relationships.set(key, rel);
        });
    }

    storeGlobalParams(params) {
        this.globalParams = { ...params };
    }

    getPattern(id) {
        return this.patterns.get(id);
    }

    getRelationship(sourceId, targetId) {
        return this.relationships.get(`${sourceId}-${targetId}`);
    }

    getAllPatterns() {
        return Array.from(this.patterns.values());
    }

    getAllRelationships() {
        return Array.from(this.relationships.values());
    }

    getGlobalParams() {
        return { ...this.globalParams };
    }

    clear() {
        this.patterns.clear();
        this.relationships.clear();
        this.globalParams = {};
    }
}

module.exports = SpectralPatternStore;
