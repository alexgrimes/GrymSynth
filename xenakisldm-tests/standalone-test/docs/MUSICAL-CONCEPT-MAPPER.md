# Musical Concept Mapper

The Musical Concept Mapper is a key component of the XenakisLDM system that bridges the gap between musical concepts and mathematical parameters. It allows musicians and sound designers to work with familiar musical terminology rather than having to understand the underlying mathematical frameworks.

## Overview

The Musical Concept Mapper translates high-level musical concepts like "harmonic density" or "textural complexity" into specific parameter values across the various mathematical frameworks used in XenakisLDM (spatial-spectral sieve, stochastic processes, cellular automata, and game theory).

This translation makes the system more accessible to musicians while still leveraging the power of the mathematical frameworks for audio transformation.

## Theoretical Foundations

The Musical Concept Mapper incorporates three important theoretical frameworks from the field of electroacoustic music and sound design:

### Denis Smalley's Spectromorphology

Spectromorphology is a framework for describing and analyzing sound materials and structures in terms of spectral and morphological thinking. It focuses on how sounds evolve over time and how listeners perceive these changes.

Key concepts from Smalley's work that are implemented in the mapper include:

- **Spectral Motion**: The movement and change of spectral content over time, including unidirectional, reciprocal, and cyclic/centric motion types.
- **Spectral Space**: The organization of sounds across the frequency spectrum, from dense to sparse, and the relationships between different spectral regions.
- **Gesture-Texture Continuum**: The balance between event-oriented (gestural) and continuous (textural) aspects of sound.

### Curtis Roads' Granular Synthesis Research

Granular synthesis is a sound synthesis method that operates on the microsound time scale, typically 1 to 100 milliseconds. It's based on the idea that complex sounds can be created by combining thousands of tiny "grains" of sound.

Key concepts from Roads' work that are implemented in the mapper include:

- **Grain Density**: The number of grains per unit of time, affecting the perceived density of the sound texture.
- **Grain Duration**: The length of individual grains, affecting the character and continuity of the sound.
- **Grain Distribution**: The statistical distribution of grains across time and frequency, affecting the overall texture and pattern of the sound.

### Simon Emmerson's Language Grid

Emmerson's language grid is a theoretical framework for understanding electroacoustic music in terms of the relationship between musical syntax and discourse. It distinguishes between abstract and abstracted syntax, and between aural and mimetic discourse.

Key concepts from Emmerson's work that are implemented in the mapper include:

- **Aural-Mimetic Discourse Balance**: The balance between abstract (aural) and concrete (mimetic) sound qualities.
- **Abstract-Abstracted Syntax Level**: The degree to which the musical syntax is abstract (based on internal relationships) or abstracted (derived from external references).
- **Contextual Discourse**: The relationships between different elements of the sound, creating a sense of context and narrative.

## Available Musical Concepts

The Musical Concept Mapper provides mappings for the following musical concepts:

### Basic Concepts

- **Harmonic Density**: Controls the density of spectral transformations and the harmonic intervals used.
- **Textural Complexity**: Affects the amount of randomness in the texture and the cellular automata rules used.
- **Rhythmic Chaos**: Controls the level of competition between frequency bands and the number of cellular automata iterations.
- **Timbral Brightness**: Affects how frequencies are shifted upward and how stochastic processes depend on frequency.
- **Dynamic Evolution**: Controls the rate of temporal variation and the influence of different frameworks over time.

### Spectromorphological Concepts

- **Spectral Motion**: Controls the rate and type of spectral motion and the statistical distribution affecting it.
- **Spectral Space**: Sets the boundaries of the spectral space and creates spectral fields within it.
- **Gesture Texture Balance**: Controls the balance between gestural and textural behavior in the sound.

### Granular Concepts

- **Grain Density**: Controls the density of spectral grains and their consistency.
- **Grain Duration**: Affects the effective duration of spectral grains through various parameters.
- **Grain Distribution**: Determines the statistical distribution of grains and whether it's discrete or continuous.

### Language Grid Concepts

- **Aural Mimetic Balance**: Controls the balance between abstract and concrete sound qualities.
- **Abstract Syntax Level**: Determines how mathematical frameworks are combined and weighted.
- **Contextual Discourse**: Creates relationship fields and payoff matrices that define contextual relationships.

## Using the Musical Concept Mapper

### Basic Usage

```javascript
const { MusicalConceptMapper } = require('./lib');

// Create a new Musical Concept Mapper
const mapper = new MusicalConceptMapper();

// Map a single concept
const params = mapper.mapConcept('harmonic density', 0.7);
// Result: parameters affecting spatial density and intervals

// Map multiple concepts
const multiParams = mapper.mapMultipleConcepts({
    'harmonic density': 0.6,
    'timbral brightness': 0.8,
    'rhythmic chaos': 0.3
});
// Result: combined parameters from all concepts
```

### Integration with Parameter Space

```javascript
const { MusicalConceptMapper, UnifiedParameterSpace } = require('./lib');

// Create mapper and get default parameters
const mapper = new MusicalConceptMapper();
const defaultParams = UnifiedParameterSpace.createDefaultParameters();

// Map musical concepts
const musicalParams = mapper.mapMultipleConcepts({
    'harmonic density': 0.7,
    'textural complexity': 0.4,
    'timbral brightness': 0.6
});

// Merge the parameters
const mergedParams = { ...defaultParams };
Object.entries(musicalParams).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
        mergedParams[key] = { ...mergedParams[key], ...value };
    } else {
        mergedParams[key] = value;
    }
});

// Validate and normalize the merged parameters
const finalParams = UnifiedParameterSpace.validateAndNormalize(mergedParams);
```

### Using with Presets

```javascript
const { PresetLibrary, IntegratedPipeline } = require('./lib');

// Create a preset library
const presetLibrary = new PresetLibrary();

// Get parameters for a preset
const params = presetLibrary.getPresetParameters('crystalline');

// Create a pipeline with these parameters
const pipeline = new IntegratedPipeline({ params });

// Process audio with the preset characteristics
const outputAudio = pipeline.process(inputAudio);
```

## Parameter Mappings

Each musical concept maps to specific parameters in the mathematical frameworks. Here are some examples:

### Harmonic Density

- **spatial.density**: Controls the density of spectral transformations (non-linear mapping)
- **spatial.intervals**: Determines the harmonic intervals used (value-based selection)

### Textural Complexity

- **stochastic.variance**: Controls the amount of randomness in the texture (linear mapping)
- **cellular.rule**: Determines the cellular automata rule used (value-based selection)

### Spectral Motion

- **spatial.undulationRate**: Controls the rate of spectral motion (linear mapping)
- **stochastic.distribution.type**: Determines the statistical distribution (value-based selection)
- **spatial.phaseInfluence**: Influences the phase coherence in spectral motion (linear mapping)

### Grain Density

- **spatial.density**: Controls the density of spectral grains (non-linear mapping)
- **stochastic.variance**: Affects the variance between grains (inverse non-linear mapping)
- **cellular.rule**: Determines the cellular automata rule affecting grain patterns (value-based selection)

## Visualization

The Musical Concept Mapper includes visualization capabilities to help users understand the relationships between musical concepts and mathematical parameters:

- **Simple ASCII Visualization**: Available directly in the MusicalConceptMapper class
- **Interactive Web Visualization**: Available through the ConceptVisualizer class and the concept-visualization.html example

## Future Directions

Future enhancements to the Musical Concept Mapper could include:

- **Machine Learning Integration**: Using machine learning to refine the mappings based on user feedback
- **Expanded Theoretical Frameworks**: Incorporating additional theoretical frameworks from music and sound design
- **Adaptive Mappings**: Dynamically adjusting mappings based on the characteristics of the input audio
- **User-Defined Mappings**: Allowing users to create and save their own custom mappings

## References

1. Smalley, D. (1997). Spectromorphology: explaining sound-shapes. Organised Sound, 2(2), 107-126.
2. Roads, C. (2001). Microsound. MIT Press.
3. Emmerson, S. (1986). The Relation of Language to Materials. In S. Emmerson (Ed.), The Language of Electroacoustic Music (pp. 17-39). Macmillan.
4. Xenakis, I. (1992). Formalized Music: Thought and Mathematics in Composition. Pendragon Press.
