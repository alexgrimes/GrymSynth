import { createLearningSystem } from "../";
import { HealthMonitor } from "../../monitoring/HealthMonitor";
import { AudioPattern, PatternContext } from "../../../types/audio";
import { TEST_LEARNING_CONFIG } from "../config";

describe("Learning System Integration", () => {
  let healthMonitor: HealthMonitor;

  beforeEach(() => {
    healthMonitor = new HealthMonitor();
  });

  it("should initialize successfully", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );
    expect(system.learningService).toBeDefined();
    expect(system.relationshipTracker).toBeDefined();
    expect(system.memorySystem).toBeDefined();
    expect(system.repository).toBeDefined();
    expect(system.vectorDb).toBeDefined();
  });

  it("should store and retrieve patterns", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    const pattern: AudioPattern = {
      id: "test-pattern-1",
      type: "test",
      startTime: 0,
      endTime: 1,
      frequencyRange: { low: 100, high: 1000 },
      confidence: 0.8,
      features: Array(128)
        .fill(0)
        .map(() => Math.random()),
    };

    const context: PatternContext = {
      sourceId: "test-source",
      sessionId: "test-session",
      userId: "test-user",
      tags: ["test"],
      timestamp: new Date(),
    };

    // Add pattern to memory
    await system.memorySystem.addToMemory(pattern, context);

    // Retrieve pattern
    const retrieved = await system.memorySystem.accessPattern(pattern.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(pattern.id);
  });

  it("should discover relationships between similar patterns", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    // Create two similar patterns
    const baseFeatures = Array(128)
      .fill(0)
      .map(() => Math.random());
    const similarFeatures = baseFeatures.map((f) => f + Math.random() * 0.1);

    const pattern1: AudioPattern = {
      id: "test-pattern-1",
      type: "test",
      startTime: 0,
      endTime: 1,
      frequencyRange: { low: 100, high: 1000 },
      confidence: 0.8,
      features: baseFeatures,
    };

    const pattern2: AudioPattern = {
      id: "test-pattern-2",
      type: "test",
      startTime: 1.1,
      endTime: 2.1,
      frequencyRange: { low: 100, high: 1000 },
      confidence: 0.8,
      features: similarFeatures,
    };

    // Add patterns to memory
    await system.memorySystem.addToMemory(pattern1);
    await system.memorySystem.addToMemory(pattern2);

    // Discover relationships
    const relationships =
      await system.relationshipTracker.discoverRelationships(pattern1.id);
    expect(relationships.length).toBeGreaterThan(0);
    expect(relationships[0].targetPatternId).toBe(pattern2.id);
  });

  it("should maintain active memory within limits", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    // Create more patterns than the maximum allowed
    const patterns = Array(TEST_LEARNING_CONFIG.memory.maxActivePatterns + 10)
      .fill(0)
      .map((_, i) => ({
        id: `test-pattern-${i}`,
        type: "test",
        startTime: i,
        endTime: i + 1,
        frequencyRange: { low: 100, high: 1000 },
        confidence: 0.8,
        features: Array(128)
          .fill(0)
          .map(() => Math.random()),
      }));

    // Add all patterns to memory
    for (const pattern of patterns) {
      await system.memorySystem.addToMemory(pattern);
    }

    // Access some patterns multiple times
    for (let i = 0; i < 5; i++) {
      await system.memorySystem.accessPattern(patterns[i].id);
    }

    // Verify frequently accessed patterns are still in memory
    for (let i = 0; i < 5; i++) {
      const pattern = await system.memorySystem.accessPattern(patterns[i].id);
      expect(pattern).toBeDefined();
    }
  });
});
