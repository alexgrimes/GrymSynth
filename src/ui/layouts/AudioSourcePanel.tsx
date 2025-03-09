import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../ui/state/store';
import {
  addAudioSource,
  removeAudioSource,
  setCurrentSource,
  setIsPlaying,
  setVolume,
  toggleMute
} from '../../ui/state/audioProcessingSlice';

const AudioSourcePanel: React.FC = () => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    sources,
    currentSourceId,
    isPlaying,
    volume,
    muted
  } = useSelector((state: RootState) => state.audioProcessing);

  // Local state for file upload
  const [uploadingFile, setUploadingFile] = useState(false);

  // Handle source selection
  const handleSourceSelect = (sourceId: string) => {
    dispatch(setCurrentSource(sourceId));
  };

  // Handle play/pause toggle
  const handlePlayPauseToggle = () => {
    dispatch(setIsPlaying(!isPlaying));
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(setVolume(value));
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    dispatch(toggleMute());
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Simulate file upload
    setUploadingFile(true);

    setTimeout(() => {
      // Add new audio source
      const newSourceId = `file-${Date.now()}`;
      dispatch(addAudioSource({
        id: newSourceId,
        name: file.name,
        type: 'file',
        url: URL.createObjectURL(file)
      }));

      // Select the new source
      dispatch(setCurrentSource(newSourceId));

      setUploadingFile(false);

      // Reset file input
      e.target.value = '';
    }, 1000);
  };

  // Handle source removal
  const handleRemoveSource = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeAudioSource(sourceId));
  };

  // Add microphone source
  const handleAddMicrophone = () => {
    // Check if microphone source already exists
    const micExists = sources.some(source => source.type === 'microphone');

    if (!micExists) {
      const micSourceId = `mic-${Date.now()}`;
      dispatch(addAudioSource({
        id: micSourceId,
        name: 'Microphone',
        type: 'microphone'
      }));

      // Select the new source
      dispatch(setCurrentSource(micSourceId));
    }
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Audio Sources</h2>

        {/* Add Source Buttons */}
        <div className="flex space-x-2 mb-4">
          <label className="flex-1">
            <div className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md text-center cursor-pointer hover:bg-blue-700">
              Upload Audio
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
            </div>
          </label>

          <button
            onClick={handleAddMicrophone}
            className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 flex-1"
          >
            Use Microphone
          </button>
        </div>

        {/* Uploading Indicator */}
        {uploadingFile && (
          <div className="mb-4 bg-gray-800 rounded-md p-2 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-300">Uploading audio file...</span>
          </div>
        )}

        {/* Playback Controls */}
        <div className="mb-4 bg-gray-800 rounded-md p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePlayPauseToggle}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <div className="flex items-center ml-3 flex-1">
              <button
                onClick={handleMuteToggle}
                className="text-gray-400 hover:text-white mr-2"
              >
                {muted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Current Source Info */}
          {currentSourceId && (
            <div className="text-center">
              <p className="text-xs text-gray-400">Now Playing:</p>
              <p className="text-sm text-white font-medium truncate">
                {sources.find(s => s.id === currentSourceId)?.name || 'Unknown Source'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Available Sources</h3>

        {sources.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No audio sources available</p>
        ) : (
          <ul className="space-y-1">
            {sources.map((source) => (
              <li
                key={source.id}
                onClick={() => handleSourceSelect(source.id)}
                className={`px-3 py-2 rounded-md cursor-pointer flex items-center justify-between ${
                  source.id === currentSourceId
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center">
                  {/* Icon based on source type */}
                  {source.type === 'file' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  ) : source.type === 'microphone' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" />
                    </svg>
                  )}

                  <span className="text-sm truncate">{source.name}</span>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => handleRemoveSource(source.id, e)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AudioSourcePanel;
