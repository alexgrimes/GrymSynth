/**
 * Integration Test for XenakisLDM Mathematical Framework
 *
 * This test verifies the entire pipeline from musical concepts through
 * mathematical frameworks to audio transformation, ensuring all components
 * work together seamlessly.
 */

const {
    MusicalConceptMapper,
    UnifiedParameterSpace,
    MathematicalFrameworkAdapter,
    IntegratedPipeline,
    IntegratedSpectralSieve
} = require('../lib');

// Mock audio data for testing
const createMockAudioData = (length = 1024) => {
    const audioData = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        // Create a simple sine wave
        audioData[i] = Math.sin(2 * Math.PI * i / 32);
    }
    return audioData;
};

// Test the complete pipeline with musical concepts
console.log('=== XENAKISLDM INTEGRATION TEST ===\n');

// Step 1: Create a Musical Concept Mapper
console.log('Step 1: Creating Musical Concept Mapper');
const mapper = new MusicalConceptMapper();
console.log('✓ Musical Concept Mapper created successfully');
console.log(`✓ ${mapper.getAvailableConcepts().length} musical concepts available\n`);

// Step 2: Map musical concepts to parameters
console.log('Step 2: Mapping Musical Concepts to Parameters');
const musicalConcepts = {
    'spectral motion': 0.7,
    'grain density': 0.6,
    'aural mimetic balance': 0.5,
    'harmonic density': 0.8
};
console.log('Musical concepts to map:', Object.keys(musicalConcepts).join(', '));

const mappedParams = mapper.mapMultipleConcepts(musicalConcepts);
console.log('✓ Musical concepts mapped successfully to parameters');
console.log(`✓ Generated ${Object.keys(mappedParams).length} parameter categories\n`);

// Step 3: Validate and normalize parameters
console.log('Step 3: Validating and Normalizing Parameters');
const defaultParams = UnifiedParameterSpace.createDefaultParameters();
const mergedParams = { ...defaultParams };

// Merge mapped parameters with defaults
Object.entries(mappedParams).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
        mergedParams[key] = { ...mergedParams[key], ...value };
    } else {
        mergedParams[key] = value;
    }
});

const validatedParams = UnifiedParameterSpace.validateAndNormalize(mergedParams);
console.log('✓ Parameters validated and normalized successfully');

// Verify key parameters were properly set
const verifyParams = () => {
    let allValid = true;

    // Check if spatial parameters were properly set
    if (!validatedParams.spatial ||
        validatedParams.spatial.density !== mappedParams.spatial?.density) {
        console.log('✗ Spatial parameters not properly set');
        allValid = false;
    }

    // Check if stochastic parameters were properly set
    if (mappedParams.stochastic && (!validatedParams.stochastic ||
        validatedParams.stochastic.distribution?.type !== mappedParams.stochastic?.distribution?.type)) {
        console.log('✗ Stochastic parameters not properly set');
        allValid = false;
    }

    return allValid;
};

if (verifyParams()) {
    console.log('✓ All parameters properly set and validated\n');
} else {
    console.log('✗ Some parameters were not properly set\n');
}

// Step 4: Create Mathematical Framework Adapter
console.log('Step 4: Creating Mathematical Framework Adapter');
const frameworkAdapter = new MathematicalFrameworkAdapter({
    weights: validatedParams.integration?.weights
});
console.log('✓ Mathematical Framework Adapter created successfully\n');

// Step 5: Create Integrated Spectral Sieve
console.log('Step 5: Creating Integrated Spectral Sieve');
const spectralSieve = new IntegratedSpectralSieve({
    frameworkAdapter,
    params: validatedParams
});
console.log('✓ Integrated Spectral Sieve created successfully\n');

// Step 6: Create and configure the Integrated Pipeline
console.log('Step 6: Creating Integrated Pipeline');
const pipeline = new IntegratedPipeline({
    spectralSieve,
    frameworkAdapter,
    params: validatedParams
});
console.log('✓ Integrated Pipeline created successfully\n');

// Step 7: Process audio through the pipeline
console.log('Step 7: Processing Audio through Pipeline');
const inputAudio = createMockAudioData(2048);
console.log(`Input audio created: ${inputAudio.length} samples`);

let outputAudio;
try {
    // Process the audio
    outputAudio = pipeline.process(inputAudio);
    console.log(`✓ Audio processed successfully: ${outputAudio.length} samples`);

    // Verify the output is different from the input (transformation occurred)
    let difference = 0;
    for (let i = 0; i < Math.min(inputAudio.length, outputAudio.length); i++) {
        difference += Math.abs(outputAudio[i] - inputAudio[i]);
    }

    const averageDifference = difference / Math.min(inputAudio.length, outputAudio.length);
    console.log(`✓ Average sample difference: ${averageDifference.toFixed(4)}`);

    if (averageDifference > 0.01) {
        console.log('✓ Significant transformation detected in the audio\n');
    } else {
        console.log('✗ Minimal transformation detected in the audio\n');
    }
} catch (error) {
    console.log(`✗ Error processing audio: ${error.message}\n`);
}

// Step 8: Test different musical concept combinations
console.log('Step 8: Testing Different Musical Concept Combinations');

const testCombinations = [
    {
        name: 'Textural Complexity',
        concepts: {
            'textural complexity': 0.8,
            'grain density': 0.7,
            'spectral space': 0.6
        }
    },
    {
        name: 'Rhythmic Evolution',
        concepts: {
            'rhythmic chaos': 0.7,
            'dynamic evolution': 0.8,
            'grain distribution': 0.6
        }
    },
    {
        name: 'Spectromorphological Focus',
        concepts: {
            'spectral motion': 0.8,
            'gesture texture balance': 0.3,
            'spectral space': 0.7
        }
    }
];

testCombinations.forEach((test, index) => {
    console.log(`\nTesting combination ${index + 1}: ${test.name}`);
    console.log('Concepts:', Object.keys(test.concepts).join(', '));

    // Map concepts to parameters
    const params = mapper.mapMultipleConcepts(test.concepts);

    // Merge with default parameters
    const testParams = { ...defaultParams };
    Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
            testParams[key] = { ...testParams[key], ...value };
        } else {
            testParams[key] = value;
        }
    });

    // Validate parameters
    const validParams = UnifiedParameterSpace.validateAndNormalize(testParams);

    // Create adapter and pipeline
    const adapter = new MathematicalFrameworkAdapter({
        weights: validParams.integration?.weights
    });

    const testPipeline = new IntegratedPipeline({
        spectralSieve: new IntegratedSpectralSieve({
            frameworkAdapter: adapter,
            params: validParams
        }),
        frameworkAdapter: adapter,
        params: validParams
    });

    // Process audio
    try {
        const testOutput = testPipeline.process(inputAudio);
        console.log(`✓ Processed successfully: ${testOutput.length} samples`);

        // Calculate difference from original
        let difference = 0;
        for (let i = 0; i < Math.min(inputAudio.length, testOutput.length); i++) {
            difference += Math.abs(testOutput[i] - inputAudio[i]);
        }

        const avgDiff = difference / Math.min(inputAudio.length, testOutput.length);
        console.log(`✓ Average sample difference: ${avgDiff.toFixed(4)}`);
    } catch (error) {
        console.log(`✗ Error processing audio: ${error.message}`);
    }
});

console.log('\n=== INTEGRATION TEST COMPLETE ===');
