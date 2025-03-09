/**
 * Test for the Musical Concept Mapper
 *
 * This file demonstrates how to use the Musical Concept Mapper to translate
 * musical concepts to mathematical parameters, incorporating theoretical frameworks
 * from Denis Smalley's Spectromorphology, Curtis Roads' granular synthesis research,
 * and Simon Emmerson's language grid.
 */

const { MusicalConceptMapper, UnifiedParameterSpace } = require('../lib');

// Create a new Musical Concept Mapper
const mapper = new MusicalConceptMapper({ debug: true });

// Get all available musical concepts
console.log('Available Musical Concepts:');
const concepts = mapper.getAvailableConcepts();
console.log(concepts);
console.log();

// Demonstrate mapping a single concept
console.log('Mapping "harmonic density" with value 0.7:');
const harmonicDensityParams = mapper.mapConcept('harmonic density', 0.7);
console.log(JSON.stringify(harmonicDensityParams, null, 2));
console.log();

// Demonstrate mapping multiple concepts
console.log('Mapping multiple concepts:');
const multipleConceptParams = mapper.mapMultipleConcepts({
    'harmonic density': 0.6,
    'timbral brightness': 0.8,
    'rhythmic chaos': 0.3
});
console.log(JSON.stringify(multipleConceptParams, null, 2));
console.log();

// Demonstrate getting concept information
console.log('Information about "textural complexity":');
const conceptInfo = mapper.getConceptInfo('textural complexity');
console.log(JSON.stringify(conceptInfo, null, 2));
console.log();

// Demonstrate visualization
console.log('Visualization of "dynamic evolution":');
const visualization = mapper.createSimpleVisualization('dynamic evolution', { width: 40, height: 8 });
console.log(visualization);

// Demonstrate theoretical frameworks
console.log('\n=== THEORETICAL FRAMEWORKS ===\n');

// Denis Smalley's Spectromorphology
console.log('DENIS SMALLEY\'S SPECTROMORPHOLOGY:');
console.log('Mapping "spectral motion" with value 0.7:');
const spectralMotionParams = mapper.mapConcept('spectral motion', 0.7);
console.log(JSON.stringify(spectralMotionParams, null, 2));

console.log('\nMapping "spectral space" with value 0.8:');
const spectralSpaceParams = mapper.mapConcept('spectral space', 0.8);
console.log(JSON.stringify(spectralSpaceParams, null, 2));

console.log('\nMapping "gesture texture balance" with value 0.4:');
const gestureTextureParams = mapper.mapConcept('gesture texture balance', 0.4);
console.log(JSON.stringify(gestureTextureParams, null, 2));
console.log();

// Curtis Roads' Granular Synthesis
console.log('CURTIS ROADS\' GRANULAR SYNTHESIS:');
console.log('Mapping "grain density" with value 0.6:');
const grainDensityParams = mapper.mapConcept('grain density', 0.6);
console.log(JSON.stringify(grainDensityParams, null, 2));

console.log('\nMapping "grain duration" with value 0.3:');
const grainDurationParams = mapper.mapConcept('grain duration', 0.3);
console.log(JSON.stringify(grainDurationParams, null, 2));

console.log('\nMapping "grain distribution" with value 0.7:');
const grainDistributionParams = mapper.mapConcept('grain distribution', 0.7);
console.log(JSON.stringify(grainDistributionParams, null, 2));
console.log();

// Simon Emmerson's Language Grid
console.log('SIMON EMMERSON\'S LANGUAGE GRID:');
console.log('Mapping "aural mimetic balance" with value 0.6:');
const auralMimeticParams = mapper.mapConcept('aural mimetic balance', 0.6);
console.log(JSON.stringify(auralMimeticParams, null, 2));

console.log('\nMapping "abstract syntax level" with value 0.8:');
const abstractSyntaxParams = mapper.mapConcept('abstract syntax level', 0.8);
console.log(JSON.stringify(abstractSyntaxParams, null, 2));

console.log('\nMapping "contextual discourse" with value 0.5:');
const contextualDiscourseParams = mapper.mapConcept('contextual discourse', 0.5);
console.log(JSON.stringify(contextualDiscourseParams, null, 2));
console.log();

// Demonstrate combined theoretical approach
console.log('COMBINED THEORETICAL APPROACH:');
const theoreticalParams = mapper.mapMultipleConcepts({
    // Smalley's concepts
    'spectral motion': 0.6,
    'spectral space': 0.7,
    'gesture texture balance': 0.4,

    // Roads' concepts
    'grain density': 0.5,
    'grain duration': 0.3,
    'grain distribution': 0.6,

    // Emmerson's concepts
    'aural mimetic balance': 0.5,
    'abstract syntax level': 0.7,
    'contextual discourse': 0.4
});
console.log(JSON.stringify(theoreticalParams, null, 2));

// Demonstrate integration with UnifiedParameterSpace
console.log('Integrating with UnifiedParameterSpace:');

// Create default parameters
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

// Show the final parameters
console.log('Final parameters after applying musical concepts:');
console.log(JSON.stringify({
    spatial: finalParams.spatial,
    stochastic: finalParams.stochastic,
    cellular: finalParams.cellular
}, null, 2));
