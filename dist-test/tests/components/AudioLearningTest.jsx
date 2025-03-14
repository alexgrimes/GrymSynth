"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioLearningTest = void 0;
const react_1 = __importStar(require("react"));
const audio_processing_manager_1 = require("../../lib/feature-memory/core/audio-processing-manager");
const feature_memory_system_1 = require("../../lib/feature-memory/core/feature-memory-system");
const project_manager_1 = require("../../lib/feature-memory/core/project-manager");
const model_health_monitor_1 = require("../../lib/feature-memory/core/model-health-monitor");
const metrics_collector_1 = require("../../lib/feature-memory/core/metrics-collector");
function AudioLearningTest() {
    const [results, setResults] = (0, react_1.useState)([]);
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const audioManagerRef = (0, react_1.useRef)(null);
    const audioContextRef = (0, react_1.useRef)(null);
    // Initialize audio processing system
    const initializeSystem = (0, react_1.useCallback)(async () => {
        try {
            if (!window.AudioContext && !window.webkitAudioContext) {
                throw new Error('Web Audio API is not supported in this browser');
            }
            const metricsCollector = new metrics_collector_1.MetricsCollector();
            const healthMonitor = new model_health_monitor_1.ModelHealthMonitor(metricsCollector);
            const featureMemory = new feature_memory_system_1.FeatureMemorySystem();
            const projectManager = new project_manager_1.ProjectManager(featureMemory, healthMonitor);
            audioManagerRef.current = new audio_processing_manager_1.AudioProcessingManager(projectManager, healthMonitor, featureMemory);
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            await projectManager.initializeModel('audio', {
                type: 'processing',
                memoryRequirement: 100 * 1024 * 1024
            });
            await projectManager.initializeModel('pattern', {
                type: 'analysis',
                memoryRequirement: 150 * 1024 * 1024
            });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to initialize audio system: ${message}`);
            throw err;
        }
    }, []);
    // Handle file selection
    const handleFileUpload = (0, react_1.useCallback)(async (event) => {
        const files = event.target.files;
        if (!files?.length)
            return;
        try {
            if (!audioManagerRef.current || !audioContextRef.current) {
                await initializeSystem();
            }
            // Resume audio context if it was suspended
            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            setProcessing(true);
            setError(null);
            const processResults = await Promise.all(Array.from(files).map(async (file) => {
                try {
                    // Convert File to AudioBuffer
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                    // Process audio file
                    const result = await audioManagerRef.current.processAudio({
                        id: file.name,
                        path: file.name,
                        size: file.size,
                        format: file.type.split('/')[1]
                    });
                    return result;
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : 'Unknown error';
                    throw new Error(`Failed to process ${file.name}: ${message}`);
                }
            }));
            setResults(prev => [...prev, ...processResults]);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Failed to process audio: ${message}`);
        }
        finally {
            setProcessing(false);
        }
    }, [initializeSystem]);
    const clearResults = (0, react_1.useCallback)(() => {
        setResults([]);
        setError(null);
    }, []);
    return (<div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Audio Learning System Test</h1>
      
      {/* Test Controls */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow" role="region" aria-label="Test Controls">
        <h2 className="text-lg font-semibold mb-3">Test Controls</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="audio-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Select Audio Files
            </label>
            <input id="audio-upload" type="file" accept="audio/*" multiple onChange={handleFileUpload} disabled={processing} className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100" aria-describedby="file-upload-help"/>
            <p id="file-upload-help" className="mt-1 text-sm text-gray-600">
              Select one or more audio files to test pattern learning
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button onClick={clearResults} disabled={processing || results.length === 0} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" aria-label="Clear all test results">
              Clear Results
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" role="alert" aria-live="polite">
          {error}
        </div>)}

      {/* Results Display */}
      <div className="space-y-4" role="region" aria-label="Test Results">
        {results.map((result, index) => (<div key={index} className="p-4 bg-white rounded-lg shadow">
            <h3 className="font-semibold mb-2">Test #{index + 1}</h3>
            
            {/* Learning Metrics */}
            {result.learningMetrics && (<div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Recognition Rate</div>
                    <div className="text-lg">
                      {(result.learningMetrics.patternRecognitionRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Known Patterns</div>
                    <div className="text-lg">
                      {result.learningMetrics.knownPatternsCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Avg Confidence</div>
                    <div className="text-lg">
                      {(result.learningMetrics.averageConfidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>)}

            {/* Patterns */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Patterns</h4>
              <div className="space-y-2">
                {result.patterns.map((pattern, pIndex) => (<div key={pIndex} className="text-sm bg-gray-50 p-2 rounded">
                    <div className="flex justify-between">
                      <span>Pattern {pattern.id}</span>
                      <span>Confidence: {(pattern.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="text-gray-600">
                      Frequency: {pattern.frequency}Hz
                    </div>
                  </div>))}
              </div>
            </div>
          </div>))}
      </div>

      {/* Processing Indicator */}
      {processing && (<div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow" role="status" aria-live="polite">
          Processing audio files...
        </div>)}
    </div>);
}
exports.AudioLearningTest = AudioLearningTest;
//# sourceMappingURL=AudioLearningTest.jsx.map