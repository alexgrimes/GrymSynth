import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../ui/state/store';
import {
  setOrchestrationLevel,
  setMemoryAllocation,
  toggleCaching,
  setProcessingThreads,
  toggleAutoOptimize
} from '../../../ui/state/controlsSlice';

interface SystemControlPanelProps {
  className?: string;
}

const SystemControlPanel: React.FC<SystemControlPanelProps> = ({
  className = '',
}) => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    orchestrationLevel,
    memoryAllocation,
    cachingEnabled,
    processingThreads,
    autoOptimize
  } = useSelector((state: RootState) => state.controls.systemControl);

  // Get performance metrics for system recommendations
  const performanceMetrics = useSelector((state: RootState) => state.visualization.performanceMetrics);
  const processingLatency = useSelector((state: RootState) => state.audioProcessing.processing.processingLatency);

  // Handle orchestration level change
  const handleOrchestrationLevelChange = (level: 'minimal' | 'balanced' | 'maximum') => {
    dispatch(setOrchestrationLevel(level));
  };

  // Handle memory allocation change
  const handleMemoryAllocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    dispatch(setMemoryAllocation(value));
  };

  // Handle caching toggle
  const handleCachingToggle = () => {
    dispatch(toggleCaching());
  };

  // Handle processing threads change
  const handleProcessingThreadsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    dispatch(setProcessingThreads(value));
  };

  // Handle auto optimize toggle
  const handleAutoOptimizeToggle = () => {
    dispatch(toggleAutoOptimize());
  };

  // Calculate system status
  const calculateSystemStatus = () => {
    const fps = performanceMetrics.fps;
    const latency = processingLatency;
    const memoryUsage = performanceMetrics.memoryUsage;

    if (fps < 15 || latency > 100 || memoryUsage > 900) {
      return {
        status: 'critical',
        color: 'red',
        message: 'System resources are critically low'
      };
    } else if (fps < 30 || latency > 50 || memoryUsage > 700) {
      return {
        status: 'warning',
        color: 'yellow',
        message: 'System performance is degraded'
      };
    } else {
      return {
        status: 'optimal',
        color: 'green',
        message: 'System is running optimally'
      };
    }
  };

  const systemStatus = calculateSystemStatus();

  // Generate system recommendations
  const generateRecommendations = () => {
    const recommendations = [];

    if (performanceMetrics.fps < 30 && orchestrationLevel !== 'minimal') {
      recommendations.push('Reduce orchestration level to improve performance');
    }

    if (processingLatency > 50 && processingThreads < 4) {
      recommendations.push('Increase processing threads to reduce latency');
    }

    if (performanceMetrics.memoryUsage > 700 && memoryAllocation > 512) {
      recommendations.push('Reduce memory allocation to prevent memory issues');
    }

    if (performanceMetrics.fps < 30 && !cachingEnabled) {
      recommendations.push('Enable caching to improve performance');
    }

    return recommendations.length > 0 ? recommendations : ['No optimization recommendations at this time'];
  };

  const recommendations = generateRecommendations();

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-4">System Control</h2>

      {/* System Status */}
      <div className="mb-4 p-3 rounded-md" style={{
        backgroundColor:
          systemStatus.status === 'optimal' ? 'rgba(52, 211, 153, 0.2)' :
          systemStatus.status === 'warning' ? 'rgba(251, 191, 36, 0.2)' :
          'rgba(239, 68, 68, 0.2)',
      }}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 bg-${systemStatus.color}-500`}></div>
          <h3 className="text-sm font-medium" style={{
            color:
              systemStatus.status === 'optimal' ? 'rgb(52, 211, 153)' :
              systemStatus.status === 'warning' ? 'rgb(251, 191, 36)' :
              'rgb(239, 68, 68)',
          }}>
            System Status: {systemStatus.status.charAt(0).toUpperCase() + systemStatus.status.slice(1)}
          </h3>
        </div>
        <p className="text-xs text-gray-300 mt-1">{systemStatus.message}</p>
      </div>

      {/* Orchestration Level */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Orchestration Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleOrchestrationLevelChange('minimal')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              orchestrationLevel === 'minimal'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Minimal
          </button>
          <button
            onClick={() => handleOrchestrationLevelChange('balanced')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              orchestrationLevel === 'balanced'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Balanced
          </button>
          <button
            onClick={() => handleOrchestrationLevelChange('maximum')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              orchestrationLevel === 'maximum'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Maximum
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Controls how many processing components run simultaneously
        </p>
      </div>

      {/* Memory Allocation */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Memory Allocation: {memoryAllocation} MB
        </label>
        <input
          type="range"
          min="128"
          max="1024"
          step="64"
          value={memoryAllocation}
          onChange={handleMemoryAllocationChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>128 MB</span>
          <span>1024 MB</span>
        </div>
      </div>

      {/* Processing Threads */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Processing Threads
        </label>
        <select
          value={processingThreads}
          onChange={handleProcessingThreadsChange}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
        >
          <option value="1">1 thread</option>
          <option value="2">2 threads</option>
          <option value="4">4 threads</option>
          <option value="8">8 threads</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          More threads can improve performance but increase resource usage
        </p>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Caching Toggle */}
        <div
          onClick={handleCachingToggle}
          className={`p-3 rounded-md cursor-pointer ${
            cachingEnabled
              ? 'bg-blue-900 text-blue-200'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Caching</span>
            <div className={`w-10 h-5 rounded-full relative ${
              cachingEnabled ? 'bg-blue-500' : 'bg-gray-600'
            }`}>
              <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all ${
                cachingEnabled ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </div>
          </div>
          <p className="text-xs">Store processed data for faster retrieval</p>
        </div>

        {/* Auto Optimize Toggle */}
        <div
          onClick={handleAutoOptimizeToggle}
          className={`p-3 rounded-md cursor-pointer ${
            autoOptimize
              ? 'bg-green-900 text-green-200'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Auto Optimize</span>
            <div className={`w-10 h-5 rounded-full relative ${
              autoOptimize ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all ${
                autoOptimize ? 'right-0.5' : 'left-0.5'
              }`}></div>
            </div>
          </div>
          <p className="text-xs">Automatically adjust settings for best performance</p>
        </div>
      </div>

      {/* System Recommendations */}
      <div className="mt-4 p-3 bg-gray-700 rounded-md">
        <h3 className="text-sm font-medium text-white mb-2">Optimization Recommendations</h3>
        <ul className="text-xs text-gray-300 space-y-1 list-disc pl-4">
          {recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SystemControlPanel;
