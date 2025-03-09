"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcePoolError = void 0;
class ResourcePoolError extends Error {
    constructor(message, code, resource) {
        super(message);
        this.code = code;
        this.resource = resource;
        this.name = 'ResourcePoolError';
    }
}
exports.ResourcePoolError = ResourcePoolError;
//# sourceMappingURL=types.js.map