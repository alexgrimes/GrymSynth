import { v4 as uuidv4 } from "uuid";

export class MockPythonBridge {
  async executeWav2Vec2(
    operation: string,
    audioData: Buffer | string
  ): Promise<any> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const requestId = uuidv4();

    // Return mock results based on operation
    if (operation === "process") {
      return {
        transcription: "mock transcription",
        confidence: 0.95,
        request_id: requestId,
      };
    } else if (operation === "analyze") {
      return {
        features: Array(20)
          .fill(0)
          .map(() => Math.random()),
        feature_count: 20,
        request_id: requestId,
      };
    }

    // Simulate an error for unknown operations
    throw new Error(`Unsupported operation: ${operation}`);
  }
}

// Jest setup to mock PythonBridge with MockPythonBridge
jest.mock("../../src/utils/pythonBridge", () => {
  return {
    PythonBridge: jest.fn().mockImplementation(() => {
      return new MockPythonBridge();
    }),
  };
});
