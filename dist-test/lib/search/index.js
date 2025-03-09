"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndex = void 0;
const storage_1 = require("../storage");
const natural_1 = __importDefault(require("natural"));
class SearchIndex {
    constructor() {
        this.index = new Map();
        this.stemmer = natural_1.default.PorterStemmer;
        this.fuseOptions = {
            includeScore: true,
            threshold: 0.3,
            keys: ['term']
        };
    }
    async buildIndex() {
        const resources = await storage_1.storage.getAllResources();
        resources.forEach(resource => {
            this.indexResource(resource);
        });
    }
    indexResource(resource) {
        const terms = this.extractSearchTerms(resource);
        terms.forEach(term => {
            if (!this.index.has(term)) {
                this.index.set(term, new Set());
            }
            this.index.get(term)?.add(resource.id);
        });
    }
    extractSearchTerms(resource) {
        const terms = new Set();
        // Index title words
        resource.title.toLowerCase().split(/\W+/).forEach(term => terms.add(term));
        // Index category and type
        terms.add(resource.category);
        terms.add(resource.type);
        // Index topics
        resource.metadata.topics.forEach(topic => terms.add(topic.toLowerCase()));
        return Array.from(terms);
    }
    search(query) {
        const searchTerms = query.toLowerCase().split(/\W+/);
        const results = new Map();
        searchTerms.forEach(term => {
            this.index.forEach((resourceIds, indexTerm) => {
                if (indexTerm.includes(term)) {
                    resourceIds.forEach(id => {
                        results.set(id, (results.get(id) || 0) + 1);
                    });
                }
            });
        });
        return Array.from(results.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id);
    }
}
exports.SearchIndex = SearchIndex;
//# sourceMappingURL=index.js.map