# XenakisLDM Service

A service that combines Iannis Xenakis' mathematical composition techniques with AudioLDM for AI-driven music generation. The service implements various mathematical models including stochastic processes, sieves, cellular automata, game theory, and set theory operations.

## Features

- Integration with AudioLDM for high-quality audio generation
- Multiple mathematical generation methods:
  - Stochastic processes (Gaussian, Poisson, Exponential distributions)
  - Sieve theory operations (inspired by Xenakis' work)
  - Cellular automata patterns (1D and 2D rules)
  - Game theory evolution (Nash equilibrium, cooperative strategies)
  - Set theory operations on pitch classes
- Parameter mapping from mathematical structures to audio generation
- Real-time visualization of mathematical patterns
- Performance optimization and memory management
- Comprehensive test suite

## Installation

```bash
npm install @audio/xenakis-ldm
```

## Quick Start

```typescript
import { XenakisLDMServiceFactory } from './XenakisLDMService';

// Create and initialize the service
const service = await XenakisLDMServiceFactory.createService({
  maxMemory: '4GB',
  useWebAssembly: true,
  parameterPrecision: 0.001,
  cachingEnabled: true,
  maxParallelGenerators: 4
});

// Generate audio using stochastic parameters
const result = await service.executeTask({
  id: 'example-1',
  type: 'xenakis-generation',
  modelType: 'xenakis',
  priority: 'normal',
  data: {
    parameters: {
      prompt: 'Stochastic texture with granular elements',
      mathematical: {
        stochastic: {
          type: 'stochastic',
          duration: 5,
          sampleRate: 44100,
          distribution: {
            type: 'gaussian',
            parameters: {
              mean: 0,
              stdDev: 1
            }
          },
          range: {
            min: -1,
            max: 1
          },
          timeScale: 1
        }
      },
      mapping: [
        {
          source: {
            id: 'density',
            type: 'stochastic',
            value: 0.5,
            time: 0
          },
          target: 'guidanceScale'
        }
      ]
    }
  }
});
```

## Mathematical Models

### Stochastic Processes
Implements various probability distributions for generating parameter streams:
- Gaussian (Normal) distribution
- Poisson distribution
- Exponential distribution
- Custom distribution support

### Sieve Theory
Based on Xenakis' theory of sieves for rhythmic and pitch organization:
- Modular arithmetic operations
- Union, intersection, and complement operations
- Period-based pattern generation

### Cellular Automata
Implements cellular automata rules for pattern generation:
- Elementary 1D automata (Rules 30, 90, 110, etc.)
- 2D Game of Life patterns
- Custom neighborhood configurations

### Game Theory
Uses game theory for evolving musical parameters:
- Nash equilibrium calculation
- Cooperative and competitive strategies
- Multi-player musical interactions

### Set Theory
Implements musical set theory operations:
- Pitch class set operations
- Transposition and inversion
- Set class relationships

## Development

### Prerequisites
- Node.js >= 14.x
- TypeScript >= 4.x
- Jest for testing

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run tests
npm run test:xenakis

# Run performance tests
npm run test:xenakis:perf

# Run full verification suite
npm run verify:xenakis
```

### VS Code Integration
Launch configurations are provided for:
- Running all tests
- Debugging individual test files
- Performance testing
- Generator debugging

## Testing

The test suite includes:
- Unit tests for all generators
- Integration tests for AudioLDM integration
- Performance tests with thresholds
- Memory usage verification
- Full system tests

Run tests with:
```bash
# Run all tests
npm run test:xenakis

# Run specific test file
npm run test:xenakis -- StochasticGenerator.test.ts

# Run with coverage
npm run test:xenakis:coverage
```

## Performance Considerations

- Memory usage is carefully managed through the MemoryManager
- WebAssembly optimizations available for computation-heavy operations
- Caching system for frequently used patterns
- Parallel processing capabilities for multiple generators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Implement your feature
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE.md for details

## References

- Xenakis, I. (1992). Formalized Music
- Roads, C. (2004). Microsound
- Implementations based on research papers and mathematical models by Iannis Xenakis
