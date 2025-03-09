import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../ui/state/store';

interface PerformanceMetricsDisplayProps {
  width?: number;
  height?: number;
  className?: string;
}

const PerformanceMetricsDisplay: React.FC<PerformanceMetricsDisplayProps> = ({
  width = 300,
  height = 200,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get performance metrics from Redux store
  const performanceMetrics = useSelector((state: RootState) => state.visualization.performanceMetrics);
  const processingLatency = useSelector((state: RootState) => state.audioProcessing.processing.processingLatency);
  const orchestrationLevel = useSelector((state: RootState) => state.controls.systemControl.orchestrationLevel);
  const memoryAllocation = useSelector((state: RootState) => state.controls.systemControl.memoryAllocation);

  // Store historical data for graphs
  const historyRef = useRef<{
    fps: number[];
    memory: number[];
    latency: number[];
    timestamps: number[];
  }>({
    fps: [],
    memory: [],
    latency: [],
    timestamps: [],
  });

  // Update history with new data
  useEffect(() => {
    const history = historyRef.current;
    const now = Date.now();

    // Add new data points
    history.fps.push(performanceMetrics.fps);
    history.memory.push(performanceMetrics.memoryUsage);
    history.latency.push(processingLatency);
    history.timestamps.push(now);

    // Limit history to 100 points
    if (history.fps.length > 100) {
      history.fps.shift();
      history.memory.shift();
      history.latency.shift();
      history.timestamps.shift();
    }
  }, [performanceMetrics, processingLatency]);

  // Draw the visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    const history = historyRef.current;
    if (history.fps.length < 2) return;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < height; y += height / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw FPS graph
    const drawGraph = (
      data: number[],
      color: string,
      minValue: number,
      maxValue: number,
      yOffset: number,
      graphHeight: number
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const dataLength = data.length;
      const xStep = width / (dataLength - 1);

      for (let i = 0; i < dataLength; i++) {
        const value = data[i];
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        const y = yOffset + graphHeight - normalizedValue * graphHeight;

        if (i === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(i * xStep, y);
        }
      }

      ctx.stroke();
    };

    // Draw section dividers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 2 * height / 3);
    ctx.lineTo(width, 2 * height / 3);
    ctx.stroke();

    // Draw FPS graph (top section)
    drawGraph(
      history.fps,
      'rgba(52, 211, 153, 0.8)', // green
      0,
      120, // max FPS
      0,
      height / 3
    );

    // Draw memory usage graph (middle section)
    drawGraph(
      history.memory,
      'rgba(96, 165, 250, 0.8)', // blue
      0,
      1000, // max memory in MB
      height / 3,
      height / 3
    );

    // Draw latency graph (bottom section)
    drawGraph(
      history.latency,
      'rgba(251, 113, 133, 0.8)', // red
      0,
      100, // max latency in ms
      2 * height / 3,
      height / 3
    );

    // Draw current values
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // FPS
    ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
    ctx.fillText(`FPS: ${performanceMetrics.fps.toFixed(1)}`, 10, 5);

    // Memory
    ctx.fillStyle = 'rgba(96, 165, 250, 0.9)';
    ctx.fillText(`Memory: ${performanceMetrics.memoryUsage.toFixed(1)} MB`, 10, height / 3 + 5);

    // Latency
    ctx.fillStyle = 'rgba(251, 113, 133, 0.9)';
    ctx.fillText(`Latency: ${processingLatency.toFixed(1)} ms`, 10, 2 * height / 3 + 5);

    // System info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(`Orchestration: ${orchestrationLevel}`, width - 10, 5);
    ctx.fillText(`Memory Allocation: ${memoryAllocation} MB`, width - 10, height / 3 + 5);

    // Performance status indicator
    let performanceStatus = 'Optimal';
    let statusColor = 'rgba(52, 211, 153, 0.9)'; // green

    if (performanceMetrics.fps < 30 || processingLatency > 50) {
      performanceStatus = 'Degraded';
      statusColor = 'rgba(251, 191, 36, 0.9)'; // yellow
    }

    if (performanceMetrics.fps < 15 || processingLatency > 100) {
      performanceStatus = 'Critical';
      statusColor = 'rgba(239, 68, 68, 0.9)'; // red
    }

    ctx.fillStyle = statusColor;
    ctx.textAlign = 'right';
    ctx.fillText(`Status: ${performanceStatus}`, width - 10, 2 * height / 3 + 5);
  }, [performanceMetrics, processingLatency, orchestrationLevel, memoryAllocation, width, height]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-lg"
      />
    </div>
  );
};

export default PerformanceMetricsDisplay;
