/**
 * XenakisLDM Integrated Mathematical Framework
 *
 * This module exports all components of the integrated mathematical framework
 * for XenakisLDM, including the spatial-spectral sieve, stochastic processes,
 * cellular automata, and game theory.
 */

// Core components
const SpatialSpectralAdapter = require('./spatial-spectral-adapter');
const SpectralPatternStore = require('./spectral-pattern-store');
const SpectralSieve = require('./spectral-sieve');
const SpectralVisualizer = require('./spectral-visualizer');
const SpectralFieldEvolution = require('./spectral-field-evolution');
const Logger = require('./logger');
const ParameterProcessor = require('./parameter-processor');

// Integrated framework components
const MathematicalFrameworkAdapter = require('./mathematical-framework-adapter');
const UnifiedParameterSpace = require('./unified-parameter-space');
const IntegratedSpectralSieve = require('./integrated-spectral-sieve');
const IntegratedPipeline = require('./integrated-pipeline');
const MusicalConceptMapper = require('./musical-concept-mapper');
const ConceptVisualizer = require('./concept-visualizer');
const PresetLibrary = require('./preset-library');
const { PerformanceOptimizer, BufferPool, ParallelProcessor } = require('./performance-optimizer');

// Export all components
module.exports = {
    // Core components
    SpatialSpectralAdapter,
    SpectralPatternStore,
    SpectralSieve,
    SpectralVisualizer,
    SpectralFieldEvolution,
    Logger,
    ParameterProcessor,

    // Integrated framework components
    MathematicalFrameworkAdapter,
    UnifiedParameterSpace,
    IntegratedSpectralSieve,
    IntegratedPipeline,
    MusicalConceptMapper,
    ConceptVisualizer,
    PresetLibrary,
    PerformanceOptimizer,
    BufferPool,
    ParallelProcessor,

    // Version information
    version: '1.0.0',

    // Create a pipeline with default configuration
    createPipeline: (config) => new IntegratedPipeline(config),

    // Create a pipeline with preset parameters
    createPresetPipeline: (presetName, config) => IntegratedPipeline.createPreset(presetName, config),

    // Get available presets
    getAvailablePresets: () => ['harmonic', 'chaotic', 'evolving', 'minimal'],

    // Create default parameters
    createDefaultParameters: () => UnifiedParameterSpace.createDefaultParameters(),

    // Create preset parameters
    createPresetParameters: (presetName) => UnifiedParameterSpace.createPreset(presetName),

    // Create a musical concept mapper
    createMusicalConceptMapper: (config) => new MusicalConceptMapper(config),

    // Get available musical concepts
    getAvailableMusicalConcepts: () => new MusicalConceptMapper().getAvailableConcepts(),

    // Create a concept visualizer
    createConceptVisualizer: (config) => new ConceptVisualizer(config),

    // Create a preset library
    createPresetLibrary: (config) => new PresetLibrary(config),

    // Get available presets
    getAvailablePresets: () => new PresetLibrary().getAvailablePresets(),

    // Create a performance optimizer
    createPerformanceOptimizer: (config) => new PerformanceOptimizer(config)
};
