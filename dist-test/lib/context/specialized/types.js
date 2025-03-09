"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextEvent = exports.ContextError = void 0;
/**
 * Error types specific to specialized context management
 */
var ContextError;
(function (ContextError) {
    ContextError["ROUTING_FAILED"] = "ROUTING_FAILED";
    ContextError["CONTEXT_PREPARATION_FAILED"] = "CONTEXT_PREPARATION_FAILED";
    ContextError["SUMMARIZATION_FAILED"] = "SUMMARIZATION_FAILED";
    ContextError["STORAGE_ERROR"] = "STORAGE_ERROR";
    ContextError["INVALID_MODEL"] = "INVALID_MODEL";
})(ContextError = exports.ContextError || (exports.ContextError = {}));
/**
 * Events emitted by the specialized context manager
 */
var ContextEvent;
(function (ContextEvent) {
    ContextEvent["MODEL_SWITCHED"] = "MODEL_SWITCHED";
    ContextEvent["CONTEXT_UPDATED"] = "CONTEXT_UPDATED";
    ContextEvent["THEMES_CHANGED"] = "THEMES_CHANGED";
    ContextEvent["ERROR_OCCURRED"] = "ERROR_OCCURRED";
})(ContextEvent = exports.ContextEvent || (exports.ContextEvent = {}));
//# sourceMappingURL=types.js.map