import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

// Define types for URL processing state
export enum URLProcessingStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum StreamingStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  BUFFERING = 'buffering',
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export interface URLHistoryEntry {
  url: string;
  timestamp: number;
  status: 'success' | 'error';
  error?: string;
  metadata?: {
    audio?: {
      format?: string;
      duration?: number;
      bitrate?: number;
      channels?: number;
      sampleRate?: number;
    };
    content?: {
      title?: string;
      description?: string;
      author?: string;
    };
    social?: {
      platform?: string;
      likes?: number;
      views?: number;
    };
  };
}

export interface StreamingSession {
  id: string;
  url: string;
  startedAt: number;
  status: StreamingStatus;
  currentTime?: number;
  duration?: number;
  bufferLevel?: number;
  error?: string;
}

export interface URLProcessingState {
  status: URLProcessingStatus;
  error: string | null;
  currentUrl: string | null;
  normalizedUrl: string | null;
  isStreaming: boolean;
  securityStatus: 'safe' | 'suspicious' | 'malicious' | 'unknown' | null;
  metadata: Record<string, any> | null;
  processingTime: number | null;

  // History
  history: URLHistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;

  // Streaming
  streamingStatus: StreamingStatus;
  currentStreamingSession: StreamingSession | null;
  currentTime: number | null;
  duration: number | null;
  bufferLevel: number | null;
  volume: number;
  muted: boolean;
}

// Initial state
const initialState: URLProcessingState = {
  status: URLProcessingStatus.IDLE,
  error: null,
  currentUrl: null,
  normalizedUrl: null,
  isStreaming: false,
  securityStatus: null,
  metadata: null,
  processingTime: null,

  // History
  history: [],
  historyLoading: false,
  historyError: null,

  // Streaming
  streamingStatus: StreamingStatus.IDLE,
  currentStreamingSession: null,
  currentTime: null,
  duration: null,
  bufferLevel: null,
  volume: 1.0,
  muted: false
};

// Async thunks
export const submitURL = createAsyncThunk(
  'urlProcessing/submitURL',
  async (url: string, { rejectWithValue }) => {
    try {
      // In a real implementation, this would call the URL processor service
      // For this example, we'll simulate a response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demonstration, we'll return different results based on the URL
      const urlLower = url.toLowerCase();

      if (urlLower.includes('error')) {
        throw new Error('Failed to process URL');
      }

      const isStreaming =
        urlLower.includes('youtube.com') ||
        urlLower.includes('soundcloud.com') ||
        urlLower.includes('spotify.com');

      let securityStatus: 'safe' | 'suspicious' | 'malicious' | 'unknown' = 'safe';

      if (urlLower.includes('malware') || urlLower.includes('phishing')) {
        securityStatus = 'malicious';
      } else if (urlLower.includes('suspicious')) {
        securityStatus = 'suspicious';
      }

      // Generate metadata based on URL
      const metadata: Record<string, any> = {
        audio: {
          format: urlLower.includes('mp3') ? 'mp3' : 'aac',
          duration: 240, // 4 minutes
          bitrate: 128,
          channels: 2
        },
        content: {
          title: `Audio from ${new URL(url).hostname}`,
          description: 'Audio content description would appear here'
        }
      };

      return {
        url,
        normalizedUrl: url,
        isStreaming,
        securityStatus,
        metadata,
        processingTime: 1200 // 1.2 seconds
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const fetchURLHistory = createAsyncThunk(
  'urlProcessing/fetchURLHistory',
  async (limit: number = 10, { rejectWithValue }) => {
    try {
      // In a real implementation, this would call the URL history manager service
      // For this example, we'll simulate a response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate sample history entries
      const history: URLHistoryEntry[] = [
        {
          url: 'https://example.com/audio/sample1.mp3',
          timestamp: Date.now() - 3600000, // 1 hour ago
          status: 'success',
          metadata: {
            audio: {
              format: 'mp3',
              duration: 180,
              bitrate: 128
            },
            content: {
              title: 'Sample Audio 1'
            }
          }
        },
        {
          url: 'https://soundcloud.com/artist/track',
          timestamp: Date.now() - 86400000, // 1 day ago
          status: 'success',
          metadata: {
            audio: {
              format: 'mp3',
              duration: 240,
              bitrate: 192
            },
            content: {
              title: 'SoundCloud Track'
            },
            social: {
              platform: 'soundcloud',
              likes: 1200,
              views: 5000
            }
          }
        },
        {
          url: 'https://example.com/error-url',
          timestamp: Date.now() - 172800000, // 2 days ago
          status: 'error',
          error: 'Failed to process URL'
        }
      ];

      return history.slice(0, limit);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const prepareStreaming = createAsyncThunk(
  'urlProcessing/prepareStreaming',
  async (url: string, { rejectWithValue }) => {
    try {
      // In a real implementation, this would call the URL streaming manager service
      // For this example, we'll simulate a response

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate a streaming session
      const session: StreamingSession = {
        id: `stream-${Date.now()}`,
        url,
        startedAt: Date.now(),
        status: StreamingStatus.PAUSED,
        currentTime: 0,
        duration: 240, // 4 minutes
        bufferLevel: 30 // 30 seconds buffered
      };

      return session;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Create the slice
const urlProcessingSlice = createSlice({
  name: 'urlProcessing',
  initialState,
  reducers: {
    clearURLError: (state) => {
      state.error = null;
    },

    selectURL: (state, action: PayloadAction<string>) => {
      state.currentUrl = action.payload;
      state.status = URLProcessingStatus.IDLE;
      state.error = null;
    },

    clearURLHistory: (state) => {
      state.history = [];
    },

    // Streaming controls
    startStreaming: (state) => {
      if (state.currentStreamingSession) {
        state.streamingStatus = StreamingStatus.BUFFERING;

        // In a real implementation, this would be updated by the streaming service
        // For this example, we'll simulate the state change
        state.currentStreamingSession.status = StreamingStatus.PLAYING;
        state.streamingStatus = StreamingStatus.PLAYING;
      }
    },

    pauseStreaming: (state) => {
      if (state.currentStreamingSession && state.streamingStatus === StreamingStatus.PLAYING) {
        state.currentStreamingSession.status = StreamingStatus.PAUSED;
        state.streamingStatus = StreamingStatus.PAUSED;
      }
    },

    stopStreaming: (state) => {
      if (state.currentStreamingSession) {
        state.currentStreamingSession.status = StreamingStatus.STOPPED;
        state.streamingStatus = StreamingStatus.STOPPED;
        state.currentStreamingSession = null;
        state.currentTime = null;
        state.duration = null;
        state.bufferLevel = null;
      }
    },

    seekToPosition: (state, action: PayloadAction<number>) => {
      if (state.currentStreamingSession && state.duration) {
        const position = Math.max(0, Math.min(action.payload, state.duration));
        state.currentTime = position;

        if (state.currentStreamingSession.status === StreamingStatus.PLAYING) {
          state.streamingStatus = StreamingStatus.BUFFERING;

          // In a real implementation, this would be updated by the streaming service
          // For this example, we'll simulate the state change after a delay
          setTimeout(() => {
            // Note: This won't actually update the state since it's outside the reducer
            // In a real implementation, this would be handled by the streaming service
            // and would dispatch an action to update the state
          }, 500);
        }
      }
    },

    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = Math.max(0, Math.min(action.payload, 1));
      if (state.volume > 0) {
        state.muted = false;
      }
    },

    toggleMute: (state) => {
      state.muted = !state.muted;
    },

    // These would be dispatched by the streaming service in a real implementation
    updateCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },

    updateBufferLevel: (state, action: PayloadAction<number>) => {
      state.bufferLevel = action.payload;
    },

    setStreamingError: (state, action: PayloadAction<string>) => {
      if (state.currentStreamingSession) {
        state.currentStreamingSession.status = StreamingStatus.ERROR;
        state.currentStreamingSession.error = action.payload;
        state.streamingStatus = StreamingStatus.ERROR;
      }
    }
  },
  extraReducers: (builder) => {
    // Handle submitURL
    builder
      .addCase(submitURL.pending, (state) => {
        state.status = URLProcessingStatus.PROCESSING;
        state.error = null;
      })
      .addCase(submitURL.fulfilled, (state, action) => {
        state.status = URLProcessingStatus.SUCCESS;
        state.currentUrl = action.payload.url;
        state.normalizedUrl = action.payload.normalizedUrl;
        state.isStreaming = action.payload.isStreaming;
        state.securityStatus = action.payload.securityStatus;
        state.metadata = action.payload.metadata;
        state.processingTime = action.payload.processingTime;

        // Add to history
        state.history.unshift({
          url: action.payload.url,
          timestamp: Date.now(),
          status: 'success',
          metadata: action.payload.metadata
        });

        // Trim history if it exceeds 100 entries
        if (state.history.length > 100) {
          state.history = state.history.slice(0, 100);
        }
      })
      .addCase(submitURL.rejected, (state, action) => {
        state.status = URLProcessingStatus.ERROR;
        state.error = action.payload as string || 'Failed to process URL';

        // Add to history
        if (state.currentUrl) {
          state.history.unshift({
            url: state.currentUrl,
            timestamp: Date.now(),
            status: 'error',
            error: state.error
          });

          // Trim history if it exceeds 100 entries
          if (state.history.length > 100) {
            state.history = state.history.slice(0, 100);
          }
        }
      });

    // Handle fetchURLHistory
    builder
      .addCase(fetchURLHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchURLHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchURLHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload as string || 'Failed to fetch URL history';
      });

    // Handle prepareStreaming
    builder
      .addCase(prepareStreaming.pending, (state) => {
        state.streamingStatus = StreamingStatus.INITIALIZING;
      })
      .addCase(prepareStreaming.fulfilled, (state, action) => {
        state.currentStreamingSession = action.payload;
        state.streamingStatus = action.payload.status;
        state.currentTime = action.payload.currentTime !== undefined ? action.payload.currentTime : null;
        state.duration = action.payload.duration !== undefined ? action.payload.duration : null;
        state.bufferLevel = action.payload.bufferLevel !== undefined ? action.payload.bufferLevel : null;
      })
      .addCase(prepareStreaming.rejected, (state, action) => {
        state.streamingStatus = StreamingStatus.ERROR;
        state.error = action.payload as string || 'Failed to prepare streaming';
      });
  }
});

// Export actions and reducer
export const {
  clearURLError,
  selectURL,
  clearURLHistory,
  startStreaming,
  pauseStreaming,
  stopStreaming,
  seekToPosition,
  setVolume,
  toggleMute,
  updateCurrentTime,
  updateBufferLevel,
  setStreamingError
} = urlProcessingSlice.actions;

export default urlProcessingSlice.reducer;
