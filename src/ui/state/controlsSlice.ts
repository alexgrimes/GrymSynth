import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the controls state
interface PatternControlState {
  similarityThreshold: number;
  patternBrowserOpen: boolean;
  selectedPatternId: string | null;
  migrationStatus: 'idle' | 'in-progress' | 'completed' | 'failed';
  migrationProgress: number;
}

interface GAMAControlState {
  featureExtractionLevel: 'low' | 'medium' | 'high';
  recognitionSensitivity: number;
  temporalWindowSize: number;
  frequencyResolution: number;
  enabledFeatures: {
    spectral: boolean;
    temporal: boolean;
    harmonic: boolean;
    rhythmic: boolean;
  };
}

interface XenakisLDMState {
  spatialDensity: number;
  gravitationalStrength: number;
  musicalConceptMapping: {
    rhythm: boolean;
    harmony: boolean;
    timbre: boolean;
  };
  interactionMode: 'observe' | 'interact' | 'compose';
}

interface SystemControlState {
  orchestrationLevel: 'minimal' | 'balanced' | 'maximum';
  memoryAllocation: number;
  cachingEnabled: boolean;
  processingThreads: number;
  autoOptimize: boolean;
}

interface ControlsState {
  patternControl: PatternControlState;
  gamaControl: GAMAControlState;
  xenakisLDM: XenakisLDMState;
  systemControl: SystemControlState;
}

// Initial state
const initialState: ControlsState = {
  patternControl: {
    similarityThreshold: 0.75,
    patternBrowserOpen: false,
    selectedPatternId: null,
    migrationStatus: 'idle',
    migrationProgress: 0,
  },
  gamaControl: {
    featureExtractionLevel: 'medium',
    recognitionSensitivity: 0.65,
    temporalWindowSize: 2048,
    frequencyResolution: 1024,
    enabledFeatures: {
      spectral: true,
      temporal: true,
      harmonic: true,
      rhythmic: true,
    },
  },
  xenakisLDM: {
    spatialDensity: 0.5,
    gravitationalStrength: 0.7,
    musicalConceptMapping: {
      rhythm: true,
      harmony: true,
      timbre: true,
    },
    interactionMode: 'observe',
  },
  systemControl: {
    orchestrationLevel: 'balanced',
    memoryAllocation: 512,
    cachingEnabled: true,
    processingThreads: 4,
    autoOptimize: true,
  },
};

// Create the slice
const controlsSlice = createSlice({
  name: 'controls',
  initialState,
  reducers: {
    // Pattern Control actions
    setSimilarityThreshold: (state, action: PayloadAction<number>) => {
      state.patternControl.similarityThreshold = action.payload;
    },
    togglePatternBrowser: (state) => {
      state.patternControl.patternBrowserOpen = !state.patternControl.patternBrowserOpen;
    },
    selectPattern: (state, action: PayloadAction<string | null>) => {
      state.patternControl.selectedPatternId = action.payload;
    },
    setMigrationStatus: (state, action: PayloadAction<'idle' | 'in-progress' | 'completed' | 'failed'>) => {
      state.patternControl.migrationStatus = action.payload;
    },
    updateMigrationProgress: (state, action: PayloadAction<number>) => {
      state.patternControl.migrationProgress = action.payload;
    },

    // GAMA Control actions
    setFeatureExtractionLevel: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.gamaControl.featureExtractionLevel = action.payload;
    },
    setRecognitionSensitivity: (state, action: PayloadAction<number>) => {
      state.gamaControl.recognitionSensitivity = action.payload;
    },
    setTemporalWindowSize: (state, action: PayloadAction<number>) => {
      state.gamaControl.temporalWindowSize = action.payload;
    },
    setFrequencyResolution: (state, action: PayloadAction<number>) => {
      state.gamaControl.frequencyResolution = action.payload;
    },
    toggleFeature: (state, action: PayloadAction<'spectral' | 'temporal' | 'harmonic' | 'rhythmic'>) => {
      const feature = action.payload;
      state.gamaControl.enabledFeatures[feature] = !state.gamaControl.enabledFeatures[feature];
    },

    // XenakisLDM actions
    setSpatialDensity: (state, action: PayloadAction<number>) => {
      state.xenakisLDM.spatialDensity = action.payload;
    },
    setGravitationalStrength: (state, action: PayloadAction<number>) => {
      state.xenakisLDM.gravitationalStrength = action.payload;
    },
    toggleMusicalConceptMapping: (state, action: PayloadAction<'rhythm' | 'harmony' | 'timbre'>) => {
      const concept = action.payload;
      state.xenakisLDM.musicalConceptMapping[concept] = !state.xenakisLDM.musicalConceptMapping[concept];
    },
    setInteractionMode: (state, action: PayloadAction<'observe' | 'interact' | 'compose'>) => {
      state.xenakisLDM.interactionMode = action.payload;
    },

    // System Control actions
    setOrchestrationLevel: (state, action: PayloadAction<'minimal' | 'balanced' | 'maximum'>) => {
      state.systemControl.orchestrationLevel = action.payload;
    },
    setMemoryAllocation: (state, action: PayloadAction<number>) => {
      state.systemControl.memoryAllocation = action.payload;
    },
    toggleCaching: (state) => {
      state.systemControl.cachingEnabled = !state.systemControl.cachingEnabled;
    },
    setProcessingThreads: (state, action: PayloadAction<number>) => {
      state.systemControl.processingThreads = action.payload;
    },
    toggleAutoOptimize: (state) => {
      state.systemControl.autoOptimize = !state.systemControl.autoOptimize;
    },
  },
});

// Export actions and reducer
export const {
  // Pattern Control
  setSimilarityThreshold,
  togglePatternBrowser,
  selectPattern,
  setMigrationStatus,
  updateMigrationProgress,

  // GAMA Control
  setFeatureExtractionLevel,
  setRecognitionSensitivity,
  setTemporalWindowSize,
  setFrequencyResolution,
  toggleFeature,

  // XenakisLDM
  setSpatialDensity,
  setGravitationalStrength,
  toggleMusicalConceptMapping,
  setInteractionMode,

  // System Control
  setOrchestrationLevel,
  setMemoryAllocation,
  toggleCaching,
  setProcessingThreads,
  toggleAutoOptimize,
} = controlsSlice.actions;

export default controlsSlice.reducer;

// Export types for use in other files
export type {
  PatternControlState,
  GAMAControlState,
  XenakisLDMState,
  SystemControlState,
};
