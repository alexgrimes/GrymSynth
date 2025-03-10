#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdir } from "fs/promises";
import { createLearningSystem } from "grymsynth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, "..", "data", "examples", "vectors");

async function runExample() {
  try {
    // Create data directory if it doesn't exist
    await mkdir(dataDir, { recursive: true });

    console.log("Running GrymSynth example...\n");
    console.log("Using data directory:", dataDir);
    console.log("----------------------------------------\n");

    // Initialize system
    console.log("Initializing learning system...");
    const system = await createLearningSystem({
      vectorDb: {
        indexPath: "./data/examples/vectors",
        dimensions: 128,
        distanceMetric: "cosine",
        persistIndexOnDisk: true
      },
      repository: {
        vectorDimensions: 128,
        similarityThreshold: 0.8,
        maxQueryResults: 100
      },
      relationships: {
        similarityThreshold: 0.8,
        maxRelationshipsPerPattern: 10,
        minConfidenceThreshold: 0.5,
        enableAutoDiscovery: true
      },
      memory: {
        maxActivePatterns: 100,
        recencyBias: 0.6,
        frequencyBias: 0.4,
        memoryDecayPeriod: 30
      },
      learning: {
        learningRate: 0.1,
        minFeedbackThreshold: 3,
        similarityThreshold: 0.85,
        feedbackRelevancePeriod: 90,
        enableAutoPropagation: true
      }
    });

    console.log("Learning system initialized successfully");

    // Create sample patterns
    const patterns = [
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
    const context = {
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

    console.log("\n----------------------------------------");
    console.log("Example completed successfully!");
  } catch (error) {
    console.error("\nError running example:", error);
    process.exit(1);
  }
}

// Add proper error handling for the main process
runExample().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
