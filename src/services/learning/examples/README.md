# Pattern Learning System Examples

This directory contains example scripts and demos showing how to use the pattern learning system.

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Running the Examples

### Using the Runner Scripts

For Unix-like systems (Linux, macOS):
```bash
# Make the script executable
chmod +x src/services/learning/examples/run-examples.sh

# Run the examples
./src/services/learning/examples/run-examples.sh
```

For Windows:
```cmd
.\src\services\learning\examples\run-examples.bat
```

### Running Individual Examples

You can also run examples individually using ts-node:

```bash
# Run setup verification
npx ts-node src/services/learning/examples/verify-setup.ts

# Run the pattern learning demo
npx ts-node src/services/learning/examples/pattern-learning-demo.ts
```

## Available Examples

### 1. Setup Verification (verify-setup.ts)
Tests that your environment is properly configured by:
- Creating necessary data directories
- Initializing core services
- Testing vector operations
- Verifying pattern storage and retrieval
- Checking metadata handling

### 2. Pattern Learning Demo (pattern-learning-demo.ts)
Demonstrates the complete workflow of:
- Processing new audio patterns
- Handling user feedback
- Finding similar patterns
- Adaptive confidence modeling
- Pattern relationship tracking

## Directory Structure

```
examples/
├── README.md              # This file
├── verify-setup.ts        # Setup verification script
├── pattern-learning-demo.ts # Main example
├── run-examples.sh        # Unix runner script
└── run-examples.bat       # Windows runner script
```

## Data Storage

Examples use these directories for storing data:
```
data/
├── vector-index/     # Vector similarity database
├── patterns/         # Pattern storage
└── feedback/         # User feedback history
```

## Configuration

The examples use default configurations suitable for testing. For production use, adjust these settings in your implementation:

### Vector Database
```typescript
const vectorDbConfig = {
  dimensions: 10,
  distanceMetric: "cosine",
  persistIndexOnDisk: true
};
```

### Pattern Learning
```typescript
const learningConfig = {
  learningRate: 0.1,
  minFeedbackThreshold: 3,
  similarityThreshold: 0.85,
  enableAutoPropagation: true
};
```

### Memory System
```typescript
const memoryConfig = {
  maxPatterns: 10000,
  pruningThreshold: 0.3,
  relationshipTracking: true
};
```

## Health Monitoring

The examples include basic health monitoring. In production, configure proper metric collection:

```typescript
healthMonitor.recordMetric("pattern.processed", {
  patternId,
  confidence,
  processingTime
});
```

## Error Handling

The examples demonstrate proper error handling patterns:
- Service initialization validation
- Pattern processing error recovery
- Graceful degradation
- Detailed error reporting

## Troubleshooting

Common issues and solutions:

1. **Directory Access Errors**
   - Ensure you have write permissions in the `data` directory
   - Run with appropriate privileges

2. **TypeScript Errors**
   - Check your TypeScript version matches the project requirements
   - Rebuild the project: `npm run build`

3. **Memory Issues**
   - Increase Node.js memory limit: `NODE_OPTIONS=--max_old_space_size=4096`
   - Adjust batch processing parameters

## Contributing

When adding new examples:
1. Follow the established patterns for service initialization
2. Include proper error handling
3. Add health monitoring metrics
4. Update this README
5. Test on both Unix and Windows systems

## Related Documentation

- [Audio Pattern Learning Strategy](../../../docs/AUDIO-PATTERN-LEARNING-STRATEGY.md)
- [Health Monitoring Guide](../../../docs/HEALTH-MONITORING-FIXES.md)
- [Integration Architecture](../../../docs/INTEGRATION-ARCHITECTURE-PLAN.md)
