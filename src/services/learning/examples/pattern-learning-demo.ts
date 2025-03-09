import { PatternRepository } from "../../storage/PatternRepository";
import { FeatureVectorDatabase } from "../../storage/FeatureVectorDatabase";
import { HealthMonitor } from "../../monitoring/HealthMonitor";
import { PatternFeedbackService } from "../../feedback/PatternFeedbackService";
import { PatternLearningService } from "../PatternLearningService";
import { PatternRelationshipTracker } from "../PatternRelationshipTracker";
import { ContextualMemorySystem } from "../../memory/ContextualMemorySystem";
import { AdaptiveConfidenceModeler } from "../AdaptiveConfidenceModeler";
import { LearningIntegrationService } from "../LearningIntegrationService";
import { AudioPattern, PatternContext, PatternFeedback } from "../../../types/audio";

async function runPatternLearningDemo() {
  try {
    // Initialize base infrastructure
    const healthMonitor = new HealthMonitor();

    // Initialize vector database
    const vectorDb = new FeatureVectorDatabase({
      indexPath: "./data/vector-index",
      dimensions: 10,
      distanceMetric: "cosine",
      persistIndexOnDisk: true
    }, healthMonitor);

    await vectorDb.initialize();

    // Initialize repository with vector database
    const repository = new PatternRepository(
      vectorDb,
      healthMonitor,
      {
        vectorDimensions: 10,
        similarityThreshold: 0.8,
        maxQueryResults: 100
      }
    );

    await repository.initialize();

    // Initialize core services with proper dependency chain
    const feedbackService = new PatternFeedbackService(healthMonitor);

    const confidenceModeler = new AdaptiveConfidenceModeler(
      repository,
      vectorDb,
      healthMonitor
    );

    const relationshipTracker = new PatternRelationshipTracker(
      repository,
      vectorDb,
      healthMonitor,
      {
        similarityThreshold: 0.8,
        maxRelationshipsPerPattern: 10,
        minConfidenceThreshold: 0.6,
        enableAutoDiscovery: true
      }
    );

    const memorySystem = new ContextualMemorySystem(
      repository,
      vectorDb,
      relationshipTracker,
      healthMonitor
    );

    // Initialize learning service with proper dependencies
    const learningService = new PatternLearningService(
      repository,
      feedbackService,
      vectorDb,
      healthMonitor,
      {
        learningRate: 0.1,
        minFeedbackThreshold: 3,
        similarityThreshold: 0.85,
        feedbackRelevancePeriod: 90,
        enableAutoPropagation: true
      }
    );

    // Initialize integration service
    const integrationService = new LearningIntegrationService(
      repository,
      learningService,
      relationshipTracker,
      memorySystem,
      confidenceModeler,
      healthMonitor,
      {
        enableBatchProcessing: true,
        batchSize: 10,
        batchWindow: 1000,
        minConfidenceThreshold: 0.6,
        performance: {
          maxProcessingTime: 200,
          trackMetrics: true
        }
      }
    );

    // Example pattern with features
    const pattern: AudioPattern = {
      id: "pattern1",
      type: "bird_call",
      startTime: 0,
      endTime: 1.5,
      confidence: 0.5,
      frequencyRange: {
        low: 2000,
        high: 8000
      },
      features: [0.5, 0.8, 0.3, 0.9, 0.4, 0.6, 0.7, 0.2, 0.1, 0.8]
    };

    // Ensure pattern has valid features before processing
    if (!Array.isArray(pattern.features) || pattern.features.length === 0) {
      throw new Error("Pattern must have valid feature vector");
    }

    const context: PatternContext = {
      sourceId: "outdoor_recording_1",
      sessionId: "morning_session_1",
      userId: "researcher_1",
      tags: ["morning", "forest", "spring"],
      timestamp: new Date(),
      environmentInfo: {
        noiseLevel: 0.2,
        recordingQuality: 0.9
      }
    };

    // Process pattern and demonstrate learning workflow
    console.log("\nProcessing new pattern...");
    const processedPattern = await integrationService.processNewPattern(pattern, context);
    console.log("Pattern processed with confidence:", processedPattern.confidence);

    // Simulate user feedback
    const feedback: PatternFeedback = {
      isCorrect: true,
      userConfidence: 0.9,
      affectSimilarPatterns: true,
      notes: "Clear bird call pattern"
    };

    console.log("\nProcessing feedback...");
    await integrationService.processFeedback(pattern.id, feedback);

    // Find similar patterns
    console.log("\nFinding similar patterns...");
    const similarPatterns = await integrationService.findContextuallyRelevantPatterns(
      context,
      {
        type: pattern.type,
        features: pattern.features
      }
    );

    console.log("Found similar patterns:", similarPatterns.length);

    // Improve detection for this pattern type
    console.log("\nImproving pattern detection...");
    await integrationService.improvePatternDetection(pattern.type);

    console.log("\nDemo completed successfully");

    // Print summary
    console.log("\nSummary:");
    console.log("- Initial pattern confidence:", pattern.confidence);
    console.log("- Final pattern confidence:", processedPattern.confidence);
    console.log("- Similar patterns found:", similarPatterns.length);
    console.log("- Learning rate:", learningService["config"].learningRate);

  } catch (error) {
    console.error("\nDemo failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.stack);
    }
    process.exit(1);
  }
}

// Run the demo if called directly
if (require.main === module) {
  console.log("Starting Pattern Learning Demo...\n");
  runPatternLearningDemo().catch(console.error);
}

export { runPatternLearningDemo };
