import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../ui/state/store';
import {
  setSpatialDensity,
  setGravitationalStrength,
  toggleMusicalConceptMapping,
  setInteractionMode
} from '../../../ui/state/controlsSlice';

interface XenakisLDMPanelProps {
  className?: string;
}

const XenakisLDMPanel: React.FC<XenakisLDMPanelProps> = ({
  className = '',
}) => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    spatialDensity,
    gravitationalStrength,
    musicalConceptMapping,
    interactionMode
  } = useSelector((state: RootState) => state.controls.xenakisLDM);

  // Handle spatial density change
  const handleSpatialDensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(setSpatialDensity(value));
  };

  // Handle gravitational strength change
  const handleGravitationalStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    dispatch(setGravitationalStrength(value));
  };

  // Handle musical concept mapping toggle
  const handleConceptMappingToggle = (concept: 'rhythm' | 'harmony' | 'timbre') => {
    dispatch(toggleMusicalConceptMapping(concept));
  };

  // Handle interaction mode change
  const handleInteractionModeChange = (mode: 'observe' | 'interact' | 'compose') => {
    dispatch(setInteractionMode(mode));
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-4">XenakisLDM Control</h2>

      {/* Spatial Density Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Spatial Density: {spatialDensity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={spatialDensity}
          onChange={handleSpatialDensityChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Sparse</span>
          <span>Dense</span>
        </div>
      </div>

      {/* Gravitational Strength Slider */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Gravitational Strength: {gravitationalStrength.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={gravitationalStrength}
          onChange={handleGravitationalStrengthChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Weak</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Musical Concept Mapping */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Musical Concept Mapping
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => handleConceptMappingToggle('rhythm')}
            className={`px-3 py-2 text-sm rounded-md flex items-center justify-center cursor-pointer ${
              musicalConceptMapping.rhythm
                ? 'bg-red-900 text-red-200'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              musicalConceptMapping.rhythm ? 'bg-red-400' : 'bg-gray-500'
            }`}></div>
            Rhythm
          </div>
          <div
            onClick={() => handleConceptMappingToggle('harmony')}
            className={`px-3 py-2 text-sm rounded-md flex items-center justify-center cursor-pointer ${
              musicalConceptMapping.harmony
                ? 'bg-blue-900 text-blue-200'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              musicalConceptMapping.harmony ? 'bg-blue-400' : 'bg-gray-500'
            }`}></div>
            Harmony
          </div>
          <div
            onClick={() => handleConceptMappingToggle('timbre')}
            className={`px-3 py-2 text-sm rounded-md flex items-center justify-center cursor-pointer ${
              musicalConceptMapping.timbre
                ? 'bg-purple-900 text-purple-200'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              musicalConceptMapping.timbre ? 'bg-purple-400' : 'bg-gray-500'
            }`}></div>
            Timbre
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Enable/disable mapping of musical concepts to the gravitational field
        </p>
      </div>

      {/* Interaction Mode */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Interaction Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleInteractionModeChange('observe')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              interactionMode === 'observe'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Observe
          </button>
          <button
            onClick={() => handleInteractionModeChange('interact')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              interactionMode === 'interact'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Interact
          </button>
          <button
            onClick={() => handleInteractionModeChange('compose')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              interactionMode === 'compose'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Compose
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {interactionMode === 'observe' && 'Passively observe the gravitational field visualization'}
          {interactionMode === 'interact' && 'Interact with the field by adding/modifying points'}
          {interactionMode === 'compose' && 'Create musical structures using the gravitational field'}
        </p>
      </div>

      {/* XenakisLDM Information */}
      <div className="mt-4 p-3 bg-gray-700 rounded-md">
        <h3 className="text-sm font-medium text-white mb-2">About XenakisLDM</h3>
        <p className="text-xs text-gray-300 mb-2">
          XenakisLDM (Xenakis Latent Dynamics Model) is inspired by composer Iannis Xenakis's
          stochastic music techniques, using gravitational fields to model musical structures.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-gray-800 p-2 rounded">
            <h4 className="text-xs font-medium text-gray-300">Spatial Parameters</h4>
            <ul className="text-xs text-gray-400 mt-1 list-disc pl-4">
              <li>Density: {spatialDensity < 0.3 ? 'Low' : spatialDensity < 0.7 ? 'Medium' : 'High'}</li>
              <li>Gravity: {gravitationalStrength < 0.3 ? 'Weak' : gravitationalStrength < 0.7 ? 'Medium' : 'Strong'}</li>
            </ul>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <h4 className="text-xs font-medium text-gray-300">Active Concepts</h4>
            <ul className="text-xs text-gray-400 mt-1 list-disc pl-4">
              {musicalConceptMapping.rhythm && <li>Rhythm</li>}
              {musicalConceptMapping.harmony && <li>Harmony</li>}
              {musicalConceptMapping.timbre && <li>Timbre</li>}
              {!musicalConceptMapping.rhythm && !musicalConceptMapping.harmony && !musicalConceptMapping.timbre &&
                <li>None active</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XenakisLDMPanel;
