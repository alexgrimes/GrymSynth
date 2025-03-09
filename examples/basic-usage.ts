import {
  createLearningSystem,
  HealthMonitor,
  AudioPattern,
  PatternContext,
  DEFAULT_VECTOR_CONFIG,
  DEFAULT_REPOSITORY_CONFIG,
  DEFAULT_RELATIONSHIP_CONFIG,
  DEFAULT_MEMORY_CONFIG,
  DEFAULT_LEARNING_CONFIG,
} from "../src";

async function runExample() {
  // Initialize system
  const healthMonitor = new HealthMonitor();

  const system = await createLearningSystem(
    {
      vectorDb: {
        ...DEFAULT_VECTOR_CONFIG,
        indexPath: "./data/examples/vectors", // Add required indexPath
      },
      repository: DEFAULT_REPOSITORY_CONFIG,
      relationships: DEFAULT_RELATIONSHIP_CONFIG,
      memory: DEFAULT_MEMORY_CONFIG,
      learning: DEFAULT_LEARNING_CONFIG,
    },
    healthMonitor
  );

  // Create sample patterns
  const patterns: AudioPattern[] = [
    {
      id: "piano-c4",
      type: "note",
      startTime: 0,
      endTime: 1,
      frequencyRange: { low: 261.63, high: 262.63 }, // C4 note
      confidence: 0.9,
      features: Array(128)
        .fill(0)
        .map((_, i) => Math.sin(i / 10)),
    },
    {
      id: "piano-e4",
      type: "note",
      startTime: 1,
      endTime: 2,
      frequencyRange: { low: 329.63, high: 330.63 }, // E4 note
      confidence: 0.85,
      features: Array(128)
        .fill(0)
        .map((_, i) => Math.sin(i / 8)),
    },
    {
      id: "piano-g4",
      type: "note",
      startTime: 2,
      endTime: 3,
      frequencyRange: { low: 392.0, high: 393.0 }, // G4 note
      confidence: 0.95,
      features: Array(128)
        .fill(0)
        .map((_, i) => Math.sin(i / 6)),
    },
  ];

  // Create pattern context
  const context: PatternContext = {
    sourceId: "piano-sample",
    sessionId: "example-session",
    userId: "example-user",
    timestamp: new Date(),
    tags: ["piano", "example"],
  };

  // Add patterns to memory
  console.log("Adding patterns to memory...");
  for (const pattern of patterns) {
    await system.memorySystem.addToMemory(pattern, context);
  }

  // Discover relationships
  console.log("\nDiscovering relationships...");
  const relationships = await system.relationshipTracker.discoverRelationships(
    "piano-c4"
  );
  console.log("Found relationships:", relationships.length);
  relationships.forEach((rel) => {
    console.log(
      `- ${rel.sourcePatternId} -> ${rel.targetPatternId} (${rel.type})`
    );
  });

  // Find similar patterns
  console.log("\nFinding similar patterns...");
  const similarPatterns = await system.relationshipTracker.findRelatedPatterns(
    "piano-e4"
  );
  console.log("Found similar patterns:", similarPatterns.length);
  similarPatterns.forEach((pattern) => {
    console.log(`- ${pattern.id} (${pattern.type})`);
  });

  // Query patterns by context
  console.log("\nQuerying patterns by context...");
  const contextPatterns = await system.memorySystem.findPatternsByContext({
    sourceId: context.sourceId,
    tags: context.tags,
  });
  console.log("Found patterns by context:", contextPatterns.length);
  contextPatterns.forEach((pattern) => {
    console.log(`- ${pattern.id} (${pattern.type})`);
  });

  // Access pattern memory
  console.log("\nAccessing patterns from memory...");
  for (const pattern of patterns) {
    const retrieved = await system.memorySystem.accessPattern(pattern.id);
    if (retrieved) {
      console.log(
        `Retrieved ${pattern.id}: confidence = ${retrieved.confidence}`
      );
    }
  }
}

// Run the example
if (require.main === module) {
  runExample().catch((error) => {
    console.error("Error running example:", error);
    process.exit(1);
  });
}

export default runExample;
