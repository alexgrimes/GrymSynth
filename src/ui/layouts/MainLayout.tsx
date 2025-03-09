import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../ui/state/store';
import DashboardBar from './DashboardBar';
import ChatInterface from './ChatInterface';
import AudioSourcePanel from './AudioSourcePanel';
import { SpectralVisualization3D } from '../components/visualization';
import {
  PatternControlPanel,
  GAMAControlPanel,
  XenakisLDMPanel,
  SystemControlPanel
} from '../components/controls';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Get state from Redux
  const isPlaying = useSelector((state: RootState) => state.audioProcessing.isPlaying);
  const selectedPatternId = useSelector((state: RootState) => state.controls.patternControl.selectedPatternId);
  const interactionMode = useSelector((state: RootState) => state.controls.xenakisLDM.interactionMode);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Dashboard Bar */}
      <DashboardBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Audio Source */}
        <div className="w-64 border-r border-gray-800 overflow-y-auto">
          <AudioSourcePanel />
        </div>

        {/* Center Panel - Visualization */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main 3D Visualization */}
          <div className="flex-1 relative">
            <SpectralVisualization3D />

            {/* Status Indicators */}
            <div className="absolute top-4 left-4 flex space-x-2">
              <div className={`px-2 py-1 rounded-full text-xs flex items-center ${
                isPlaying ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  isPlaying ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                {isPlaying ? 'Playing' : 'Stopped'}
              </div>

              {selectedPatternId && (
                <div className="px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-200 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-1 bg-blue-400"></div>
                  Pattern Selected
                </div>
              )}

              <div className="px-2 py-1 rounded-full text-xs bg-purple-900 text-purple-200 flex items-center">
                <div className="w-2 h-2 rounded-full mr-1 bg-purple-400"></div>
                {interactionMode.charAt(0).toUpperCase() + interactionMode.slice(1)} Mode
              </div>
            </div>

            {/* Optional children content */}
            {children}
          </div>

          {/* Bottom Chat Interface */}
          <div className="h-64 border-t border-gray-800">
            <ChatInterface />
          </div>
        </div>

        {/* Right Panel - Controls */}
        <div className="w-80 border-l border-gray-800 overflow-y-auto">
          <div className="p-4 space-y-4">
            <PatternControlPanel />
            <GAMAControlPanel />
            <XenakisLDMPanel />
            <SystemControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
