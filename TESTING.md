# Testing Guide for Wav2Vec2 Integration

## Overview

This guide covers the testing infrastructure for the Wav2Vec2 integration, including unit tests, integration tests, and performance tests. The testing system includes environment verification, automated test execution, and result analysis.

## Quick Start

### Running All Tests

```bash
# On Unix/Linux/Mac
npm run setup:unix

# On Windows
npm run setup:win
```

### Running Individual Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance
```

## Test Structure

### 1. Unit Tests
- Location: `tests/services/Wav2Vec2Service.test.ts`
- Tests individual components in isolation
- Verifies core functionality
- Uses mocked dependencies

### 2. Integration Tests
- Location: `tests/integration/Wav2Vec2Integration.test.ts`
- Tests end-to-end workflows
- Verifies component interactions
- Tests resource management
- Validates error handling

### 3. Performance Tests
- Location: `tests/performance/Wav2Vec2Performance.test.ts`
- Measures processing latency
- Monitors memory usage
- Validates concurrent processing
- Checks resource cleanup

## Environment Requirements

The testing infrastructure automatically verifies:
- Python 3.9+ with required packages
- Node.js 18+
- Required project structure
- System resource availability

## Test Reports

Test results are available in multiple formats:

### 1. Console Output
- Real-time test progress
- Error and warning summaries
- Performance metrics

### 2. Log Files
- Location: `logs/wav2vec2.log`
- Detailed operation logs
- Warning and error tracking
- Memory usage statistics

### 3. Coverage Reports
- Location: `coverage/`
- Detailed code coverage metrics
- Branch and line coverage
- Uncovered code identification

## Troubleshooting

### Common Issues

1. **Environment Setup Failures**
   ```bash
   # Verify environment manually
   npm run verify
   ```

2. **Test Failures**
   - Check logs in `logs/wav2vec2.log`
   - Verify Python dependencies
   - Ensure sufficient system resources

3. **Performance Issues**
   - Review memory usage in logs
   - Check system resource availability
   - Verify no competing resource-intensive processes

### Debug Mode

For detailed debugging:

```bash
# Run tests with debug logging
DEBUG=true npm run test:all

# Run specific test with more details
npm run test:unit -- --verbose
```

## Adding New Tests

### 1. Unit Tests
```typescript
describe('Component', () => {
  it('should handle specific case', async () => {
    // Test implementation
  });
});
```

### 2. Integration Tests
```typescript
describe('Workflow', () => {
  it('should complete end-to-end process', async () => {
    // Test implementation
  });
});
```

### 3. Performance Tests
```typescript
describe('Performance', () => {
  it('should meet latency requirements', async () => {
    // Test implementation
  });
});
```

## Performance Baselines

| Operation          | Target Latency | Memory Usage |
|-------------------|----------------|--------------|
| Initialization    | < 2000ms      | < 500MB      |
| Audio Processing  | < 500ms       | < 1GB        |
| Feature Analysis  | < 200ms       | < 500MB      |

## Continuous Integration

The test suite is designed for CI/CD integration:

```bash
# CI environment detection
npm run test:all -- --ci

# Generate CI-friendly reports
npm run test:all -- --json --outputFile=results.json
```

## Best Practices

1. **Test Isolation**
   - Clean up resources after tests
   - Don't rely on test execution order
   - Use fresh instances for each test

2. **Resource Management**
   - Monitor memory usage
   - Clean up temporary files
   - Release system resources

3. **Error Handling**
   - Test error conditions
   - Verify error messages
   - Check error recovery

4. **Performance Testing**
   - Run on stable system
   - Multiple iterations for accuracy
   - Include resource monitoring