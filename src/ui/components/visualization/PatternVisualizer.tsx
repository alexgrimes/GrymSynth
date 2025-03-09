import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../ui/state/store';
import { Pattern } from '../../../ui/state/visualizationSlice';
import { selectPattern } from '../../../ui/state/controlsSlice';

interface PatternVisualizerProps {
  width?: number;
  height?: number;
  className?: string;
}

const PatternVisualizer: React.FC<PatternVisualizerProps> = ({
  width = 800,
  height = 400,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPatternId, setHoveredPatternId] = useState<string | null>(null);

  const dispatch = useDispatch();

  // Get patterns from Redux store
  const patterns = useSelector((state: RootState) => state.visualization.patterns);
  const selectedPatternId = useSelector((state: RootState) => state.controls.patternControl.selectedPatternId);
  const similarityThreshold = useSelector((state: RootState) => state.controls.patternControl.similarityThreshold);

  // Calculate pattern relationships based on similarity
  const patternRelationships = React.useMemo(() => {
    const relationships: { source: string; target: string; similarity: number }[] = [];

    // Calculate similarity between patterns
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const patternA = patterns[i];
        const patternB = patterns[j];

        // Simple similarity calculation based on frequency range overlap
        // In a real implementation, this would use more sophisticated metrics
        const overlapLow = Math.max(patternA.frequencyRange.low, patternB.frequencyRange.low);
        const overlapHigh = Math.min(patternA.frequencyRange.high, patternB.frequencyRange.high);
        const overlap = Math.max(0, overlapHigh - overlapLow);

        const rangeA = patternA.frequencyRange.high - patternA.frequencyRange.low;
        const rangeB = patternB.frequencyRange.high - patternB.frequencyRange.low;

        const similarity = overlap / Math.min(rangeA, rangeB);

        if (similarity >= similarityThreshold) {
          relationships.push({
            source: patternA.id,
            target: patternB.id,
            similarity,
          });
        }
      }
    }

    return relationships;
  }, [patterns, similarityThreshold]);

  // Force-directed graph layout calculation
  const calculateLayout = React.useCallback(() => {
    if (patterns.length === 0) return [];

    // Initialize node positions randomly
    const nodes = patterns.map(pattern => ({
      id: pattern.id,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      vx: 0,
      vy: 0,
      pattern,
    }));

    // Simple force-directed layout algorithm
    const iterations = 100;
    const repulsionForce = 500;
    const attractionForce = 0.1;
    const centeringForce = 0.01;

    for (let i = 0; i < iterations; i++) {
      // Apply repulsion forces between all nodes
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const nodeA = nodes[j];
          const nodeB = nodes[k];

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = repulsionForce / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }

      // Apply attraction forces for related patterns
      for (const relationship of patternRelationships) {
        const sourceNode = nodes.find(n => n.id === relationship.source);
        const targetNode = nodes.find(n => n.id === relationship.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = distance * attractionForce * relationship.similarity;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      }

      // Apply centering force
      for (const node of nodes) {
        const dx = width / 2 - node.x;
        const dy = height / 2 - node.y;

        node.vx += dx * centeringForce;
        node.vy += dy * centeringForce;

        // Update positions
        node.x += node.vx;
        node.y += node.vy;

        // Dampen velocities
        node.vx *= 0.9;
        node.vy *= 0.9;

        // Constrain to canvas
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      }
    }

    return nodes;
  }, [patterns, patternRelationships, width, height]);

  // Draw the visualization
  const drawVisualization = React.useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');

    if (!ctx || !overlayCtx) return;

    // Clear canvases
    ctx.clearRect(0, 0, width, height);
    overlayCtx.clearRect(0, 0, width, height);

    // Set background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Calculate layout
    const nodes = calculateLayout();

    // Draw connections first (so they appear behind nodes)
    ctx.lineWidth = 1;
    for (const relationship of patternRelationships) {
      const sourceNode = nodes.find(n => n.id === relationship.source);
      const targetNode = nodes.find(n => n.id === relationship.target);

      if (sourceNode && targetNode) {
        // Gradient based on similarity
        const gradient = ctx.createLinearGradient(
          sourceNode.x, sourceNode.y, targetNode.x, targetNode.y
        );

        const alpha = 0.3 + relationship.similarity * 0.7;
        gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
        gradient.addColorStop(1, `rgba(139, 92, 246, ${alpha})`);

        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const pattern = node.pattern;
      const isSelected = selectedPatternId === pattern.id;
      const isHovered = hoveredPatternId === pattern.id;

      // Node size based on confidence
      const radius = 10 + pattern.confidence * 20;

      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      // Color gradient based on frequency range
      const gradient = ctx.createRadialGradient(
        node.x, node.y, 0,
        node.x, node.y, radius
      );

      // Map frequency to color (low = blue, high = red)
      const lowFreqHue = 240; // blue
      const highFreqHue = 0; // red

      const maxFreq = 20000; // max audible frequency
      const normalizedFreq = (pattern.frequencyRange.low + pattern.frequencyRange.high) / 2 / maxFreq;
      const hue = lowFreqHue - normalizedFreq * (lowFreqHue - highFreqHue);

      gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.9)`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, 50%, 0.7)`);

      ctx.fillStyle = gradient;

      // Highlight selected or hovered nodes
      if (isSelected || isHovered) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.fill();

      // Draw border
      ctx.strokeStyle = isSelected
        ? 'rgba(255, 255, 255, 0.9)'
        : isHovered
          ? 'rgba(255, 255, 255, 0.7)'
          : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.stroke();

      // Draw pattern ID label
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pattern.id.substring(0, 6), node.x, node.y);
    }

    // Draw detailed info for selected or hovered pattern in overlay
    if (hoveredPatternId || selectedPatternId) {
      const patternId = hoveredPatternId || selectedPatternId;
      const pattern = patterns.find(p => p.id === patternId);
      const node = nodes.find(n => n.id === patternId);

      if (pattern && node) {
        overlayCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        overlayCtx.roundRect(10, 10, 250, 120, 5);
        overlayCtx.fill();

        overlayCtx.fillStyle = 'white';
        overlayCtx.font = '14px sans-serif';
        overlayCtx.textAlign = 'left';
        overlayCtx.textBaseline = 'top';

        overlayCtx.fillText(`Pattern ID: ${pattern.id}`, 20, 20);
        overlayCtx.fillText(`Frequency Range: ${pattern.frequencyRange.low.toFixed(0)} - ${pattern.frequencyRange.high.toFixed(0)} Hz`, 20, 40);
        overlayCtx.fillText(`Confidence: ${(pattern.confidence * 100).toFixed(1)}%`, 20, 60);
        overlayCtx.fillText(`Timestamp: ${new Date(pattern.timestamp).toLocaleTimeString()}`, 20, 80);

        const relatedPatterns = patternRelationships
          .filter(r => r.source === pattern.id || r.target === pattern.id)
          .map(r => {
            const otherId = r.source === pattern.id ? r.target : r.source;
            return { id: otherId, similarity: r.similarity };
          });

        if (relatedPatterns.length > 0) {
          overlayCtx.fillText(`Related Patterns: ${relatedPatterns.length}`, 20, 100);
        }
      }
    }
  }, [patterns, patternRelationships, calculateLayout, selectedPatternId, hoveredPatternId, width, height]);

  // Handle mouse interactions
  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate layout to get current node positions
    const nodes = calculateLayout();

    // Check if mouse is over any node
    let hoveredNode = null;
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Node size based on confidence
      const radius = 10 + node.pattern.confidence * 20;

      if (distance <= radius) {
        hoveredNode = node;
        break;
      }
    }

    setHoveredPatternId(hoveredNode ? hoveredNode.id : null);
  }, [calculateLayout]);

  const handleClick = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPatternId) {
      dispatch(selectPattern(hoveredPatternId));
    } else {
      // Clicking empty space deselects
      dispatch(selectPattern(null));
    }
  }, [dispatch, hoveredPatternId]);

  // Initial render and updates
  useEffect(() => {
    drawVisualization();
  }, [drawVisualization]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
      />
    </div>
  );
};

export default PatternVisualizer;
