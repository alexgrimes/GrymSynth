'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Slider } from '../../src/components/ui/slider';
import { Label } from '../../src/components/ui/label';
import { AudioWaveformVisualization } from '../../src/components/visualization/AudioWaveformVisualization';
import { AudioSampleNavigator } from '../../src/components/visualization/AudioSampleNavigator';

// Mock data for audio samples
const mockSamples = [
  {
    id: '1',
    name: 'Ambient Synth',
    prompt: 'Create an ambient synth pad with reverb',
    url: '/audio/ambient-synth.mp3',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Techno Beat',
    prompt: 'Generate a techno beat at 128 BPM',
    url: '/audio/techno-beat.mp3',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Piano Melody',
    prompt: 'Compose a melancholic piano melody',
    url: '/audio/piano-melody.mp3',
    createdAt: new Date().toISOString()
  }
];

export default function GeneratePage() {
  // State for audio generation and playback
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [audioSamples, setAudioSamples] = useState(mockSamples);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timeRange, setTimeRange] = useState<[number, number] | null>(null);
  const [showSwipeIndicator, setShowSwipeIndicator] = useState<'left' | 'right' | null>(null);

  // Handle time range changes from the visualization component
  const handleTimeRangeChange = (newTimeRange: [number, number] | undefined) => {
    setTimeRange(newTimeRange || null);
  };

  // State for XenakisLDM parameters
  const [duration, setDuration] = useState(5);
  const [diffusionSteps, setDiffusionSteps] = useState(50);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [seed, setSeed] = useState('123456');

  // State for pattern recognition parameters
  const [patternThreshold, setPatternThreshold] = useState(0.5);
  const [patternSensitivity, setPatternSensitivity] = useState(0.7);
  const [patternComplexity, setPatternComplexity] = useState(5);

  // Get current sample
  const currentSample = audioSamples[currentSampleIndex];

  // Show swipe indicator when navigating between samples
  useEffect(() => {
    // Clear any existing timeout
    const timeout = setTimeout(() => {
      setShowSwipeIndicator(null);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [currentSampleIndex]);

  // Handle audio generation
  const handleGenerate = () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate audio generation (would be an API call in a real app)
    setTimeout(() => {
      const newSample = {
        id: `${audioSamples.length + 1}`,
        name: `Generated Audio ${audioSamples.length + 1}`,
        prompt: prompt,
        url: '/audio/generated-audio.mp3', // Mock URL
        createdAt: new Date().toISOString()
      };

      setAudioSamples([newSample, ...audioSamples]);
      setCurrentSampleIndex(0);
      setIsGenerating(false);
      setPrompt('');
    }, 2000);
  };

  // Handle sample selection with swipe indicator
  const handleSelectSample = (index: number) => {
    if (index < currentSampleIndex) {
      setShowSwipeIndicator('right');
    } else if (index > currentSampleIndex) {
      setShowSwipeIndicator('left');
    }
    setCurrentSampleIndex(index);
  };

  // Handle waveform click for audio playback position
  const handleWaveformClick = (time: number) => {
    setCurrentTime(time);
    // In a real implementation, you would seek the audio to this position
  };

  // Handle randomize seed
  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000).toString();
    setSeed(newSeed);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00FFFF] via-[#00BFFF] to-[#00FF7F] font-synth">
          GrymSynth
        </h1>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left sidebar - Pattern recognition controls */}
        <div className="w-full md:w-1/4 bg-gray-900 p-4 border-r border-gray-800 order-3 md:order-1">
          <h2 className="text-lg font-semibold mb-4 text-[#00FFFF] font-synth">Pattern Recognition</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="patternThreshold" className="text-gray-300 font-synth">Detection Threshold</Label>
              <Slider
                id="patternThreshold"
                min={0}
                max={1}
                step={0.01}
                value={[patternThreshold]}
                onValueChange={(values) => setPatternThreshold(values[0])}
                aria-label="Pattern Threshold"
                className="range-thumb:bg-[#00FFFF]"
              />
            </div>

            <div>
              <Label htmlFor="patternSensitivity" className="text-gray-300 font-synth">Sensitivity</Label>
              <Slider
                id="patternSensitivity"
                min={0}
                max={1}
                step={0.01}
                value={[patternSensitivity]}
                onValueChange={(values) => setPatternSensitivity(values[0])}
                aria-label="Pattern Sensitivity"
                className="range-thumb:bg-[#00BFFF]"
              />
            </div>

            <div>
              <Label htmlFor="patternComplexity" className="text-gray-300 font-synth">Complexity</Label>
              <Slider
                id="patternComplexity"
                min={1}
                max={10}
                step={1}
                value={[patternComplexity]}
                onValueChange={(values) => setPatternComplexity(values[0])}
                aria-label="Pattern Complexity"
                className="range-thumb:bg-[#00FF7F]"
              />
            </div>

            <Button
              variant="outline"
              className="w-full border-[#00FFFF] text-[#00FFFF] hover:bg-[#00FFFF]/20 hover:text-[#00FFFF] font-synth"
            >
              Detect Patterns
            </Button>
          </div>
        </div>

        {/* Center area - Main content with visualizer */}
        <div className="w-full md:w-2/4 flex flex-col order-1 md:order-2">
          {/* Visualizer area */}
          <div className="flex-1 bg-gray-900 p-4 flex flex-col items-center justify-center relative">
            {currentSample ? (
              <>
                <div className="w-full mb-4">
                  <AudioSampleNavigator
                    samples={audioSamples}
                    currentSampleIndex={currentSampleIndex}
                    onSelectSample={handleSelectSample}
                    className="w-full"
                  />
                </div>

                <div className="w-full flex-1 flex flex-col items-center justify-center">
                  <AudioWaveformVisualization
                    audioUrl={currentSample.url}
                    width={800}
                    height={200}
                    color="#00FFFF"
                    backgroundColor="#1f2937"
                    isPlaying={isPlaying}
                    onTimeUpdate={setCurrentTime}
                    onWaveformClick={handleWaveformClick}
                    zoomLevel={zoomLevel}
                    timeRange={timeRange || undefined}
                    onZoomChange={setZoomLevel}
                    onTimeRangeChange={handleTimeRangeChange}
                  />

                  {/* Audio player controls */}
                  <div className="flex items-center justify-center mt-4 space-x-4">
                    <button
                      className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-[#00FFFF]"
                      aria-label="Rewind 10 seconds"
                      onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 17l-5-5 5-5"></path>
                        <path d="M18 17l-5-5 5-5"></path>
                      </svg>
                    </button>

                    <button
                      className="p-3 rounded-full bg-[#00FFFF] hover:bg-[#00BFFF] text-white font-synth"
                      aria-label={isPlaying ? "Pause" : "Play"}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </button>

                    <button
                      className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-[#00FFFF]"
                      aria-label="Forward 10 seconds"
                      onClick={() => setCurrentTime(currentTime + 10)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 17l5-5-5-5"></path>
                        <path d="M6 17l5-5-5-5"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-lg border border-gray-700 w-full">
                <p className="text-lg">Generate audio to visualize</p>
              </div>
            )}

            {/* Swipe indicators */}
            {showSwipeIndicator === 'left' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-start">
                <div className="bg-[#00FFFF]/20 p-4 rounded-r-full animate-slide-left">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l-6-6 6-6"></path>
                  </svg>
                </div>
              </div>
            )}

            {showSwipeIndicator === 'right' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-end">
                <div className="bg-[#00FFFF]/20 p-4 rounded-l-full animate-slide-right">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l6-6-6-6"></path>
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="p-4 border-t border-gray-800 bg-gray-900 flex flex-wrap md:flex-nowrap">
            <Input
              placeholder="What would you like to hear?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#00FFFF] focus:ring-[#00FFFF] mb-2 md:mb-0 w-full md:w-auto font-synth"
            />
            <Button
              className="ml-0 md:ml-2 bg-gradient-to-r from-[#00FF7F] via-[#00BFFF] to-[#00FFFF] hover:opacity-90 transition-opacity w-full md:w-auto font-synth"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>

        {/* Right sidebar - Sound Generation controls and history */}
        <div className="w-full md:w-1/4 bg-gray-900 p-4 border-l border-gray-800 flex flex-col order-2 md:order-3">
          <h2 className="text-lg font-semibold mb-4 text-[#00FFFF] font-synth">Audio XenakisLDM</h2>

          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="duration" className="text-gray-300 font-synth">Duration</Label>
                <span className="text-[#00FFFF]">{duration}s</span>
              </div>
              <Slider
                id="duration"
                min={1}
                max={30}
                step={1}
                value={[duration]}
                onValueChange={(values) => setDuration(values[0])}
                aria-label="Duration"
                className="range-thumb:bg-[#00FFFF]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="diffusionSteps" className="text-gray-300 font-synth">Steps</Label>
                <span className="text-[#00FFFF]">{diffusionSteps}</span>
              </div>
              <Slider
                id="diffusionSteps"
                min={10}
                max={100}
                step={5}
                value={[diffusionSteps]}
                onValueChange={(values) => setDiffusionSteps(values[0])}
                aria-label="Diffusion Steps"
                className="range-thumb:bg-[#00BFFF]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="guidanceScale" className="text-gray-300 font-synth">Guidance</Label>
                <span className="text-[#00FFFF]">{guidanceScale}</span>
              </div>
              <Slider
                id="guidanceScale"
                min={1}
                max={15}
                step={0.5}
                value={[guidanceScale]}
                onValueChange={(values) => setGuidanceScale(values[0])}
                aria-label="Guidance Scale"
                className="range-thumb:bg-[#00FF7F]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="seed" className="text-gray-300 font-synth">Seed</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#00FFFF] hover:text-white hover:bg-gray-700 p-0 h-6 font-synth"
                  onClick={handleRandomizeSeed}
                >
                  Randomize
                </Button>
              </div>
              <Input
                id="seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white font-synth"
              />
            </div>
          </div>

          {/* Generation history */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-md font-semibold mb-2 text-[#00FFFF] font-synth">History</h3>

            <div className="space-y-2 max-h-[calc(100%-2rem)] overflow-y-auto">
              {audioSamples.length > 0 ? (
                <div className="space-y-2">
                  {audioSamples.map((sample, index) => (
                    <div
                      key={sample.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        index === currentSampleIndex
                          ? "bg-[#00FFFF]/30 border border-[#00FFFF]"
                          : "bg-gray-800 border border-gray-700 hover:bg-gray-700"
                      }`}
                      onClick={() => setCurrentSampleIndex(index)}
                    >
                      <div className="font-medium truncate text-white font-synth">{sample.name}</div>
                      <div className="text-xs text-[#00FFFF] mt-1 truncate">
                        {sample.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="font-synth">No generations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
