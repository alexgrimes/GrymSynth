# XenakisLDM Integration Tests

This directory contains integration tests for the XenakisLDM service, focusing on testing stochastic and algorithmic audio generation capabilities.

## Structure

```
.
├── audio-analyzer.ts     # Audio analysis utilities
├── test-config.ts       # Test configuration and types
├── test-harness.ts      # Test execution framework
├── test-runner.ts       # CLI test runner
├── run-tests.sh         # Shell script for running tests
└── stochastic-integration.test.ts  # Stochastic generator tests
```

## Requirements

- Node.js >= 16.0.0
- npm >= 7.0.0

## Installation

```bash
npm install
```

## Running Tests

### Basic Usage

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with verbose output
npm run test:verbose
```

### Advanced Usage

```bash
# Run specific tests using filter
./run-tests.sh --filter "stochastic"

# Run with coverage and fail fast
./run-tests.sh --coverage --fail-fast

# Show help
./run-tests.sh --help
```

## Writing Tests

### Test Case Structure

```typescript
const testCase = {
  name: 'test_name',
  parameters: {
    prompt: string,
    duration: number,
    mathematical: {
      stochastic?: StochasticParams,
      // other mathematical models...
    },
    mapping: Array<{
      source: string,
      target: string,
      transform?: (value: number) => number
    }>
  },
  expectedResults: {
    duration?: number,
    spectralProperties?: {
      density?: {
        mean?: number,
        variance?: number
      },
      frequency?: {
        min?: number,
        max?: number
      }
    },
    metrics?: {
      maxGenerationTime?: number,
      maxMemoryUsage?: number
    },
    error?: {
      expected: boolean,
      type?: string,
      message?: string
    }
  }
};
```

### Example Test

```typescript
describe('Stochastic Generator', () => {
  it('should generate audio with specified parameters', async () => {
    const testCase = {
      name: 'gaussian_test',
      parameters: {
        prompt: 'Test audio',
        duration: 30,
        mathematical: {
          stochastic: {
            distribution: 'gaussian',
            mean: 0.5,
            variance: 0.1
          }
        },
        mapping: [
          {
            source: 'stochastic.distribution',
            target: 'spectralDensity'
          }
        ]
      },
      expectedResults: {
        duration: 30,
        spectralProperties: {
          density: {
            mean: 0.5,
            variance: 0.1
          }
        }
      }
    };

    harness.registerTestCase(testCase);
    const result = await harness.runTestCase('gaussian_test');
    expect(result).toBe(true);
  });
});
```

## Coverage Requirements

- Minimum statement coverage: 80%
- Minimum branch coverage: 75%
- Minimum function coverage: 85%

## Contributing

1. Create new test files in this directory
2. Follow the existing test structure and naming conventions
3. Ensure tests are properly documented
4. Run the full test suite before submitting changes
5. Update this README if adding new test categories

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout in test configuration
   - Check for resource-intensive operations

2. **Memory Issues**
   - Use `--max-old-space-size` Node.js flag
   - Monitor memory usage with `--verbose` flag

3. **Audio Analysis Failures**
   - Verify audio buffer format
   - Check sample rate configurations
   - Validate spectral analysis parameters

### Debug Mode

Run tests in debug mode:
```bash
DEBUG=true npm test
```

## License

Same as the main project license.
