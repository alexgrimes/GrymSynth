"use strict";
/**
 * Core types for the model orchestration system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelOrchestratorError = void 0;
class ModelOrchestratorError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ModelOrchestratorError';
    }
}
exports.ModelOrchestratorError = ModelOrchestratorError;
//# sourceMappingURL=types.js.map