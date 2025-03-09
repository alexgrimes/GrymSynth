import { createLearningSystem } from "../";
import { HealthMonitor } from "../../monitoring/HealthMonitor";
import { AudioPattern } from "../../../types/audio";
import { TEST_LEARNING_CONFIG } from "../config";

describe("Learning System Error Handling", () => {
  let healthMonitor: HealthMonitor;

  beforeEach(() => {
    healthMonitor = new HealthMonitor();
  });

  it("should handle invalid pattern data gracefully", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    const invalidPattern: Partial<AudioPattern> = {
      id: "invalid-pattern",
      type: "test",
      // Missing required fields
    };

    await expect(
      system.memorySystem.addToMemory(invalidPattern as AudioPattern)
    ).rejects.toThrow();
  });

  it("should handle pattern retrieval for non-existent patterns", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    const result = await system.memorySystem.accessPattern("non-existent-id");
    expect(result).toBeNull();
  });

  it("should handle relationship discovery with invalid features", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    const pattern: AudioPattern = {
      id: "test-pattern",
      type: "test",
      startTime: 0,
      endTime: 1,
      frequencyRange: { low: 100, high: 1000 },
      confidence: 0.8,
      features: [], // Empty features array
    };

    await system.memorySystem.addToMemory(pattern);

    // Should not throw but return empty relationships
    const relationships =
      await system.relationshipTracker.discoverRelationships(pattern.id);
    expect(relationships).toHaveLength(0);
  });

  it("should handle relationship discovery for non-existent pattern", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    await expect(
      system.relationshipTracker.discoverRelationships("non-existent-id")
    ).rejects.toThrow();
  });

  it("should handle concurrent pattern additions", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    const patterns = Array(10)
      .fill(0)
      .map((_, i) => ({
        id: `concurrent-pattern-${i}`,
        type: "test",
        startTime: i,
        endTime: i + 1,
        frequencyRange: { low: 100, high: 1000 },
        confidence: 0.8,
        features: Array(128)
          .fill(0)
          .map(() => Math.random()),
      }));

    // Add patterns concurrently
    await Promise.all(
      patterns.map((pattern) => system.memorySystem.addToMemory(pattern))
    );

    // Verify all patterns were added
    for (const pattern of patterns) {
      const retrieved = await system.memorySystem.accessPattern(pattern.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(pattern.id);
    }
  });

  it("should handle memory system overload gracefully", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    const largePatternSet = Array(1000)
      .fill(0)
      .map((_, i) => ({
        id: `overload-pattern-${i}`,
        type: "test",
        startTime: i,
        endTime: i + 1,
        frequencyRange: { low: 100, high: 1000 },
        confidence: 0.8,
        features: Array(128)
          .fill(0)
          .map(() => Math.random()),
      }));

    // Add patterns sequentially
    for (const pattern of largePatternSet) {
      await system.memorySystem.addToMemory(pattern);
    }

    // Verify memory limits are respected
    const activePatterns = new Set<string>();

    for (const pattern of largePatternSet) {
      const retrieved = await system.memorySystem.accessPattern(pattern.id);
      if (retrieved) {
        activePatterns.add(retrieved.id);
      }
    }

    expect(activePatterns.size).toBeLessThanOrEqual(
      TEST_LEARNING_CONFIG.memory.maxActivePatterns
    );
  });

  it("should handle feature vector database errors", async () => {
    // Create a system with invalid vector dimensions
    const invalidConfig = {
      ...TEST_LEARNING_CONFIG,
      vectorDb: {
        ...TEST_LEARNING_CONFIG.vectorDb,
        dimensions: -1, // Invalid dimensions
      },
    };

    await expect(
      createLearningSystem(invalidConfig, healthMonitor)
    ).rejects.toThrow();
  });

  it("should handle repository errors gracefully", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );

    // Attempt to update a non-existent pattern
    await expect(
      system.repository.updatePattern("non-existent", {
        confidence: 0.9,
      })
    ).rejects.toThrow();
  });
});
