import { createLearningSystem } from "../";
import { HealthMonitor } from "../../monitoring/HealthMonitor";
import { AudioPattern } from "../../../types/audio";
import { TEST_LEARNING_CONFIG } from "../config";

describe("Learning System Performance", () => {
  let healthMonitor: HealthMonitor;
  let startTime: number;

  beforeEach(() => {
    healthMonitor = new HealthMonitor();
    startTime = performance.now();
  });

  afterEach(() => {
    const duration = performance.now() - startTime;
    console.log(`Test duration: ${duration.toFixed(2)}ms`);
  });

  it("should handle rapid pattern additions efficiently", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );
    const patternCount = 1000;
    const batchSize = 50;
    let addedCount = 0;
    const startTime = performance.now();

    // Create patterns in batches
    for (let batch = 0; batch < patternCount / batchSize; batch++) {
      const patterns = Array(batchSize)
        .fill(0)
        .map((_, i) => ({
          id: `perf-pattern-${batch}-${i}`,
          type: "test",
          startTime: batch + i / batchSize,
          endTime: batch + (i + 1) / batchSize,
          frequencyRange: { low: 100, high: 1000 },
          confidence: 0.8,
          features: Array(128)
            .fill(0)
            .map(() => Math.random()),
        }));

      await Promise.all(
        patterns.map((pattern) => system.memorySystem.addToMemory(pattern))
      );
      addedCount += patterns.length;
    }

    const duration = performance.now() - startTime;
    const patternsPerSecond = (addedCount / duration) * 1000;

    console.log(`Added ${addedCount} patterns in ${duration.toFixed(2)}ms`);
    console.log(`Rate: ${patternsPerSecond.toFixed(2)} patterns/second`);

    // Performance assertion
    expect(patternsPerSecond).toBeGreaterThan(100); // At least 100 patterns/second
  });

  it("should perform relationship discovery efficiently", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );
    const patternCount = 100;
    const targetTimePerPattern = 50; // 50ms per pattern target

    // Create patterns with controlled similarity
    const baseFeatures = Array(128)
      .fill(0)
      .map(() => Math.random());
    const patterns: AudioPattern[] = Array(patternCount)
      .fill(0)
      .map((_, i) => ({
        id: `rel-pattern-${i}`,
        type: "test",
        startTime: i,
        endTime: i + 1,
        frequencyRange: { low: 100, high: 1000 },
        confidence: 0.8,
        features: baseFeatures.map((f) => f + Math.random() * 0.2),
      }));

    // Add all patterns
    await Promise.all(
      patterns.map((pattern) => system.memorySystem.addToMemory(pattern))
    );

    // Measure relationship discovery time
    const startTime = performance.now();
    const relationships = await Promise.all(
      patterns
        .slice(0, 10)
        .map((pattern) =>
          system.relationshipTracker.discoverRelationships(pattern.id)
        )
    );
    const duration = performance.now() - startTime;
    const timePerPattern = duration / patterns.length;

    console.log(`Discovered relationships in ${duration.toFixed(2)}ms`);
    console.log(`Average time per pattern: ${timePerPattern.toFixed(2)}ms`);

    // Performance assertions
    expect(timePerPattern).toBeLessThan(targetTimePerPattern);
    expect(relationships.every((r) => r.length > 0)).toBe(true);
  });

  it("should handle memory access patterns efficiently", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );
    const patternCount = TEST_LEARNING_CONFIG.memory.maxActivePatterns;
    const accessIterations = 1000;

    // Create test patterns
    const patterns = Array(patternCount)
      .fill(0)
      .map((_, i) => ({
        id: `mem-pattern-${i}`,
        type: "test",
        startTime: i,
        endTime: i + 1,
        frequencyRange: { low: 100, high: 1000 },
        confidence: 0.8,
        features: Array(128)
          .fill(0)
          .map(() => Math.random()),
      }));

    // Add patterns to memory
    await Promise.all(
      patterns.map((pattern) => system.memorySystem.addToMemory(pattern))
    );

    // Perform random access patterns
    const startTime = performance.now();
    let successfulAccesses = 0;

    for (let i = 0; i < accessIterations; i++) {
      const randomIndex = Math.floor(Math.random() * patterns.length);
      const pattern = await system.memorySystem.accessPattern(
        patterns[randomIndex].id
      );
      if (pattern) successfulAccesses++;
    }

    const duration = performance.now() - startTime;
    const accessesPerSecond = (accessIterations / duration) * 1000;

    console.log(
      `Performed ${accessIterations} memory accesses in ${duration.toFixed(
        2
      )}ms`
    );
    console.log(`Rate: ${accessesPerSecond.toFixed(2)} accesses/second`);
    console.log(
      `Hit rate: ${((successfulAccesses / accessIterations) * 100).toFixed(2)}%`
    );

    // Performance assertions
    expect(accessesPerSecond).toBeGreaterThan(500); // At least 500 accesses/second
    expect(successfulAccesses / accessIterations).toBeGreaterThan(0.8); // >80% hit rate
  });

  it("should handle concurrent operations efficiently", async () => {
    const system = await createLearningSystem(
      TEST_LEARNING_CONFIG,
      healthMonitor
    );
    const operationCount = 100;
    const startTime = performance.now();

    // Create mixed operations
    const operations = await Promise.all([
      // Addition operations
      ...Array(operationCount)
        .fill(0)
        .map((_, i) =>
          system.memorySystem.addToMemory({
            id: `conc-pattern-${i}`,
            type: "test",
            startTime: i,
            endTime: i + 1,
            frequencyRange: { low: 100, high: 1000 },
            confidence: 0.8,
            features: Array(128)
              .fill(0)
              .map(() => Math.random()),
          })
        ),

      // Access operations
      ...Array(operationCount)
        .fill(0)
        .map((_, i) =>
          system.memorySystem.accessPattern(
            `conc-pattern-${i % (operationCount / 2)}`
          )
        ),

      // Relationship discovery operations
      ...Array(operationCount / 4)
        .fill(0)
        .map((_, i) =>
          system.relationshipTracker.discoverRelationships(`conc-pattern-${i}`)
        ),
    ]);

    const duration = performance.now() - startTime;
    const operationsPerSecond = (operations.length / duration) * 1000;

    console.log(
      `Performed ${
        operations.length
      } concurrent operations in ${duration.toFixed(2)}ms`
    );
    console.log(`Rate: ${operationsPerSecond.toFixed(2)} operations/second`);

    // Performance assertions
    expect(operationsPerSecond).toBeGreaterThan(50); // At least 50 mixed operations/second
  });
});
