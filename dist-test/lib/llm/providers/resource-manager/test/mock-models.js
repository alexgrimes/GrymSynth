"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockModelProvider = void 0;
const test_helpers_1 = require("./test-helpers");
exports.mockModelProvider = {
    loadModel: jest.fn().mockResolvedValue(true),
    unloadModel: jest.fn().mockResolvedValue(true),
    getContext: jest.fn().mockImplementation((modelId) => {
        return (0, test_helpers_1.createTestContext)(100);
    }),
    setContext: jest.fn().mockResolvedValue(true),
    generateResponse: jest.fn().mockImplementation((input) => {
        return Promise.resolve({
            response: 'Mocked response for: ' + input,
            usage: {
                promptTokens: input.length,
                completionTokens: 20,
                totalTokens: input.length + 20
            }
        });
    })
};
//# sourceMappingURL=mock-models.js.map