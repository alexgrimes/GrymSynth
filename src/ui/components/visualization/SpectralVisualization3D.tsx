import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../ui/state/store';
import { setSelectedFrequency, setViewPreset } from '../../../ui/state/visualizationSlice';

// Constants for visualization
const FREQUENCY_BANDS = 128;
const MAX_HEIGHT = 5;
const SPACING = 0.15;
const WIDTH = 0.1;
const GRID_SIZE = Math.sqrt(FREQUENCY_BANDS);

// Color mapping for frequency bands
const getBarColor = (value: number, index: number, isSelected: boolean) => {
  if (isSelected) return new THREE.Color(0xffff00); // Yellow for selected

  // Create a gradient from blue (low) to red (high)
  const hue = (0.6 - (value / MAX_HEIGHT) * 0.6);
  return new THREE.Color().setHSL(hue, 0.8, 0.5);
};

// Individual frequency bar component
interface FrequencyBarProps {
  position: [number, number, number];
  height: number;
  color: THREE.Color;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

const FrequencyBar: React.FC<FrequencyBarProps> = ({
  position,
  height,
  color,
  index,
  isSelected,
  onClick
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animate height changes
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = THREE.MathUtils.lerp(
        meshRef.current.scale.y,
        height,
        0.1
      );

      // Pulse effect for selected bar
      if (isSelected) {
        meshRef.current.material.emissive = new THREE.Color().setHSL(
          (Math.sin(Date.now() * 0.003) * 0.1) + 0.5,
          0.8,
          0.5
        );
      } else {
        meshRef.current.material.emissive = new THREE.Color(0x000000);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={[WIDTH, height, WIDTH]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={isSelected ? new THREE.Color(0x444444) : new THREE.Color(0x000000)}
      />
    </mesh>
  );
};

// Grid of frequency bars
const FrequencyGrid: React.FC<{
  data: number[],
  selectedFrequency: number | null,
  onSelectFrequency: (index: number) => void
}> = ({ data, selectedFrequency, onSelectFrequency }) => {
  return (
    <group>
      {data.map((value, index) => {
        // Calculate grid position
        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;

        const x = (col - GRID_SIZE / 2) * SPACING;
        const z = (row - GRID_SIZE / 2) * SPACING;

        const isSelected = selectedFrequency === index;
        const color = getBarColor(value, index, isSelected);

        return (
          <FrequencyBar
            key={index}
            position={[x, 0, z]}
            height={value}
            color={color}
            index={index}
            isSelected={isSelected}
            onClick={() => onSelectFrequency(index)}
          />
        );
      })}
    </group>
  );
};

// Pattern visualization overlay
const PatternOverlay: React.FC<{ patterns: any[] }> = ({ patterns }) => {
  return (
    <group position={[0, 0.1, 0]}>
      {patterns.map((pattern, index) => {
        // Calculate pattern position based on frequency range
        const startIdx = Math.floor(pattern.frequencyRange.low / (22050 / FREQUENCY_BANDS));
        const endIdx = Math.floor(pattern.frequencyRange.high / (22050 / FREQUENCY_BANDS));

        const startRow = Math.floor(startIdx / GRID_SIZE);
        const startCol = startIdx % GRID_SIZE;
        const endRow = Math.floor(endIdx / GRID_SIZE);
        const endCol = endIdx % GRID_SIZE;

        const x1 = (startCol - GRID_SIZE / 2) * SPACING;
        const z1 = (startRow - GRID_SIZE / 2) * SPACING;
        const x2 = (endCol - GRID_SIZE / 2) * SPACING;
        const z2 = (endRow - GRID_SIZE / 2) * SPACING;

        // Create a line connecting the pattern points
        const points = [];
        points.push(new THREE.Vector3(x1, 0.5, z1));
        points.push(new THREE.Vector3(x2, 0.5, z2));

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <group key={index}>
            <line geometry={lineGeometry}>
              <lineBasicMaterial
                color={new THREE.Color().setHSL(index * 0.1, 0.8, 0.5)}
                linewidth={3}
              />
            </line>
            <mesh position={[x1, 0.5, z1]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(index * 0.1, 0.8, 0.5)}
                emissive={new THREE.Color().setHSL(index * 0.1, 0.8, 0.3)}
              />
            </mesh>
            <mesh position={[x2, 0.5, z2]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(index * 0.1, 0.8, 0.5)}
                emissive={new THREE.Color().setHSL(index * 0.1, 0.8, 0.3)}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// XenakisLDM gravitational field visualization
const XenakisLDMField: React.FC<{ fieldData: any }> = ({ fieldData }) => {
  const pointsRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!pointsRef.current || !fieldData) return;

    // Update particle positions based on gravitational field
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < fieldData.points.length; i++) {
      const point = fieldData.points[i];
      const idx = i * 3;

      positions[idx] = point.x * SPACING * GRID_SIZE * 0.5;
      positions[idx + 1] = point.intensity * MAX_HEIGHT * 0.3;
      positions[idx + 2] = point.z * SPACING * GRID_SIZE * 0.5;

      // Color based on musical concept mapping
      const concept = point.musicalConcept;
      if (concept === 'rhythm') {
        colors[idx] = 1.0; colors[idx + 1] = 0.2; colors[idx + 2] = 0.2;
      } else if (concept === 'harmony') {
        colors[idx] = 0.2; colors[idx + 1] = 0.8; colors[idx + 2] = 1.0;
      } else if (concept === 'timbre') {
        colors[idx] = 0.8; colors[idx + 1] = 0.2; colors[idx + 2] = 1.0;
      } else {
        colors[idx] = 0.7; colors[idx + 1] = 0.7; colors[idx + 2] = 0.7;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  }, [fieldData]);

  // Create initial particle system
  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const idx = i * 3;
    positions[idx] = (Math.random() - 0.5) * SPACING * GRID_SIZE;
    positions[idx + 1] = Math.random() * MAX_HEIGHT * 0.5;
    positions[idx + 2] = (Math.random() - 0.5) * SPACING * GRID_SIZE;

    colors[idx] = 0.7;
    colors[idx + 1] = 0.7;
    colors[idx + 2] = 0.7;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

// Camera controls and view presets
const CameraController: React.FC<{ preset: string }> = ({ preset }) => {
  const { camera } = useThree();
  const controls = useRef<any>();

  useEffect(() => {
    if (!controls.current) return;

    // Apply camera preset
    switch (preset) {
      case 'top':
        camera.position.set(0, 10, 0);
        controls.current.target.set(0, 0, 0);
        break;
      case 'front':
        camera.position.set(0, 2, 5);
        controls.current.target.set(0, 1, 0);
        break;
      case 'side':
        camera.position.set(5, 2, 0);
        controls.current.target.set(0, 1, 0);
        break;
      case 'corner':
      default:
        camera.position.set(3, 3, 3);
        controls.current.target.set(0, 1, 0);
        break;
    }

    controls.current.update();
  }, [camera, preset]);

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={0.5}
      minDistance={1}
      maxDistance={15}
    />
  );
};

// Main 3D visualization component
const SpectralVisualization3D: React.FC = () => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    frequencyData,
    selectedFrequency,
    viewPreset,
    patterns,
    xenakisLDMField,
    showPatterns,
    showXenakisLDM
  } = useSelector((state: RootState) => state.visualization);

  // Handle frequency selection
  const handleSelectFrequency = (index: number) => {
    dispatch(setSelectedFrequency(index));
  };

  // Handle view preset change
  const handleViewPresetChange = (preset: string) => {
    dispatch(setViewPreset(preset));
  };

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          className={`px-3 py-1 rounded text-xs ${viewPreset === 'top' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => handleViewPresetChange('top')}
        >
          Top View
        </button>
        <button
          className={`px-3 py-1 rounded text-xs ${viewPreset === 'front' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => handleViewPresetChange('front')}
        >
          Front View
        </button>
        <button
          className={`px-3 py-1 rounded text-xs ${viewPreset === 'side' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => handleViewPresetChange('side')}
        >
          Side View
        </button>
        <button
          className={`px-3 py-1 rounded text-xs ${viewPreset === 'corner' ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => handleViewPresetChange('corner')}
        >
          Corner View
        </button>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3, 3, 3]} fov={50} />
        <CameraController preset={viewPreset} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Grid helper */}
        <gridHelper
          args={[SPACING * GRID_SIZE * 1.5, GRID_SIZE * 2]}
          position={[0, 0.01, 0]}
          rotation={[0, 0, 0]}
        />

        {/* Frequency visualization */}
        <FrequencyGrid
          data={frequencyData}
          selectedFrequency={selectedFrequency}
          onSelectFrequency={handleSelectFrequency}
        />

        {/* Pattern visualization overlay */}
        {showPatterns && patterns && patterns.length > 0 && (
          <PatternOverlay patterns={patterns} />
        )}

        {/* XenakisLDM field visualization */}
        {showXenakisLDM && xenakisLDMField && (
          <XenakisLDMField fieldData={xenakisLDMField} />
        )}

        {/* Frequency info display */}
        {selectedFrequency !== null && (
          <Text
            position={[0, MAX_HEIGHT + 0.5, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {`Frequency: ${Math.round((selectedFrequency / FREQUENCY_BANDS) * 22050)} Hz - Amplitude: ${frequencyData[selectedFrequency].toFixed(2)}`}
          </Text>
        )}
      </Canvas>
    </div>
  );
};

export default SpectralVisualization3D;
