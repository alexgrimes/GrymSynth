import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the visualization state
interface Pattern {
  id: string;
  frequencyRange: {
    low: number;
    high: number;
  };
  confidence: number;
  timestamp: number;
}

interface XenakisLDMPoint {
  x: number;
  z: number;
  intensity: number;
  musicalConcept: 'rhythm' | 'harmony' | 'timbre' | 'other';
}

interface XenakisLDMField {
  points: XenakisLDMPoint[];
  gravitationalStrength: number;
  spatialDensity: number;
}

interface VisualizationState {
  frequencyData: number[];
  selectedFrequency: number | null;
  viewPreset: 'top' | 'front' | 'side' | 'corner';
  patterns: Pattern[];
  xenakisLDMField: XenakisLDMField | null;
  showPatterns: boolean;
  showXenakisLDM: boolean;
  performanceMetrics: {
    fps: number;
    memoryUsage: number;
    processingLatency: number;
  };
}

// Initial state
const initialState: VisualizationState = {
  frequencyData: Array(128).fill(0),
  selectedFrequency: null,
  viewPreset: 'corner',
  patterns: [],
  xenakisLDMField: null,
  showPatterns: true,
  showXenakisLDM: true,
  performanceMetrics: {
    fps: 60,
    memoryUsage: 0,
    processingLatency: 0,
  },
};

// Create the slice
const visualizationSlice = createSlice({
  name: 'visualization',
  initialState,
  reducers: {
    // Update frequency data from audio analysis
    updateFrequencyData: (state, action: PayloadAction<number[]>) => {
      state.frequencyData = action.payload;
    },

    // Set selected frequency
    setSelectedFrequency: (state, action: PayloadAction<number | null>) => {
      state.selectedFrequency = action.payload;
    },

    // Set view preset
    setViewPreset: (state, action: PayloadAction<'top' | 'front' | 'side' | 'corner'>) => {
      state.viewPreset = action.payload;
    },

    // Update detected patterns
    updatePatterns: (state, action: PayloadAction<Pattern[]>) => {
      state.patterns = action.payload;
    },

    // Set XenakisLDM field data
    setXenakisLDMField: (state, action: PayloadAction<XenakisLDMField>) => {
      state.xenakisLDMField = action.payload;
    },

    // Toggle pattern visualization
    togglePatternVisualization: (state) => {
      state.showPatterns = !state.showPatterns;
    },

    // Toggle XenakisLDM visualization
    toggleXenakisLDMVisualization: (state) => {
      state.showXenakisLDM = !state.showXenakisLDM;
    },

    // Update performance metrics
    updatePerformanceMetrics: (state, action: PayloadAction<{
      fps?: number;
      memoryUsage?: number;
      processingLatency?: number;
    }>) => {
      state.performanceMetrics = {
        ...state.performanceMetrics,
        ...action.payload,
      };
    },
  },
});

// Export actions and reducer
export const {
  updateFrequencyData,
  setSelectedFrequency,
  setViewPreset,
  updatePatterns,
  setXenakisLDMField,
  togglePatternVisualization,
  toggleXenakisLDMVisualization,
  updatePerformanceMetrics,
} = visualizationSlice.actions;

export default visualizationSlice.reducer;

// Export types for use in other files
export type { Pattern, XenakisLDMField, XenakisLDMPoint };
