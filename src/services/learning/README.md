# Learning Services

This directory contains the core learning services for the audio pattern recognition system. These services work together to provide adaptive pattern learning, confidence modeling, and relationship tracking capabilities.

## Services Overview

### AdaptiveConfidenceModeler
Dynamically calculates and adjusts confidence scores for pattern detection based on:
- Feature similarity
- Historical performance
- Context-based factors
- User feedback

```typescript
const confidenceModeler = new AdaptiveConfidenceModeler(
  repository,
  vectorDb,
  healthMonitor
);
```

### LearningIntegrationService
Orchestrates interactions between learning components and integrates them with the core system:
- Pattern processing
- Feedback distribution
- Batch processing
- Relationship discovery

```typescript
const learningService = new LearningIntegrationService(
  repository,
  learningService,
  relationshipTracker,
  memorySystem,
  confidenceModeler,
  healthMonitor
);
```

### PatternLearningService
Handles the core learning logic for pattern recognition:
- Feature extraction
- Model updates
- Training data management

### PatternRelationshipTracker
Manages relationships between patterns:
- Similar patterns
- Sequential patterns
- Overlapping patterns
- Hierarchical relationships

## Key Interfaces

### Pattern Processing
```typescript
async processNewPattern(
  pattern: AudioPattern,
  context: PatternContext
): Promise<AudioPattern>
```

### Feedback Processing
```typescript
async processFeedback(
  patternId: string,
  feedback: PatternFeedback
): Promise<void>
```

### Pattern Discovery
```typescript
async findContextuallyRelevantPatterns(
  context: Partial<PatternContext>,
  prototypePattern?: Partial<AudioPattern>
): Promise<AudioPattern[]>
```

## Integration Example

```typescript
// Initialize services
const healthMonitor = new HealthMonitor();
const vectorDb = new FeatureVectorDatabase(config, healthMonitor);
const repository = new PatternRepository(vectorDb, healthMonitor, config);
const feedbackService = new PatternFeedbackService(healthMonitor);

const learningService = new PatternLearningService(
  repository,
  feedbackService,
  healthMonitor,
  vectorDb
);

const relationshipTracker = new PatternRelationshipTracker(
  repository,
  vectorDb,
  healthMonitor
);

const memorySystem = new ContextualMemorySystem(
  repository,
  vectorDb,
  relationshipTracker,
  healthMonitor
);

const confidenceModeler = new AdaptiveConfidenceModeler(
  repository,
  vectorDb,
  healthMonitor
);

// Create integration service
const integrationService = new LearningIntegrationService(
  repository,
  learningService,
  relationshipTracker,
  memorySystem,
  confidenceModeler,
  healthMonitor
);

// Process a new pattern
const result = await integrationService.processNewPattern(pattern, context);

// Process feedback
await integrationService.processFeedback(patternId, feedback);
```

## Testing

The services include comprehensive unit tests:
- Mock implementations for dependencies
- Edge case handling
- Error scenarios
- Batch processing
- Performance monitoring

Run tests with:
```bash
npm run test:services
```

## Health Monitoring

All services integrate with the HealthMonitor to track:
- Processing performance
- Error rates
- Learning metrics
- System health

Monitor metrics using:
```typescript
healthMonitor.recordMetric("learning.pattern.processed", {
  patternId,
  processingTime,
  confidence
});
```

## Dependencies

- `@types/audio`: Audio pattern type definitions
- `feature-vector-db`: Vector similarity database
- `health-monitor`: System health monitoring
- `pattern-repository`: Pattern storage and retrieval

## Configuration

Key configuration options:
```typescript
interface LearningIntegrationConfig {
  enableBatchProcessing: boolean;
  batchSize: number;
  batchWindow: number;
  minConfidenceThreshold: number;
  performance: {
    maxProcessingTime: number;
    trackMetrics: boolean;
  };
}
```

## Error Handling

Services use structured error handling with health monitoring:
```typescript
try {
  // Process operation
} catch (error) {
  healthMonitor.recordMetric("error.category", {
    operation,
    error: String(error)
  });
  throw error;
}
