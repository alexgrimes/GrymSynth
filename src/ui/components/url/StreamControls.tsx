import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import {
  startStreaming,
  pauseStreaming,
  stopStreaming,
  seekToPosition,
  setVolume,
  toggleMute,
  StreamingStatus
} from '../../state/urlProcessingSlice';

interface StreamControlsProps {
  className?: string;
  compact?: boolean;
  showVolumeControl?: boolean;
  showProgressBar?: boolean;
  onPlaybackChange?: (isPlaying: boolean) => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
  className = '',
  compact = false,
  showVolumeControl = true,
  showProgressBar = true,
  onPlaybackChange
}) => {
  const dispatch = useDispatch();
  const {
    currentStreamingSession,
    streamingStatus,
    currentTime,
    duration,
    volume,
    muted,
    bufferLevel
  } = useSelector((state: RootState) => state.urlProcessing);

  const [seeking, setSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  // Update seek position when currentTime changes (if not actively seeking)
  useEffect(() => {
    if (!seeking && currentTime !== undefined) {
      setSeekPosition(currentTime);
    }
  }, [currentTime, seeking]);

  // Notify parent component of playback changes
  useEffect(() => {
    if (onPlaybackChange) {
      onPlaybackChange(streamingStatus === StreamingStatus.PLAYING);
    }
  }, [streamingStatus, onPlaybackChange]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (streamingStatus === StreamingStatus.PLAYING) {
      dispatch(pauseStreaming());
    } else {
      dispatch(startStreaming());
    }
  };

  // Handle stop
  const handleStop = () => {
    dispatch(stopStreaming());
  };

  // Handle seeking
  const handleSeekStart = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekPosition(parseFloat(e.target.value));
  };

  const handleSeekEnd = () => {
    if (duration) {
      dispatch(seekToPosition(seekPosition));
    }
    setSeeking(false);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setVolume(parseFloat(e.target.value)));
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    dispatch(toggleMute());
  };

  // If no streaming session is active, render disabled controls
  if (!currentStreamingSession) {
    return (
      <div className={`stream-controls ${className} opacity-50`}>
        <div className="flex items-center justify-center space-x-4">
          <button
            disabled
            className="p-2 rounded-full bg-gray-200 text-gray-400"
            aria-label="Play"
          >
            ▶️
          </button>
          <button
            disabled
            className="p-2 rounded-full bg-gray-200 text-gray-400"
            aria-label="Stop"
          >
            ⏹️
          </button>
        </div>

        {showProgressBar && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-gray-400">0:00</span>
            <div className="flex-grow h-2 bg-gray-200 rounded-full"></div>
            <span className="text-xs text-gray-400">0:00</span>
          </div>
        )}
      </div>
    );
  }

  // Render active controls
  return (
    <div className={`stream-controls ${className}`}>
      {/* Main controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handlePlayPause}
          className={`p-2 rounded-full ${
            streamingStatus === StreamingStatus.PLAYING
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          aria-label={streamingStatus === StreamingStatus.PLAYING ? 'Pause' : 'Play'}
        >
          {streamingStatus === StreamingStatus.PLAYING ? '⏸️' : '▶️'}
        </button>

        <button
          onClick={handleStop}
          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
          aria-label="Stop"
        >
          ⏹️
        </button>

        {showVolumeControl && !compact && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMuteToggle}
              className="text-gray-700 hover:text-gray-900"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20"
              aria-label="Volume"
            />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {showProgressBar && duration && (
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-xs text-gray-600">
            {formatTime(currentTime || 0)}
          </span>

          <div className="relative flex-grow">
            {/* Buffer indicator */}
            <div
              className="absolute h-2 bg-gray-300 rounded-full"
              style={{ width: `${((bufferLevel || 0) / duration) * 100}%` }}
            ></div>

            {/* Progress bar */}
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={seekPosition}
              onChange={handleSeekChange}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              className="w-full h-2 bg-transparent appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
              aria-label="Seek"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  (seekPosition / duration) * 100
                }%, transparent ${(seekPosition / duration) * 100}%, transparent 100%)`
              }}
            />
          </div>

          <span className="text-xs text-gray-600">{formatTime(duration)}</span>
        </div>
      )}

      {/* Status indicator */}
      {streamingStatus === StreamingStatus.BUFFERING && (
        <div className="text-center text-sm text-blue-500 mt-1">
          Buffering...
        </div>
      )}

      {streamingStatus === StreamingStatus.ERROR && (
        <div className="text-center text-sm text-red-500 mt-1">
          Streaming error
        </div>
      )}
    </div>
  );
};

// Helper function to format time in seconds to mm:ss format
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
