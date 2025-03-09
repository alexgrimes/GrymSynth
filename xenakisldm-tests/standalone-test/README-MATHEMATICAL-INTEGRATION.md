# XenakisLDM Mathematical Framework Integration

## Overview

This package integrates multiple mathematical frameworks with the spatial-spectral sieve theory in XenakisLDM, creating a powerful system for audio transformation. The integration combines gravitational field models, stochastic processes, cellular automata, and game theory to create rich, complex soundscapes.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/xenakisldm.git

# Navigate to the project directory
cd xenakisldm

# Install dependencies
npm install
```

## Quick Start

```javascript
const { IntegratedPipeline, UnifiedParameterSpace } = require('./lib');

// Create a pipeline
const pipeline = new IntegratedPipeline();

// Generate audio with default parameters
const result = await pipeline.generate(
    "Ambient texture with evolving harmonics"
);

// Generate audio with custom parameters
const customResult = await pipeline.generate(
    "Ambient texture with evolving harmonics",
    {
        spatial: {
            undulationRate: 0.4,
            intervals: [0, 4, 7] // Major triad
        },
        stochastic: {
            variance: 0.1
        },
        cellular: {
            rule: 110
        }
    }
);

// Use a preset
const harmonicPipeline = IntegratedPipeline.createPreset('harmonic');
const harmonicResult = await harmonicPipeline.generate(
    "Harmonic texture with mathematical transformations"
);
```

## Mathematical Frameworks

### 1. Spatial-Spectral Sieve

The core framework based on gravitational field models in frequency space:

```javascript
// Example: Spatial-spectral parameters
const spatialParams = {
    G: 0.01,                // Gravitational constant
    undulationRate: 0.3,    // Temporal variation in field strength
    spatialHallucination: 0.5, // Non-linear spatial effects
    intervals: [0, 4, 7],   // Major triad
    modulo: 12,             // Chromatic scale
    density: 0.8            // Spectral density
};
```

### 2. Stochastic Processes

Probabilistic transformations that introduce controlled randomness:

```javascript
// Example: Stochastic parameters
const stochasticParams = {
    variance: 0.1,          // Amount of randomness
    distribution: {
        type: "gaussian",   // Distribution type
        mean: 0,            // Mean value
        spread: 1           // Spread/variance
    },
    frequencyDependence: 0.3 // How frequency affects randomness
};
```

### 3. Cellular Automata

Rule-based systems that create emergent spectral patterns:

```javascript
// Example: Cellular automata parameters
const cellularParams = {
    rule: 110,              // CA rule number
    dimensions: 1,          // 1D or 2D
    iterations: 4,          // Number of iterations
    interaction: {
        strength: 0.5,      // Effect strength
        radius: 1           // Neighborhood radius
    }
};
```

### 4. Game Theory

Dynamic relationships between spectral regions:

```javascript
// Example: Game theory parameters
const gameTheoryParams = {
    agentCount: 4,          // Number of spectral agents
    strategySpace: "discrete", // Strategy space type
    learningRate: 0.1,      // How quickly strategies evolve
    competitionFactor: 0.5  // Balance between competition and cooperation
};
```

## Unified Parameter Space

All parameters are managed through a unified parameter space:

```javascript
// Example: Complete unified parameters
const unifiedParams = UnifiedParameterSpace.validateAndNormalize({
    duration: 3.0,

    spatial: spatialParams,
    stochastic: stochasticParams,
    cellular: cellularParams,
    gameTheory: gameTheoryParams,

    integration: {
        weights: {
            spatialSpectral: 1.0,
            stochastic: 0.7,
            cellular: 0.5,
            gameTheory: 0.3
        },
        blendMode: "weighted"
    }
});
```

## Presets

The system includes several presets for different transformation styles:

```javascript
// Available presets
const presets = [
    'harmonic',   // Emphasizes harmonic relationships
    'chaotic',    // Creates chaotic, unpredictable textures
    'evolving',   // Focuses on temporal evolution
    'minimal'     // Minimal transformations for subtle effects
];

// Create a preset pipeline
const pipeline = IntegratedPipeline.createPreset('harmonic');
```

## Advanced Usage

### Custom Framework Weights

```javascript
// Emphasize stochastic processes
const result = await pipeline.generate(
    "Noisy texture with subtle harmonics",
    {
        integration: {
            weights: {
                spatialSpectral: 0.4,
                stochastic: 1.0,
                cellular: 0.3,
                gameTheory: 0.2
            }
        }
    }
);
```

### Direct Framework Access

```javascript
// Access the mathematical framework adapter directly
const mathAdapter = new MathematicalFrameworkAdapter();

// Calculate effects for a specific frequency
const effects = mathAdapter.integrateFieldEffects(
    440, // A4 frequency
    unifiedParams,
    fields
);

console.log('Magnitude effect:', effects.magnitude);
console.log('Phase effect:', effects.phase);
console.log('Frequency shift:', effects.frequency);
```

### Field Evolution

```javascript
// Create a field evolution processor
const evolution = new SpectralFieldEvolution({
    evolutionRate: 0.5,
    complexityGrowth: 0.3
});

// Evolve audio with dynamic field parameters
const evolvedAudio = await evolution.evolve(audioBuffer, unifiedParams);
```

## Testing

```bash
# Run all tests
node run-integrated-tests.js

# Run specific test
node tests/integrated-framework.test.js
```

## API Reference

### IntegratedPipeline

The main entry point for audio generation and transformation:

- `constructor(config)`: Create a new pipeline
- `generate(prompt, parameters)`: Generate audio with the given prompt and parameters
- `createPreset(presetName, config)`: Create a pipeline with preset parameters

### UnifiedParameterSpace

Manages parameters for all mathematical frameworks:

- `validateAndNormalize(params)`: Validate and normalize parameters
- `createDefaultParameters()`: Create default parameters
- `createPreset(presetName)`: Create preset parameters

### MathematicalFrameworkAdapter

Integrates effects from multiple mathematical frameworks:

- `integrateFieldEffects(frequency, params, fields)`: Calculate combined effects

### IntegratedSpectralSieve

Applies spectral transformations using all mathematical frameworks:

- `transform(buffer, params)`: Transform audio using integrated frameworks

### SpectralFieldEvolution

Handles the evolution of spectral fields over time:

- `evolve(buffer, params)`: Apply time-varying field parameters

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
