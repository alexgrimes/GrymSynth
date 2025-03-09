# GrymSynth

GrymSynth is a powerful text-to-audio synthesis platform that transforms textual descriptions into rich, nuanced audio using advanced AI models and interactive visualization tools.

## Core Vision

GrymSynth bridges the gap between creative expression and technical audio synthesis by providing:

- **Text-to-Audio Synthesis**: Transform text descriptions into rich audio using AI models
- **Interactive Visual Interface**: Manipulate audio through color-coded visualizations and touch gestures
- **Adaptive Learning**: System improves through feedback, building personalized knowledge over time
- **Multiple Output Formats**: Generate audio, MIDI files, and music notation from text descriptions

## Features

- **Text/Speech to Audio Generation**: Create audio from textual descriptions using AudioLDM
- **Mathematical Audio Transformations**: Apply formalized music approaches with XenakisLDM
- **Pattern Recognition & Learning**: Identify and learn from audio patterns over time
- **Interactive Visualization**: Color-coded graphic equalizer with touch gesture manipulation
- **Musical Concept Translation**: Convert high-level musical concepts to technical parameters
- **MIDI Generation**: Create MIDI files from recognized patterns and transformations
- **Robust System Architecture**: Comprehensive health monitoring and error recovery

## How to Use GrymSynth

GrymSynth provides an intuitive interface for audio creation and manipulation:

### Creating Audio

1. **Start the application**:
   ```bash
   npm start
   ```
   This launches the main interface where you can create and manipulate audio.

2. **Generate audio from text**:
   - Enter a text description in the prompt field
   - Adjust generation parameters if needed
   - Click "Generate" to create audio from your description

3. **Visualize and manipulate**:
   - View the generated audio in the color-coded visualization panel
   - Use touch gestures to manipulate audio parameters in real-time
   - Apply mathematical transformations through the XenakisLDM controls

### Providing Feedback

The system learns from your feedback to improve over time:

1. **Rate audio quality**:
   - Use the feedback controls to rate generated audio
   - Provide specific feedback on aspects like timbre, rhythm, or harmony
   - The system will adapt to your preferences with continued use

2. **Save and export**:
   - Save your creations to your library
   - Export as audio files (.wav, .mp3)
   - Generate MIDI files for use in other music software
   - Create music notation from your audio

### Exploring Musical Concepts

Experiment with high-level musical concepts:

1. **Open the Concept Explorer**:
   ```bash
   npm run concepts
   ```

2. **Adjust musical parameters**:
   - Experiment with concepts like "harmonic density" or "textural complexity"
   - See real-time visualization of parameter changes
   - Learn how musical concepts translate to audio characteristics

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
git clone https://github.com/alexgrimes/GrymSynth.git
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

- [Issue Tracker](https://github.com/alexgrimes/GrymSynth/issues)
- [Documentation](./docs)
