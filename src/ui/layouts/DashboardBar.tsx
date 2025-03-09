import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../ui/state/store';
import { PerformanceMetricsDisplay } from '../components/visualization';

const DashboardBar: React.FC = () => {
  // Get state from Redux
  const processingStatus = useSelector((state: RootState) => state.audioProcessing.processing.status);
  const orchestrationLevel = useSelector((state: RootState) => state.controls.systemControl.orchestrationLevel);
  const memoryAllocation = useSelector((state: RootState) => state.controls.systemControl.memoryAllocation);
  const patternCount = useSelector((state: RootState) => state.audioProcessing.patternRecognition.patternCount);

  // Get current time
  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Format time as HH:MM:SS
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      {/* Left Section - Logo and Title */}
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Audio Learning Hub</h1>
          <p className="text-xs text-gray-400">3D Spectral Visualization</p>
        </div>
      </div>

      {/* Center Section - System Status */}
      <div className="flex space-x-4">
        {/* Processing Status */}
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            processingStatus === 'processing' ? 'bg-green-500' :
            processingStatus === 'paused' ? 'bg-yellow-500' :
            processingStatus === 'error' ? 'bg-red-500' :
            'bg-gray-500'
          }`}></div>
          <span className="text-sm text-gray-300 capitalize">{processingStatus}</span>
        </div>

        {/* Orchestration Level */}
        <div className="flex items-center">
          <span className="text-xs text-gray-400 mr-2">Orchestration:</span>
          <span className="text-sm text-gray-300 capitalize">{orchestrationLevel}</span>
        </div>

        {/* Memory Allocation */}
        <div className="flex items-center">
          <span className="text-xs text-gray-400 mr-2">Memory:</span>
          <span className="text-sm text-gray-300">{memoryAllocation} MB</span>
        </div>

        {/* Pattern Count */}
        <div className="flex items-center">
          <span className="text-xs text-gray-400 mr-2">Patterns:</span>
          <span className="text-sm text-gray-300">{patternCount}</span>
        </div>
      </div>

      {/* Right Section - Performance Metrics and Time */}
      <div className="flex items-center space-x-4">
        {/* Performance Metrics Mini Display */}
        <div className="w-48 h-12">
          <PerformanceMetricsDisplay width={192} height={48} />
        </div>

        {/* Current Time */}
        <div className="text-lg font-mono text-gray-300">
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default DashboardBar;
