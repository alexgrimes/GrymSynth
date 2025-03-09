"use strict";
/**
 * Core resource management type definitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceConstraintError = exports.ResourceExhaustionError = exports.ResourceError = exports.Priority = exports.ResourceType = void 0;
// Resource Types
var ResourceType;
(function (ResourceType) {
    ResourceType["Memory"] = "memory";
    ResourceType["CPU"] = "cpu";
    ResourceType["Storage"] = "storage";
})(ResourceType = exports.ResourceType || (exports.ResourceType = {}));
var Priority;
(function (Priority) {
    Priority[Priority["Low"] = 0] = "Low";
    Priority[Priority["Medium"] = 1] = "Medium";
    Priority[Priority["High"] = 2] = "High";
    Priority[Priority["Critical"] = 3] = "Critical";
})(Priority = exports.Priority || (exports.Priority = {}));
// Error Types
class ResourceError extends Error {
    constructor(message, code, resource) {
        super(message);
        this.code = code;
        this.resource = resource;
        this.name = 'ResourceError';
    }
}
exports.ResourceError = ResourceError;
class ResourceExhaustionError extends ResourceError {
    constructor(resource) {
        super('Resource allocation failed due to exhaustion', 'RESOURCE_EXHAUSTED', resource);
        this.name = 'ResourceExhaustionError';
    }
}
exports.ResourceExhaustionError = ResourceExhaustionError;
class ResourceConstraintError extends ResourceError {
    constructor(constraint, resource) {
        super(`Resource constraint violation: ${constraint}`, 'CONSTRAINT_VIOLATION', resource);
        this.name = 'ResourceConstraintError';
    }
}
exports.ResourceConstraintError = ResourceConstraintError;
//# sourceMappingURL=types.js.map