import React, { useEffect, useRef, useState } from 'react';

interface AudioWaveformVisualizationProps {
  audioUrl?: string;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  isPlaying?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onWaveformClick?: (time: number) => void;
}

export const AudioWaveformVisualization: React.FC<AudioWaveformVisualizationProps> = ({
  audioUrl,
  width = 800,
  height = 200,
  color = '#4F46E5', // Indigo-600
  backgroundColor = '#F3F4F6', // Gray-100
  isPlaying = false,
  onTimeUpdate,
  onWaveformClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const animationFrameRef = useRef<number>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioUrl) return;

    const initializeAudioContext = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create AudioContext if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Fetch and decode audio data
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;

        // Draw waveform
        drawWaveform();
      } catch (err) {
        setError('Failed to load audio file');
        console.error('Error loading audio:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAudioContext();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const audioBuffer = audioBufferRef.current;

    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const channelData = audioBuffer.getChannelData(0); // Get mono or left channel
    const step = Math.ceil(channelData.length / width);
    const amp = height / 2;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    // Draw the waveform
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }

    ctx.stroke();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBufferRef.current || !onWaveformClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (x / width) * audioBufferRef.current.duration;
    
    onWaveformClick(time);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
        <div className="animate-pulse text-gray-600">Loading audio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-red-50 rounded-lg">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg cursor-pointer"
        onClick={handleCanvasClick}
      />
    </div>
  );
};