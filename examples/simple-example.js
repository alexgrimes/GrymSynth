#!/usr/bin/env node
/**
 * GrymSynth Demonstration Example
 *
 * This example demonstrates the core concepts of GrymSynth:
 * 1. Audio Pattern Recognition - Identifying distinct patterns in audio data
 * 2. Pattern Relationship Analysis - Discovering how patterns relate to each other
 * 3. Adaptive Learning - Improving recognition through feedback and experience
 * 4. Contextual Memory - Storing and retrieving patterns with context
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, "..", "data", "examples", "vectors");

async function runExample() {
  try {
    // Create data directory if it doesn't exist
    await mkdir(dataDir, { recursive: true });

    console.log("Running GrymSynth Audio Pattern Learning Example...\n");
    console.log("Using data directory:", dataDir);
    console.log("----------------------------------------\n");

    console.log("GrymSynth is a sophisticated system for audio pattern recognition,");
    console.log("learning, and analysis that uses adaptive techniques to improve");
    console.log("pattern recognition accuracy over time.\n");

    // CORE CONCEPT 1: Audio Pattern Recognition
    console.log("DEMONSTRATION 1: Audio Pattern Recognition");
    console.log("----------------------------------------");
    console.log("In a real application, GrymSynth would analyze audio data to");
    console.log("extract features and identify patterns. For this example, we'll");
    console.log("simulate a C major chord pattern recognition.\n");

    // Simulate pattern creation with feature vectors
    // In a real system, these would be extracted from audio data
    const patterns = [
      {
        id: "piano-c4",
        type: "note",
        frequencyRange: { low: 261.63, high: 262.63 }, // C4 note
        confidence: 0.9,
        features: Array(128).fill(0).map((_, i) => Math.sin(i / 10)), // Simulated feature vector
      },
      {
        id: "piano-e4",
        type: "note",
        frequencyRange: { low: 329.63, high: 330.63 }, // E4 note
        confidence: 0.85,
        features: Array(128).fill(0).map((_, i) => Math.sin(i / 8)),
      },
      {
        id: "piano-g4",
        type: "note",
        frequencyRange: { low: 392.0, high: 393.0 }, // G4 note
        confidence: 0.95,
        features: Array(128).fill(0).map((_, i) => Math.sin(i / 6)),
      },
    ];

    console.log("Recognized audio patterns:");
    patterns.forEach(pattern => {
      console.log(`- ${pattern.id}: ${pattern.type} (confidence: ${pattern.confidence})`);
    });

    // CORE CONCEPT 2: Pattern Relationship Analysis
    console.log("\nDEMONSTRATION 2: Pattern Relationship Analysis");
    console.log("----------------------------------------");
    console.log("GrymSynth discovers relationships between patterns to understand");
    console.log("higher-level structures in audio data, such as chords, progressions,");
    console.log("and musical phrases.\n");

    // Simulate pattern relationships
    const relationships = [
      { sourceId: "piano-c4", targetId: "piano-e4", type: "sequence", strength: 0.8 },
      { sourceId: "piano-e4", targetId: "piano-g4", type: "sequence", strength: 0.85 },
      { sourceId: "piano-c4", targetId: "piano-g4", type: "harmony", strength: 0.7 },
    ];

    console.log("Discovered relationships between patterns:");
    relationships.forEach(rel => {
      console.log(`- ${rel.sourceId} -> ${rel.targetId} (${rel.type}, strength: ${rel.strength})`);
    });

    // CORE CONCEPT 3: Adaptive Learning
    console.log("\nDEMONSTRATION 3: Adaptive Learning");
    console.log("----------------------------------------");
    console.log("GrymSynth improves its pattern recognition through feedback and");
    console.log("experience, continuously refining its models to increase accuracy.\n");

    // Simulate learning process
    console.log("Simulating adaptive learning process...");
    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
      console.log(`Learning iteration ${i}: Adjusting pattern weights and relationships...`);

      // Update pattern confidences based on simulated feedback
      patterns.forEach(pattern => {
        pattern.confidence = Math.min(0.99, pattern.confidence + 0.01);
      });
    }

    console.log("\nAfter learning, pattern confidences have improved:");
    patterns.forEach(pattern => {
      console.log(`- ${pattern.id}: ${pattern.confidence.toFixed(2)}`);
    });

    // CORE CONCEPT 4: Contextual Memory
    console.log("\nDEMONSTRATION 4: Contextual Memory");
    console.log("----------------------------------------");
    console.log("GrymSynth stores patterns with contextual information, allowing");
    console.log("for efficient retrieval and relationship discovery based on context.\n");

    // Simulate contextual memory
    const context = {
      sourceId: "piano-sample-1",
      sessionId: "practice-session-2025-03-09",
      environment: "studio",
      instrument: "grand piano",
      performer: "example-user",
      timestamp: new Date(),
      tags: ["piano", "practice", "c-major-chord"]
    };

    console.log("Storing patterns with context:");
    console.log(JSON.stringify(context, null, 2));

    console.log("\nRetrieving patterns by context...");
    console.log("Found 3 patterns matching context 'c-major-chord'");

    // Simulate pattern retrieval with enhanced context
    const enhancedPatterns = patterns.map(pattern => ({
      ...pattern,
      context: {
        ...context,
        confidence: pattern.confidence,
        occurrences: Math.floor(Math.random() * 10) + 1
      }
    }));

    console.log("\nEnhanced pattern with contextual memory:");
    console.log(JSON.stringify(enhancedPatterns[0], null, 2));

    console.log("\n----------------------------------------");
    console.log("GrymSynth Example completed successfully!");
    console.log("This demonstration shows how GrymSynth's core capabilities work");
    console.log("together to create a powerful audio pattern learning system.");
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
