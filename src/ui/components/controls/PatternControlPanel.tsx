import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../ui/state/store';
import {
  setSimilarityThreshold,
  togglePatternBrowser,
  setMigrationStatus,
  updateMigrationProgress
} from '../../../ui/state/controlsSlice';
import { Pattern } from '../../../ui/state/visualizationSlice';

interface PatternControlPanelProps {
  className?: string;
}

const PatternControlPanel: React.FC<PatternControlPanelProps> = ({
  className = '',
}) => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    similarityThreshold,
    patternBrowserOpen,
    selectedPatternId,
    migrationStatus,
    migrationProgress
  } = useSelector((state: RootState) => state.controls.patternControl);

  const patterns = useSelector((state: RootState) => state.visualization.patterns);

  // Local state for pattern filter
  const [patternFilter, setPatternFilter] = useState('');

  // Handle similarity threshold change
  const handleSimilarityThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(setSimilarityThreshold(value));
  };

  // Handle pattern browser toggle
  const handleTogglePatternBrowser = () => {
    dispatch(togglePatternBrowser());
  };

  // Filter patterns based on search input
  const filteredPatterns = patterns.filter(pattern =>
    pattern.id.toLowerCase().includes(patternFilter.toLowerCase())
  );

  // Simulate pattern migration
  const handleStartMigration = () => {
    dispatch(setMigrationStatus('in-progress'));

    // Simulate migration progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      dispatch(updateMigrationProgress(progress));

      if (progress >= 100) {
        clearInterval(interval);
        dispatch(setMigrationStatus('completed'));

        // Reset after a delay
        setTimeout(() => {
          dispatch(setMigrationStatus('idle'));
          dispatch(updateMigrationProgress(0));
        }, 3000);
      }
    }, 300);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-4">Pattern Control</h2>

      {/* Similarity Threshold Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Similarity Threshold: {similarityThreshold.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={similarityThreshold}
          onChange={handleSimilarityThresholdChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Low Similarity</span>
          <span>High Similarity</span>
        </div>
      </div>

      {/* Pattern Browser Toggle */}
      <div className="mb-4">
        <button
          onClick={handleTogglePatternBrowser}
          className={`px-4 py-2 rounded-md text-sm font-medium w-full ${
            patternBrowserOpen
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          {patternBrowserOpen ? 'Close Pattern Browser' : 'Open Pattern Browser'}
        </button>
      </div>

      {/* Pattern Browser (conditionally rendered) */}
      {patternBrowserOpen && (
        <div className="mb-4 bg-gray-900 rounded-md p-3">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search patterns..."
              value={patternFilter}
              onChange={(e) => setPatternFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filteredPatterns.length > 0 ? (
              <ul className="space-y-1">
                {filteredPatterns.map((pattern) => (
                  <li
                    key={pattern.id}
                    className={`px-2 py-1 text-sm rounded cursor-pointer ${
                      selectedPatternId === pattern.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{pattern.id.substring(0, 8)}...</span>
                      <span className="text-xs opacity-70">
                        {(pattern.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm text-center py-2">
                {patterns.length === 0
                  ? 'No patterns detected yet'
                  : 'No patterns match your search'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Migration Status */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-300">
            Pattern Migration
          </label>
          <span className="text-xs px-2 py-1 rounded-full capitalize" style={{
            backgroundColor:
              migrationStatus === 'completed' ? 'rgba(52, 211, 153, 0.2)' :
              migrationStatus === 'in-progress' ? 'rgba(96, 165, 250, 0.2)' :
              migrationStatus === 'failed' ? 'rgba(239, 68, 68, 0.2)' :
              'rgba(156, 163, 175, 0.2)',
            color:
              migrationStatus === 'completed' ? 'rgb(52, 211, 153)' :
              migrationStatus === 'in-progress' ? 'rgb(96, 165, 250)' :
              migrationStatus === 'failed' ? 'rgb(239, 68, 68)' :
              'rgb(156, 163, 175)'
          }}>
            {migrationStatus}
          </span>
        </div>

        {/* Progress bar */}
        {migrationStatus === 'in-progress' && (
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
            <div
              className="bg-blue-500 h-2.5 rounded-full"
              style={{ width: `${migrationProgress}%` }}
            ></div>
          </div>
        )}

        <button
          onClick={handleStartMigration}
          disabled={migrationStatus === 'in-progress'}
          className={`px-4 py-2 rounded-md text-sm font-medium w-full ${
            migrationStatus === 'in-progress'
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {migrationStatus === 'in-progress'
            ? `Migrating Patterns (${migrationProgress}%)`
            : 'Start Pattern Migration'}
        </button>
      </div>

      {/* Pattern Statistics */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-700 rounded-md p-2">
          <p className="text-xs text-gray-400">Total Patterns</p>
          <p className="text-xl font-semibold text-white">{patterns.length}</p>
        </div>
        <div className="bg-gray-700 rounded-md p-2">
          <p className="text-xs text-gray-400">Avg. Confidence</p>
          <p className="text-xl font-semibold text-white">
            {patterns.length > 0
              ? (
                  patterns.reduce((sum, p) => sum + p.confidence, 0) /
                  patterns.length
                ).toFixed(2)
              : '0.00'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatternControlPanel;
