# Workflow System Tests

This directory contains comprehensive tests for the workflow system, including unit tests, integration tests, and performance tests.

## Test Structure

- `workflow-system.test.ts`: Core functionality tests for workflow creation and execution
- `workflow-error-handling.test.ts`: Tests for error conditions and recovery mechanisms
- `workflow-performance.test.ts`: Performance and load testing
- `test-helpers.ts`: Common test utilities and helper functions
- `mocks.ts`: Mock implementations for testing

## Running Tests

### Quick Start

To run all tests with default settings:

```bash
node run-all.js
```

### Individual Test Suites

Run specific test suites:

```bash
# Core workflow tests
jest workflow-system.test.ts

# Error handling tests
jest workflow-error-handling.test.ts

# Performance tests
jest workflow-performance.test.ts
```

### Test Configuration

The test environment can be configured using environment variables:

```bash
# Set test timeout (default: 30000ms)
export TEST_TIMEOUT=60000

# Set concurrent test count (default: 4, CI: 1)
export CONCURRENT_TESTS=2

# Run tests with coverage
jest --coverage
```

## Test Categories

### Core Workflow Tests
- Workflow registration and validation
- Step execution and sequencing
- Context management
- Basic error conditions
- Workflow cancellation

### Error Handling Tests
- Failed step recovery
- Resource cleanup
- Timeout handling
- Concurrent execution errors
- Invalid workflow definitions
- Network failures

### Performance Tests
- Concurrent workflow execution
- Memory usage under load
- Execution time metrics
- Resource utilization
- Throughput testing

## Mock System

The test suite includes mock implementations for:
- Task Router
- Context Manager
- Service Registry
- Audio Processing Services

These mocks ensure reliable and repeatable tests without external dependencies.

## Directory Structure

```
__tests__/
├── cleanup.js              # Test cleanup utilities
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Test environment setup
├── mocks.ts               # Mock implementations
├── run-all.js            # Test runner script
├── test-helpers.ts       # Common test utilities
├── types/                # TypeScript type definitions
│   └── jest.d.ts        # Jest custom matchers
└── workflows/           # Test suites
    ├── system.test.ts
    ├── error-handling.test.ts
    └── performance.test.ts
```

## Coverage Requirements

The test suite enforces the following coverage thresholds:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Continuous Integration

Tests are automatically run in CI environments with:
- Stricter timeouts
- Sequential execution
- Full coverage reporting
- JUnit report generation

## Adding New Tests

When adding new tests:
1. Choose the appropriate test suite based on the feature
2. Follow the existing patterns for mocking and assertions
3. Include both positive and negative test cases
4. Add performance tests for significant features
5. Update this documentation as needed

## Debugging Tests

For troubleshooting:
1. Use `--verbose` flag for detailed output
2. Check test logs in `test-results/`
3. Use `--runInBand` for sequential execution
4. Enable test debugging in VS Code

## Common Issues

1. **Timeouts**: Increase `TEST_TIMEOUT` for complex workflows
2. **Memory Leaks**: Use cleanup script between test runs
3. **Flaky Tests**: Check for race conditions and add proper waits
4. **Mock Failures**: Verify mock configuration matches real services