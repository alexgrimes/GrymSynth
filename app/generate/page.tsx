'use client';

import React, { useState } from 'react';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Slider } from '../../src/components/ui/slider';
import { Label } from '../../src/components/ui/label';

// Mock data for audio samples
const mockSamples = [
  {
    id: '1',
    name: 'Ambient Synth',
    prompt: 'Create an ambient synth pad with reverb'
  },
  {
    id: '2',
    name: 'Techno Beat',
    prompt: 'Generate a techno beat at 128 BPM'
  },
  {
    id: '3',
    name: 'Piano Melody',
    prompt: 'Compose a melancholic piano melody'
  }
];

export default function GeneratePage() {
  // State for audio generation and playback
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [audioSamples, setAudioSamples] = useState(mockSamples);

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

  // Handle audio generation
  const handleGenerate = () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate audio generation (would be an API call in a real app)
    setTimeout(() => {
      const newSample = {
        id: `${audioSamples.length + 1}`,
        name: `Generated Audio ${audioSamples.length + 1}`,
        prompt: prompt
      };

      setAudioSamples([newSample, ...audioSamples]);
      setCurrentSampleIndex(0);
      setIsGenerating(false);
      setPrompt('');
    }, 2000);
  };

  // Handle randomize seed
  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000).toString();
    setSeed(newSeed);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#462A5A] via-[#32648C] to-[#1EA078]">
          GrymSynth
        </h1>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left sidebar - Pattern recognition controls */}
        <div className="w-full md:w-1/4 bg-gray-800 p-4 border-r border-gray-700 order-3 md:order-1">
          <h2 className="text-lg font-semibold mb-4 text-[#1EA078]">Pattern Recognition</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="patternThreshold" className="text-[#32648C]">Detection Threshold</Label>
              <Slider
                id="patternThreshold"
                min={0}
                max={1}
                step={0.01}
                value={[patternThreshold]}
                onValueChange={(values) => setPatternThreshold(values[0])}
                aria-label="Pattern Threshold"
                className="range-thumb:bg-[#1EA078]"
              />
            </div>

            <div>
              <Label htmlFor="patternSensitivity" className="text-[#32648C]">Sensitivity</Label>
              <Slider
                id="patternSensitivity"
                min={0}
                max={1}
                step={0.01}
                value={[patternSensitivity]}
                onValueChange={(values) => setPatternSensitivity(values[0])}
                aria-label="Pattern Sensitivity"
                className="range-thumb:bg-[#462A5A]"
              />
            </div>

            <div>
              <Label htmlFor="patternComplexity" className="text-[#32648C]">Complexity</Label>
              <Slider
                id="patternComplexity"
                min={1}
                max={10}
                step={1}
                value={[patternComplexity]}
                onValueChange={(values) => setPatternComplexity(values[0])}
                aria-label="Pattern Complexity"
                className="range-thumb:bg-[#32648C]"
              />
            </div>

            <Button
              variant="outline"
              className="w-full border-[#1EA078] text-[#1EA078] hover:bg-[#1EA078]/20 hover:text-[#1EA078]"
            >
              Detect Patterns
            </Button>
          </div>
        </div>

        {/* Center area - Main content with visualizer */}
        <div className="w-full md:w-2/4 flex flex-col order-1 md:order-2">
          {/* Visualizer area */}
          <div className="flex-1 bg-gray-900 p-4 flex flex-col items-center justify-center">
            <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-lg border border-gray-700 w-full">
              <p className="text-lg">Generate audio to visualize</p>
              {currentSample && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <h3 className="font-medium text-[#1EA078]">{currentSample.name}</h3>
                  <p className="text-sm text-gray-300 mt-2 italic">"{currentSample.prompt}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat input */}
          <div className="p-4 border-t border-gray-800 bg-gray-900 flex flex-wrap md:flex-nowrap">
            <Input
              placeholder="What would you like to hear?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-[#1EA078] focus:ring-[#1EA078] mb-2 md:mb-0 w-full md:w-auto"
            />
            <Button
              className="ml-0 md:ml-2 bg-gradient-to-r from-[#462A5A] via-[#32648C] to-[#1EA078] hover:opacity-90 transition-opacity w-full md:w-auto"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>

        {/* Right sidebar - XenakisLDM controls and history */}
        <div className="w-full md:w-1/4 bg-gray-800 p-4 border-l border-gray-700 flex flex-col order-2 md:order-3">
          <h2 className="text-lg font-semibold mb-4 text-[#1EA078]">Audio XenakisLDM</h2>

          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="duration" className="text-[#32648C]">Duration</Label>
                <span className="text-[#1EA078]">{duration}s</span>
              </div>
              <Slider
                id="duration"
                min={1}
                max={30}
                step={1}
                value={[duration]}
                onValueChange={(values) => setDuration(values[0])}
                aria-label="Duration"
                className="range-thumb:bg-[#1EA078]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="diffusionSteps" className="text-[#32648C]">Steps</Label>
                <span className="text-[#1EA078]">{diffusionSteps}</span>
              </div>
              <Slider
                id="diffusionSteps"
                min={10}
                max={100}
                step={5}
                value={[diffusionSteps]}
                onValueChange={(values) => setDiffusionSteps(values[0])}
                aria-label="Diffusion Steps"
                className="range-thumb:bg-[#462A5A]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="guidanceScale" className="text-[#32648C]">Guidance</Label>
                <span className="text-[#1EA078]">{guidanceScale}</span>
              </div>
              <Slider
                id="guidanceScale"
                min={1}
                max={15}
                step={0.5}
                value={[guidanceScale]}
                onValueChange={(values) => setGuidanceScale(values[0])}
                aria-label="Guidance Scale"
                className="range-thumb:bg-[#32648C]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <Label htmlFor="seed" className="text-[#32648C]">Seed</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#1EA078] hover:text-white hover:bg-gray-700 p-0 h-6"
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
                className="w-full bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Generation history */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-md font-semibold mb-2 text-[#1EA078]">History</h3>

            <div className="space-y-2 max-h-[calc(100%-2rem)] overflow-y-auto">
              {audioSamples.length > 0 ? (
                <div className="space-y-2">
                  {audioSamples.map((sample, index) => (
                    <div
                      key={sample.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        index === currentSampleIndex
                          ? "bg-[#32648C]/30 border border-[#32648C]"
                          : "bg-gray-700 border border-gray-600 hover:bg-gray-600"
                      }`}
                      onClick={() => setCurrentSampleIndex(index)}
                    >
                      <div className="font-medium truncate text-white">{sample.name}</div>
                      <div className="text-xs text-[#32648C] mt-1 truncate">
                        {sample.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 bg-gray-700 rounded-lg border border-gray-600">
                  <p>No generations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
