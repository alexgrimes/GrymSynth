import { FeatureVectorDatabase } from "../../storage/FeatureVectorDatabase";
import { PatternRepository } from "../../storage/PatternRepository";
import { HealthMonitor } from "../../monitoring/HealthMonitor";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { PatternMetadata } from "../../../types/audio";

async function verifySetup() {
  console.log("Verifying Pattern Learning System Setup...\n");

  const issues: string[] = [];
  let healthMonitor: HealthMonitor;
  let vectorDb: FeatureVectorDatabase;
  let repository: PatternRepository;

  try {
    // Check data directories
    console.log("Checking data directories...");
    const directories = [
      "./data",
      "./data/vector-index",
      "./data/patterns",
      "./data/feedback"
    ];

    for (const dir of directories) {
      if (!existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        mkdirSync(dir, { recursive: true });
      }
    }
    console.log("✓ Data directories verified\n");

    // Initialize core services
    console.log("Initializing core services...");

    healthMonitor = new HealthMonitor();
    console.log("✓ Health monitor initialized");

    vectorDb = new FeatureVectorDatabase({
      indexPath: join("data", "vector-index"),
      dimensions: 10,
      distanceMetric: "cosine",
      persistIndexOnDisk: true
    }, healthMonitor);

    await vectorDb.initialize();
    console.log("✓ Vector database initialized");

    repository = new PatternRepository(
      vectorDb,
      healthMonitor,
      {
        vectorDimensions: 10,
        similarityThreshold: 0.8,
        maxQueryResults: 100
      }
    );

    await repository.initialize();
    console.log("✓ Pattern repository initialized");

    // Verify vector operations
    console.log("\nTesting vector operations...");
    const testVector1 = Array(10).fill(0).map(() => Math.random());
    const testVector2 = Array(10).fill(0).map(() => Math.random());

    const similarity = await vectorDb.calculateSimilarity(testVector1, testVector2);
    console.log("✓ Vector similarity calculation working");

    // Verify pattern storage
    console.log("\nTesting pattern storage...");
    const testPattern = {
      id: "test-pattern",
      type: "verification",
      startTime: 0,
      endTime: 1,
      confidence: 0.5,
      frequencyRange: { low: 20, high: 20000 },
      features: testVector1
    };

    // Create test metadata
    const testMetadata: PatternMetadata = {
      sourceId: "verification-test",
      createdAt: new Date(),
      lastModified: new Date(),
      sessionId: "verify-session",
      userId: "system",
      tags: ["test", "verification"],
      customProperties: {
        signalToNoise: 0.9,
        clarity: 0.8,
        confidence: 0.95,
        operation: "verification",
        details: "Initial verification test"
      }
    };

    await repository.storePattern(testPattern, testMetadata);
    const retrieved = await repository.getPatternById("test-pattern");
    if (!retrieved) {
      throw new Error("Failed to store and retrieve test pattern");
    }

    const retrievedMetadata = await repository.getPatternMetadata("test-pattern");
    if (!retrievedMetadata) {
      throw new Error("Failed to store and retrieve pattern metadata");
    }

    console.log("✓ Pattern storage working");
    console.log("✓ Metadata storage working");

    // Cleanup test data
    await repository.deletePattern("test-pattern");

  } catch (error) {
    issues.push(String(error));
  }

  // Print results
  console.log("\nVerification Results:");
  if (issues.length === 0) {
    console.log("✓ All systems are ready to use");
    console.log("\nYou can now run the examples:");
    console.log("  npm run example:pattern-learning");
  } else {
    console.error("! Setup verification found issues:");
    issues.forEach(issue => console.error(`  - ${issue}`));
    console.log("\nPlease fix these issues before running the examples.");
    process.exit(1);
  }
}

// Run verification if called directly
if (require.main === module) {
  verifySetup().catch(error => {
    console.error("\nVerification failed:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  });
}

export { verifySetup };
