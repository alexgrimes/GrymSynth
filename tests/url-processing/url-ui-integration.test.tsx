import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { URLInputForm } from '../../src/ui/components/url/URLInputForm';
import { URLHistoryList } from '../../src/ui/components/url/URLHistoryList';
import { URLStatusIndicator } from '../../src/ui/components/url/URLStatusIndicator';
import { StreamControls } from '../../src/ui/components/url/StreamControls';
import {
  URLProcessingStatus,
  StreamingStatus,
  submitURL,
  fetchURLHistory,
  clearURLHistory,
  startStreaming,
  pauseStreaming,
  stopStreaming
} from '../../src/ui/state/urlProcessingSlice';

// Create mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock actions
jest.mock('../../src/ui/state/urlProcessingSlice', () => ({
  URLProcessingStatus: {
    IDLE: 'idle',
    PROCESSING: 'processing',
    SUCCESS: 'success',
    ERROR: 'error'
  },
  StreamingStatus: {
    IDLE: 'idle',
    INITIALIZING: 'initializing',
    BUFFERING: 'buffering',
    PLAYING: 'playing',
    PAUSED: 'paused',
    STOPPED: 'stopped',
    ERROR: 'error'
  },
  submitURL: jest.fn(() => ({ type: 'urlProcessing/submitURL' })),
  fetchURLHistory: jest.fn(() => ({ type: 'urlProcessing/fetchURLHistory' })),
  clearURLHistory: jest.fn(() => ({ type: 'urlProcessing/clearURLHistory' })),
  clearURLError: jest.fn(() => ({ type: 'urlProcessing/clearURLError' })),
  selectURL: jest.fn(() => ({ type: 'urlProcessing/selectURL' })),
  startStreaming: jest.fn(() => ({ type: 'urlProcessing/startStreaming' })),
  pauseStreaming: jest.fn(() => ({ type: 'urlProcessing/pauseStreaming' })),
  stopStreaming: jest.fn(() => ({ type: 'urlProcessing/stopStreaming' })),
  seekToPosition: jest.fn(() => ({ type: 'urlProcessing/seekToPosition' })),
  setVolume: jest.fn(() => ({ type: 'urlProcessing/setVolume' })),
  toggleMute: jest.fn(() => ({ type: 'urlProcessing/toggleMute' }))
}));

describe('URL UI Components Integration', () => {
  let store: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('URLInputForm', () => {
    beforeEach(() => {
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.IDLE,
          error: null,
          currentUrl: null
        }
      });
    });

    test('should render input form', () => {
      render(
        <Provider store={store}>
          <URLInputForm />
        </Provider>
      );

      expect(screen.getByPlaceholderText('Enter audio URL...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /process/i })).toBeInTheDocument();
    });

    test('should validate URL as user types', () => {
      render(
        <Provider store={store}>
          <URLInputForm />
        </Provider>
      );

      const input = screen.getByPlaceholderText('Enter audio URL...');
      const button = screen.getByRole('button', { name: /process/i });

      // Button should be disabled initially
      expect(button).toBeDisabled();

      // Type invalid URL
      fireEvent.change(input, { target: { value: 'not a url' } });
      expect(button).toBeDisabled();

      // Type valid URL
      fireEvent.change(input, { target: { value: 'example.com/audio.mp3' } });
      expect(button).not.toBeDisabled();
    });

    test('should submit URL when form is submitted', () => {
      render(
        <Provider store={store}>
          <URLInputForm />
        </Provider>
      );

      const input = screen.getByPlaceholderText('Enter audio URL...');
      const form = input.closest('form');

      // Type valid URL
      fireEvent.change(input, { target: { value: 'example.com/audio.mp3' } });

      // Submit form
      fireEvent.submit(form!);

      // Check if action was dispatched
      expect(submitURL).toHaveBeenCalledWith('https://example.com/audio.mp3');
    });

    test('should show error message when URL processing fails', () => {
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.ERROR,
          error: 'Failed to process URL',
          currentUrl: 'https://example.com/audio.mp3'
        }
      });

      render(
        <Provider store={store}>
          <URLInputForm />
        </Provider>
      );

      expect(screen.getByText('Failed to process URL')).toBeInTheDocument();
    });

    test('should show processing state', () => {
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.PROCESSING,
          error: null,
          currentUrl: 'https://example.com/audio.mp3'
        }
      });

      render(
        <Provider store={store}>
          <URLInputForm />
        </Provider>
      );

      expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    });
  });

  describe('URLStatusIndicator', () => {
    test('should show success status', () => {
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.SUCCESS,
          currentUrl: 'https://example.com/audio.mp3',
          securityStatus: 'safe',
          metadata: {
            audio: {
              format: 'mp3',
              duration: 180
            },
            content: {
              title: 'Sample Audio'
            }
          },
          processingTime: 1200
        }
      });

      render(
        <Provider store={store}>
          <URLStatusIndicator />
        </Provider>
      );

      expect(screen.getByText(/status: success/i)).toBeInTheDocument();
      expect(screen.getByText(/security: safe/i)).toBeInTheDocument();
      expect(screen.getByText(/url:/i)).toBeInTheDocument();
      expect(screen.getByText(/processing time:/i)).toBeInTheDocument();
      expect(screen.getByText(/format: mp3/i)).toBeInTheDocument();
    });

    test('should show error status', () => {
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.ERROR,
          currentUrl: 'https://example.com/audio.mp3',
          error: 'Failed to process URL',
          securityStatus: null,
          metadata: null,
          processingTime: null
        }
      });

      render(
        <Provider store={store}>
          <URLStatusIndicator />
        </Provider>
      );

      expect(screen.getByText(/status: error/i)).toBeInTheDocument();
    });

    test('should not render when idle with no URL', () => {
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.IDLE,
          currentUrl: null,
          error: null,
          securityStatus: null,
          metadata: null,
          processingTime: null
        }
      });

      const { container } = render(
        <Provider store={store}>
          <URLStatusIndicator />
        </Provider>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('URLHistoryList', () => {
    beforeEach(() => {
      store = mockStore({
        urlProcessing: {
          history: [
            {
              url: 'https://example.com/audio1.mp3',
              timestamp: Date.now() - 3600000, // 1 hour ago
              status: 'success',
              metadata: {
                audio: {
                  format: 'mp3',
                  duration: 180
                },
                content: {
                  title: 'Sample Audio 1'
                }
              }
            },
            {
              url: 'https://example.com/audio2.mp3',
              timestamp: Date.now() - 86400000, // 1 day ago
              status: 'success',
              metadata: {
                audio: {
                  format: 'mp3',
                  duration: 240
                },
                content: {
                  title: 'Sample Audio 2'
                }
              }
            },
            {
              url: 'https://example.com/error.mp3',
              timestamp: Date.now() - 172800000, // 2 days ago
              status: 'error',
              error: 'Failed to process URL'
            }
          ],
          historyLoading: false,
          historyError: null
        }
      });
    });

    test('should fetch history on mount', () => {
      render(
        <Provider store={store}>
          <URLHistoryList maxItems={10} />
        </Provider>
      );

      expect(fetchURLHistory).toHaveBeenCalledWith(10);
    });

    test('should render history items', () => {
      render(
        <Provider store={store}>
          <URLHistoryList />
        </Provider>
      );

      expect(screen.getByText('Sample Audio 1')).toBeInTheDocument();
      expect(screen.getByText('Sample Audio 2')).toBeInTheDocument();
      expect(screen.getByText('example.com/error.mp3')).toBeInTheDocument();

      // Check for status indicators
      expect(screen.getAllByText(/✓ processed/i)).toHaveLength(2);
      expect(screen.getByText(/✗ failed/i)).toBeInTheDocument();
    });

    test('should clear history when clear button is clicked', () => {
      // Mock window.confirm to return true
      window.confirm = jest.fn(() => true);

      render(
        <Provider store={store}>
          <URLHistoryList />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /clear/i }));

      expect(window.confirm).toHaveBeenCalled();
      expect(clearURLHistory).toHaveBeenCalled();
    });

    test('should show loading state', () => {
      store = mockStore({
        urlProcessing: {
          history: [],
          historyLoading: true,
          historyError: null
        }
      });

      render(
        <Provider store={store}>
          <URLHistoryList />
        </Provider>
      );

      expect(screen.getByText(/loading history/i)).toBeInTheDocument();
    });

    test('should show empty state', () => {
      store = mockStore({
        urlProcessing: {
          history: [],
          historyLoading: false,
          historyError: null
        }
      });

      render(
        <Provider store={store}>
          <URLHistoryList />
        </Provider>
      );

      expect(screen.getByText(/no url history/i)).toBeInTheDocument();
    });
  });

  describe('StreamControls', () => {
    beforeEach(() => {
      store = mockStore({
        urlProcessing: {
          streamingStatus: StreamingStatus.PAUSED,
          currentStreamingSession: {
            id: 'test-session',
            url: 'https://example.com/audio.mp3',
            startedAt: Date.now(),
            status: StreamingStatus.PAUSED,
            currentTime: 30,
            duration: 180,
            bufferLevel: 60
          },
          currentTime: 30,
          duration: 180,
          bufferLevel: 60,
          volume: 0.8,
          muted: false
        }
      });
    });

    test('should render play/pause button', () => {
      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    test('should render stop button', () => {
      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    test('should render progress bar', () => {
      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      expect(screen.getByRole('slider', { name: /seek/i })).toBeInTheDocument();
      expect(screen.getByText('0:30')).toBeInTheDocument(); // Current time
      expect(screen.getByText('3:00')).toBeInTheDocument(); // Duration
    });

    test('should render volume control', () => {
      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument();
    });

    test('should start playing when play button is clicked', () => {
      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /play/i }));

      expect(startStreaming).toHaveBeenCalled();
    });

    test('should pause when pause button is clicked', () => {
      // Update store to playing state
      store = mockStore({
        urlProcessing: {
          streamingStatus: StreamingStatus.PLAYING,
          currentStreamingSession: {
            id: 'test-session',
            url: 'https://example.com/audio.mp3',
            startedAt: Date.now(),
            status: StreamingStatus.PLAYING,
            currentTime: 30,
            duration: 180,
            bufferLevel: 60
          },
          currentTime: 30,
          duration: 180,
          bufferLevel: 60,
          volume: 0.8,
          muted: false
        }
      });

      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /pause/i }));

      expect(pauseStreaming).toHaveBeenCalled();
    });

    test('should stop when stop button is clicked', () => {
      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /stop/i }));

      expect(stopStreaming).toHaveBeenCalled();
    });

    test('should render disabled controls when no streaming session', () => {
      store = mockStore({
        urlProcessing: {
          streamingStatus: StreamingStatus.IDLE,
          currentStreamingSession: null,
          currentTime: null,
          duration: null,
          bufferLevel: null,
          volume: 0.8,
          muted: false
        }
      });

      render(
        <Provider store={store}>
          <StreamControls />
        </Provider>
      );

      expect(screen.getByRole('button', { name: /play/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /stop/i })).toBeDisabled();
    });
  });

  describe('Full UI Integration', () => {
    beforeEach(() => {
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.IDLE,
          error: null,
          currentUrl: null,
          normalizedUrl: null,
          isStreaming: false,
          securityStatus: null,
          metadata: null,
          processingTime: null,

          history: [],
          historyLoading: false,
          historyError: null,

          streamingStatus: StreamingStatus.IDLE,
          currentStreamingSession: null,
          currentTime: null,
          duration: null,
          bufferLevel: null,
          volume: 1.0,
          muted: false
        }
      });
    });

    test('should render all components together', () => {
      render(
        <Provider store={store}>
          <div>
            <URLInputForm />
            <URLStatusIndicator />
            <URLHistoryList />
            <StreamControls />
          </div>
        </Provider>
      );

      // Input form should be rendered
      expect(screen.getByPlaceholderText('Enter audio URL...')).toBeInTheDocument();

      // Status indicator should not be rendered (idle with no URL)
      expect(screen.queryByText(/status:/i)).not.toBeInTheDocument();

      // History list should show empty state
      expect(screen.getByText(/no url history/i)).toBeInTheDocument();

      // Stream controls should be disabled
      expect(screen.getByRole('button', { name: /play/i })).toBeDisabled();
    });

    test('should simulate full URL processing flow', async () => {
      const { rerender } = render(
        <Provider store={store}>
          <div>
            <URLInputForm />
            <URLStatusIndicator />
            <StreamControls />
          </div>
        </Provider>
      );

      // Enter URL
      const input = screen.getByPlaceholderText('Enter audio URL...');
      fireEvent.change(input, { target: { value: 'example.com/audio.mp3' } });

      // Submit form
      const form = input.closest('form');
      fireEvent.submit(form!);

      // Check if action was dispatched
      expect(submitURL).toHaveBeenCalledWith('https://example.com/audio.mp3');

      // Update store to processing state
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.PROCESSING,
          error: null,
          currentUrl: 'https://example.com/audio.mp3',
          normalizedUrl: null,
          isStreaming: false,
          securityStatus: null,
          metadata: null,
          processingTime: null,

          history: [],
          historyLoading: false,
          historyError: null,

          streamingStatus: StreamingStatus.IDLE,
          currentStreamingSession: null,
          currentTime: null,
          duration: null,
          bufferLevel: null,
          volume: 1.0,
          muted: false
        }
      });

      rerender(
        <Provider store={store}>
          <div>
            <URLInputForm />
            <URLStatusIndicator />
            <StreamControls />
          </div>
        </Provider>
      );

      // Check processing state
      expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
      expect(screen.getByText(/status: processing/i)).toBeInTheDocument();

      // Update store to success state with streaming
      store = mockStore({
        urlProcessing: {
          status: URLProcessingStatus.SUCCESS,
          error: null,
          currentUrl: 'https://example.com/audio.mp3',
          normalizedUrl: 'https://example.com/audio.mp3',
          isStreaming: true,
          securityStatus: 'safe',
          metadata: {
            audio: {
              format: 'mp3',
              duration: 180
            },
            content: {
              title: 'Sample Audio'
            }
          },
          processingTime: 1200,

          history: [
            {
              url: 'https://example.com/audio.mp3',
              timestamp: Date.now(),
              status: 'success',
              metadata: {
                audio: {
                  format: 'mp3',
                  duration: 180
                },
                content: {
                  title: 'Sample Audio'
                }
              }
            }
          ],
          historyLoading: false,
          historyError: null,

          streamingStatus: StreamingStatus.PAUSED,
          currentStreamingSession: {
            id: 'test-session',
            url: 'https://example.com/audio.mp3',
            startedAt: Date.now(),
            status: StreamingStatus.PAUSED,
            currentTime: 0,
            duration: 180,
            bufferLevel: 30
          },
          currentTime: 0,
          duration: 180,
          bufferLevel: 30,
          volume: 1.0,
          muted: false
        }
      });

      rerender(
        <Provider store={store}>
          <div>
            <URLInputForm />
            <URLStatusIndicator />
            <StreamControls />
          </div>
        </Provider>
      );

      // Check success state
      expect(screen.getByText(/status: success/i)).toBeInTheDocument();
      expect(screen.getByText(/security: safe/i)).toBeInTheDocument();
      expect(screen.getByText(/sample audio/i)).toBeInTheDocument();

      // Check streaming controls are enabled
      expect(screen.getByRole('button', { name: /play/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /stop/i })).not.toBeDisabled();

      // Start playing
      fireEvent.click(screen.getByRole('button', { name: /play/i }));
      expect(startStreaming).toHaveBeenCalled();
    });
  });
});
