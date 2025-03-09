import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the audio processing state
interface AudioSource {
  id: string;
  name: string;
  type: 'file' | 'microphone' | 'stream';
  url?: string;
  active: boolean;
}

interface ProcessingState {
  status: 'idle' | 'processing' | 'paused' | 'error';
  error?: string;
  processingLatency: number;
  bufferSize: number;
  sampleRate: number;
}

interface FeatureExtractionState {
  spectralFeatures: boolean;
  temporalFeatures: boolean;
  harmonicFeatures: boolean;
  rhythmicFeatures: boolean;
  extractionQuality: 'low' | 'medium' | 'high';
}

interface PatternRecognitionState {
  enabled: boolean;
  sensitivity: number;
  minPatternLength: number;
  maxPatternLength: number;
  patternCount: number;
  recentPatterns: string[];
}

interface AudioProcessingState {
  sources: AudioSource[];
  currentSourceId: string | null;
  processing: ProcessingState;
  featureExtraction: FeatureExtractionState;
  patternRecognition: PatternRecognitionState;
  audioBuffer: Float32Array | null;
  frequencyData: Float32Array | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
}

// Initial state
const initialState: AudioProcessingState = {
  sources: [],
  currentSourceId: null,
  processing: {
    status: 'idle',
    processingLatency: 0,
    bufferSize: 2048,
    sampleRate: 44100,
  },
  featureExtraction: {
    spectralFeatures: true,
    temporalFeatures: true,
    harmonicFeatures: true,
    rhythmicFeatures: true,
    extractionQuality: 'medium',
  },
  patternRecognition: {
    enabled: true,
    sensitivity: 0.7,
    minPatternLength: 0.5, // in seconds
    maxPatternLength: 10, // in seconds
    patternCount: 0,
    recentPatterns: [],
  },
  audioBuffer: null,
  frequencyData: null,
  isPlaying: false,
  volume: 1.0,
  muted: false,
};

// Create the slice
const audioProcessingSlice = createSlice({
  name: 'audioProcessing',
  initialState,
  reducers: {
    // Audio source management
    addAudioSource: (state, action: PayloadAction<Omit<AudioSource, 'active'>>) => {
      const newSource = { ...action.payload, active: false };
      state.sources.push(newSource);
    },
    removeAudioSource: (state, action: PayloadAction<string>) => {
      state.sources = state.sources.filter(source => source.id !== action.payload);
      if (state.currentSourceId === action.payload) {
        state.currentSourceId = state.sources.length > 0 ? state.sources[0].id : null;
      }
    },
    setCurrentSource: (state, action: PayloadAction<string>) => {
      state.currentSourceId = action.payload;
      // Update active status
      state.sources = state.sources.map(source => ({
        ...source,
        active: source.id === action.payload
      }));
    },

    // Processing state
    setProcessingStatus: (state, action: PayloadAction<'idle' | 'processing' | 'paused' | 'error'>) => {
      state.processing.status = action.payload;
    },
    setProcessingError: (state, action: PayloadAction<string | undefined>) => {
      state.processing.error = action.payload;
    },
    setProcessingLatency: (state, action: PayloadAction<number>) => {
      state.processing.processingLatency = action.payload;
    },
    setBufferSize: (state, action: PayloadAction<number>) => {
      state.processing.bufferSize = action.payload;
    },
    setSampleRate: (state, action: PayloadAction<number>) => {
      state.processing.sampleRate = action.payload;
    },

    // Feature extraction
    toggleFeatureExtraction: (state, action: PayloadAction<'spectralFeatures' | 'temporalFeatures' | 'harmonicFeatures' | 'rhythmicFeatures'>) => {
      const feature = action.payload;
      state.featureExtraction[feature] = !state.featureExtraction[feature];
    },
    setExtractionQuality: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.featureExtraction.extractionQuality = action.payload;
    },

    // Pattern recognition
    togglePatternRecognition: (state) => {
      state.patternRecognition.enabled = !state.patternRecognition.enabled;
    },
    setPatternSensitivity: (state, action: PayloadAction<number>) => {
      state.patternRecognition.sensitivity = action.payload;
    },
    setMinPatternLength: (state, action: PayloadAction<number>) => {
      state.patternRecognition.minPatternLength = action.payload;
    },
    setMaxPatternLength: (state, action: PayloadAction<number>) => {
      state.patternRecognition.maxPatternLength = action.payload;
    },
    incrementPatternCount: (state) => {
      state.patternRecognition.patternCount += 1;
    },
    addRecentPattern: (state, action: PayloadAction<string>) => {
      state.patternRecognition.recentPatterns.unshift(action.payload);
      if (state.patternRecognition.recentPatterns.length > 10) {
        state.patternRecognition.recentPatterns.pop();
      }
    },

    // Audio data
    setAudioBuffer: (state, action: PayloadAction<Float32Array>) => {
      state.audioBuffer = action.payload;
    },
    setFrequencyData: (state, action: PayloadAction<Float32Array>) => {
      state.frequencyData = action.payload;
    },

    // Playback controls
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    toggleMute: (state) => {
      state.muted = !state.muted;
    },
  },
});

// Export actions and reducer
export const {
  // Audio source management
  addAudioSource,
  removeAudioSource,
  setCurrentSource,

  // Processing state
  setProcessingStatus,
  setProcessingError,
  setProcessingLatency,
  setBufferSize,
  setSampleRate,

  // Feature extraction
  toggleFeatureExtraction,
  setExtractionQuality,

  // Pattern recognition
  togglePatternRecognition,
  setPatternSensitivity,
  setMinPatternLength,
  setMaxPatternLength,
  incrementPatternCount,
  addRecentPattern,

  // Audio data
  setAudioBuffer,
  setFrequencyData,

  // Playback controls
  setIsPlaying,
  setVolume,
  toggleMute,
} = audioProcessingSlice.actions;

export default audioProcessingSlice.reducer;

// Export types for use in other files
export type {
  AudioSource,
  ProcessingState,
  FeatureExtractionState,
  PatternRecognitionState,
};
