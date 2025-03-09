"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ModelError = exports.PreprocessingError = exports.InsufficientDataError = void 0;
// Error types
class InsufficientDataError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InsufficientDataError';
    }
}
exports.InsufficientDataError = InsufficientDataError;
class PreprocessingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PreprocessingError';
    }
}
exports.PreprocessingError = PreprocessingError;
class ModelError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ModelError';
    }
}
exports.ModelError = ModelError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=types.js.map