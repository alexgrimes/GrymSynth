import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../ui/state/store';
import {
  setFeatureExtractionLevel,
  setRecognitionSensitivity,
  setTemporalWindowSize,
  setFrequencyResolution,
  toggleFeature
} from '../../../ui/state/controlsSlice';

interface GAMAControlPanelProps {
  className?: string;
}

const GAMAControlPanel: React.FC<GAMAControlPanelProps> = ({
  className = '',
}) => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    featureExtractionLevel,
    recognitionSensitivity,
    temporalWindowSize,
    frequencyResolution,
    enabledFeatures
  } = useSelector((state: RootState) => state.controls.gamaControl);

  // Handle feature extraction level change
  const handleFeatureExtractionLevelChange = (level: 'low' | 'medium' | 'high') => {
    dispatch(setFeatureExtractionLevel(level));
  };

  // Handle recognition sensitivity change
  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(setRecognitionSensitivity(value));
  };

  // Handle temporal window size change
  const handleTemporalWindowSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    dispatch(setTemporalWindowSize(value));
  };

  // Handle frequency resolution change
  const handleFrequencyResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    dispatch(setFrequencyResolution(value));
  };

  // Handle feature toggle
  const handleFeatureToggle = (feature: 'spectral' | 'temporal' | 'harmonic' | 'rhythmic') => {
    dispatch(toggleFeature(feature));
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-4">GAMA Control</h2>

      {/* Feature Extraction Level */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Feature Extraction Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleFeatureExtractionLevelChange('low')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              featureExtractionLevel === 'low'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Low
          </button>
          <button
            onClick={() => handleFeatureExtractionLevelChange('medium')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              featureExtractionLevel === 'medium'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => handleFeatureExtractionLevelChange('high')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              featureExtractionLevel === 'high'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            High
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {featureExtractionLevel === 'low' && 'Faster processing, less detailed analysis'}
          {featureExtractionLevel === 'medium' && 'Balanced performance and detail'}
          {featureExtractionLevel === 'high' && 'Detailed analysis, higher resource usage'}
        </p>
      </div>

      {/* Recognition Sensitivity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Recognition Sensitivity: {recognitionSensitivity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={recognitionSensitivity}
          onChange={handleSensitivityChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Less Sensitive</span>
          <span>More Sensitive</span>
        </div>
      </div>

      {/* Temporal Window Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Temporal Window Size
        </label>
        <select
          value={temporalWindowSize}
          onChange={handleTemporalWindowSizeChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
        >
          <option value="512">512 samples</option>
          <option value="1024">1024 samples</option>
          <option value="2048">2048 samples</option>
          <option value="4096">4096 samples</option>
          <option value="8192">8192 samples</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Larger windows capture more temporal context but require more processing
        </p>
      </div>

      {/* Frequency Resolution */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Frequency Resolution
        </label>
        <select
          value={frequencyResolution}
          onChange={handleFrequencyResolutionChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
        >
          <option value="256">256 bins</option>
          <option value="512">512 bins</option>
          <option value="1024">1024 bins</option>
          <option value="2048">2048 bins</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Higher resolution provides more detailed frequency analysis
        </p>
      </div>

      {/* Enabled Features */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Enabled Features
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div
            onClick={() => handleFeatureToggle('spectral')}
            className={`px-3 py-2 text-sm rounded-md flex items-center cursor-pointer ${
              enabledFeatures.spectral
                ? 'bg-indigo-900 text-indigo-200'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              enabledFeatures.spectral ? 'bg-indigo-400' : 'bg-gray-500'
            }`}></div>
            Spectral
          </div>
          <div
            onClick={() => handleFeatureToggle('temporal')}
            className={`px-3 py-2 text-sm rounded-md flex items-center cursor-pointer ${
              enabledFeatures.temporal
                ? 'bg-blue-900 text-blue-200'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              enabledFeatures.temporal ? 'bg-blue-400' : 'bg-gray-500'
            }`}></div>
            Temporal
          </div>
          <div
            onClick={() => handleFeatureToggle('harmonic')}
            className={`px-3 py-2 text-sm rounded-md flex items-center cursor-pointer ${
              enabledFeatures.harmonic
                ? 'bg-purple-900 text-purple-200'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              enabledFeatures.harmonic ? 'bg-purple-400' : 'bg-gray-500'
            }`}></div>
            Harmonic
          </div>
          <div
            onClick={() => handleFeatureToggle('rhythmic')}
            className={`px-3 py-2 text-sm rounded-md flex items-center cursor-pointer ${
              enabledFeatures.rhythmic
                ? 'bg-green-900 text-green-200'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              enabledFeatures.rhythmic ? 'bg-green-400' : 'bg-gray-500'
            }`}></div>
            Rhythmic
          </div>
        </div>
      </div>

      {/* Feature Explanation */}
      <div className="mt-4 p-3 bg-gray-700 rounded-md">
        <h3 className="text-sm font-medium text-white mb-2">Feature Information</h3>
        <p className="text-xs text-gray-300 mb-2">
          GAMA (Generalized Audio Model Architecture) extracts and analyzes audio features to identify patterns.
        </p>
        <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
          <li>Spectral features analyze frequency distribution</li>
          <li>Temporal features track changes over time</li>
          <li>Harmonic features identify tonal relationships</li>
          <li>Rhythmic features detect timing patterns</li>
        </ul>
      </div>
    </div>
  );
};

export default GAMAControlPanel;
