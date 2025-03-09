"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTestResult = exports.createDefaultTestConfig = void 0;
function createDefaultTestConfig() {
    return {
        timeout: 5000,
        retries: 0,
        parallel: false,
        bail: false
    };
}
exports.createDefaultTestConfig = createDefaultTestConfig;
function isTestResult(result) {
    if (!result || typeof result !== 'object')
        return false;
    const r = result;
    return (typeof r.name === 'string' &&
        typeof r.success === 'boolean' &&
        typeof r.duration === 'number' &&
        (!r.error || r.error instanceof Error) &&
        (r.skipped === undefined || typeof r.skipped === 'boolean') &&
        r.health !== undefined);
}
exports.isTestResult = isTestResult;
//# sourceMappingURL=test.js.map