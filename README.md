# GrymSynth

A sophisticated TypeScript-based system for audio pattern recognition, learning, and analysis. The system uses adaptive learning techniques to improve pattern recognition accuracy over time.

## Features

- **Pattern Recognition**: Advanced audio pattern detection and analysis
- **Adaptive Learning**: System improves through feedback and experience
- **Contextual Memory**: Efficient storage and retrieval of pattern information
- **Relationship Tracking**: Discovers and maintains pattern relationships
- **Performance Monitoring**: Comprehensive health monitoring and metrics
- **Asset Management**: Efficient handling of large binary files outside the Git repository

## Quick Start

```bash
# Install dependencies and set up the project
./scripts/setup.sh

# Or for minimal setup with only essential assets
./scripts/setup.sh --minimal

# Run example
npm start

# Run example in debug mode
npm run dev
```

> **Note**: The setup script will download required model files and assets. For more details, see [Asset Management](#asset-management).

## Project Structure

```
GrymSynth/
├── src/
│   ├── services/          # Core services
│   │   ├── learning/      # Learning components
│   │   ├── memory/        # Memory management
│   │   ├── storage/       # Data persistence
│   │   └── monitoring/    # Health monitoring
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utility functions
│   │   └── asset-manager.ts  # External asset management
│   └── scripts/          # TypeScript scripts
│       └── download-assets.ts # Asset download script
├── config/              # Configuration files
│   └── assets.json      # Asset configuration
├── examples/            # Usage examples
├── scripts/             # Utility scripts
│   ├── identify-large-files.sh  # Find large files
│   ├── clean-repo.sh    # Move large files out of repo
│   └── setup.sh         # Project setup script
├── tests/               # Test suites
├── data/                # Data storage
└── assets/              # Local assets (in .gitignore)
```

The project also uses an external assets directory (by default at `../assets/`) to store large binary files outside the Git repository.

## Development

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/GrymSynth.git
cd GrymSynth

# Full setup (installs dependencies, downloads assets, and runs tests)
./scripts/setup.sh

# Or for more control over the setup process:

# Install dependencies only
./scripts/setup.sh --skip-assets --skip-tests

# Install dependencies and download only essential assets
./scripts/setup.sh --minimal

# Use a custom external assets directory
./scripts/setup.sh --external-assets-dir /path/to/assets

# Build project
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:perf

# Run tests with coverage
npm run test:coverage
```

### Scripts

```bash
# Clean build artifacts
npm run clean

# Reset project (clean + fresh install)
npm run reset

# Run example
npm start

# Run example in debug mode
npm run dev

# Asset Management
./scripts/identify-large-files.sh           # Find files larger than 10MB
./scripts/clean-repo.sh                     # Move large files to external directory
npm run assets:download                     # Download all required assets
npm run assets:download -- --minimal        # Download only essential assets
npm run assets:download -- --force          # Force re-download of all assets
```

## Configuration

The system can be configured through various configuration objects. Example:

```typescript
import { createLearningSystem, HealthMonitor } from 'GrymSynth';

const system = await createLearningSystem({
  vectorDb: {
    indexPath: './data/vectors',
    dimensions: 128,
    distanceMetric: 'cosine',
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
```

## Asset Management

The GrymSynth uses an asset management system to handle large binary files (models, audio samples, etc.) outside of the Git repository. This approach keeps the repository size manageable while providing easy access to necessary assets.

### Key Features

- **External Storage**: Large files are stored outside the Git repository
- **Automatic Downloads**: Required assets are downloaded on demand
- **Checksum Validation**: All downloaded files are validated for integrity
- **Configurable Sources**: Assets can be downloaded from multiple sources
- **Progress Tracking**: Download progress is reported in real-time

### Usage in Code

```typescript
import { assetManager } from './utils/asset-manager';

// Initialize the asset manager
await assetManager.initialize();

// Get the path to an asset (downloads if necessary)
const modelPath = await assetManager.getAssetPath('audioldm-s-full');

// Use the model in your application
const model = await loadModel(modelPath);
```

For detailed documentation on the asset management system, see [Asset Management Guide](./docs/ASSETS.md).

## API Documentation

See [examples/](./examples) directory for usage examples and the following documentation:

- [API Reference](./docs/API.md)
- [Configuration Guide](./docs/CONFIGURATION.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Asset Management Guide](./docs/ASSETS.md)

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 5.2.0
- NPM >= 8.0.0

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement your changes
5. Run the test suite
6. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- [Issue Tracker](https://github.com/yourusername/GrymSynth/issues)
- [Documentation](./docs)
