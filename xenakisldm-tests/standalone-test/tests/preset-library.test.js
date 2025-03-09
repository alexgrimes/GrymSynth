/**
 * Test for the Preset Library
 *
 * This file demonstrates how to use the Preset Library to access and apply
 * predefined combinations of musical concepts and parameters.
 */

const { PresetLibrary, IntegratedPipeline } = require('../lib');

// Create a new Preset Library
const presetLibrary = new PresetLibrary();

// Get all available presets
console.log('Available Presets:');
const presets = presetLibrary.getAvailablePresets();
console.log(presets);
console.log();

// Demonstrate getting preset information
console.log('Preset Information for "crystalline":');
const crystallineInfo = presetLibrary.getPresetInfo('crystalline');
console.log(JSON.stringify(crystallineInfo, null, 2));
console.log();

// Demonstrate getting preset parameters
console.log('Parameters for "textural-clouds" preset:');
const textureParams = presetLibrary.getPresetParameters('textural-clouds');
console.log('Spatial parameters:');
console.log(JSON.stringify(textureParams.spatial, null, 2));
console.log('Stochastic parameters:');
console.log(JSON.stringify(textureParams.stochastic, null, 2));
console.log('Cellular parameters:');
console.log(JSON.stringify(textureParams.cellular, null, 2));
console.log();

// Demonstrate finding presets by tag
console.log('Presets with tag "spectral":');
const spectralPresets = presetLibrary.getPresetsByTag('spectral');
console.log(spectralPresets);
console.log();

// Demonstrate finding presets by musical style
console.log('Presets with style "Ambient":');
const ambientPresets = presetLibrary.getPresetsByStyle('Ambient');
console.log(ambientPresets);
console.log();

// Demonstrate creating a custom preset
console.log('Creating a custom preset:');
const customPreset = presetLibrary.createCustomPreset(
    'my-custom-preset',
    {
        'harmonic density': 0.6,
        'spectral motion': 0.7,
        'grain density': 0.4,
        'aural mimetic balance': 0.5
    },
    {
        description: 'My custom preset with specific characteristics',
        tags: ['custom', 'personal', 'experimental'],
        musicalStyle: 'Personal Experimental Style'
    }
);
console.log(JSON.stringify(customPreset, null, 2));
console.log();

// Demonstrate using a preset in a pipeline
console.log('Using a preset in a pipeline:');
console.log('1. Getting parameters for "spectral-flux" preset');
const spectralFluxParams = presetLibrary.getPresetParameters('spectral-flux');

console.log('2. Creating a pipeline with these parameters');
try {
    const pipeline = new IntegratedPipeline({
        params: spectralFluxParams
    });

    console.log('3. Pipeline created successfully with preset parameters');
    console.log('   Ready to process audio with the "spectral-flux" characteristics');
} catch (error) {
    console.log(`Error creating pipeline: ${error.message}`);
}
console.log();

// Demonstrate theoretical framework presets
console.log('Theoretical Framework Presets:');
console.log('1. Denis Smalley\'s Spectromorphology:');
const smalleyInfo = presetLibrary.getPresetInfo('smalley-spectromorphology');
console.log(`   Description: ${smalleyInfo.description}`);
console.log(`   Musical Style: ${smalleyInfo.musicalStyle}`);
console.log(`   Concepts: ${Object.keys(smalleyInfo.concepts).join(', ')}`);
console.log();

console.log('2. Curtis Roads\' Granular Synthesis:');
const roadsInfo = presetLibrary.getPresetInfo('roads-granular');
console.log(`   Description: ${roadsInfo.description}`);
console.log(`   Musical Style: ${roadsInfo.musicalStyle}`);
console.log(`   Concepts: ${Object.keys(roadsInfo.concepts).join(', ')}`);
console.log();

console.log('3. Simon Emmerson\'s Language Grid:');
const emmersonInfo = presetLibrary.getPresetInfo('emmerson-language');
console.log(`   Description: ${emmersonInfo.description}`);
console.log(`   Musical Style: ${emmersonInfo.musicalStyle}`);
console.log(`   Concepts: ${Object.keys(emmersonInfo.concepts).join(', ')}`);
console.log();

// Demonstrate comparing presets
console.log('Comparing Musical Characteristics Across Presets:');
const presetComparison = [
    'crystalline',
    'textural-clouds',
    'rhythmic-chaos',
    'harmonic-fields'
].map(presetName => {
    const info = presetLibrary.getPresetInfo(presetName);
    const params = presetLibrary.getPresetParameters(presetName);

    // Extract key characteristics for comparison
    return {
        name: presetName,
        description: info.description,
        style: info.musicalStyle,
        harmonicDensity: info.concepts['harmonic density'] || 'N/A',
        texturalComplexity: info.concepts['textural complexity'] || 'N/A',
        spectralMotion: info.concepts['spectral motion'] || 'N/A',
        grainDensity: info.concepts['grain density'] || 'N/A',
        // Extract a few key parameters
        spatialDensity: params.spatial?.density || 'N/A',
        stochasticVariance: params.stochastic?.variance || 'N/A',
        cellularRule: params.cellular?.rule || 'N/A'
    };
});

// Display comparison table
console.log('Preset Comparison:');
console.log('--------------------------------------------------');
console.log('Preset Name      | Harmonic | Textural | Grain    | Spatial  | Stochastic');
console.log('                 | Density  | Complex  | Density  | Density  | Variance');
console.log('--------------------------------------------------');
presetComparison.forEach(preset => {
    console.log(
        `${preset.name.padEnd(16)} | ` +
        `${(preset.harmonicDensity !== 'N/A' ? preset.harmonicDensity.toFixed(2) : 'N/A').padEnd(8)} | ` +
        `${(preset.texturalComplexity !== 'N/A' ? preset.texturalComplexity.toFixed(2) : 'N/A').padEnd(8)} | ` +
        `${(preset.grainDensity !== 'N/A' ? preset.grainDensity.toFixed(2) : 'N/A').padEnd(8)} | ` +
        `${(preset.spatialDensity !== 'N/A' ? preset.spatialDensity.toFixed(2) : 'N/A').padEnd(8)} | ` +
        `${(preset.stochasticVariance !== 'N/A' ? preset.stochasticVariance.toFixed(2) : 'N/A').padEnd(8)}`
    );
});
console.log('--------------------------------------------------');
