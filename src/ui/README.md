# Audio Learning Hub UI Components

This directory contains the UI components for the Audio Learning Hub application, showcasing 3D spectral visualization and providing access to backend capabilities.

## Directory Structure

```
src/ui/
├── components/
│   ├── visualization/
│   │   ├── SpectralVisualization3D.tsx - 3D Graphic EQ display
│   │   ├── PatternVisualizer.tsx - Pattern visualization component
│   │   ├── PerformanceMetricsDisplay.tsx - Real-time performance visualization
│   │   └── index.ts - Exports all visualization components
│   ├── controls/
│   │   ├── PatternControlPanel.tsx - Controls for pattern browser and migration
│   │   ├── GAMAControlPanel.tsx - Controls for GAMA parameters
│   │   ├── XenakisLDMPanel.tsx - Controls for spatial-spectral parameters
│   │   ├── SystemControlPanel.tsx - Controls for system orchestration
│   │   └── index.ts - Exports all control components
├── layouts/
│   ├── MainLayout.tsx - Primary layout with visualization center, controls on sides
│   ├── DashboardBar.tsx - Top bar with system status indicators
│   ├── ChatInterface.tsx - Bottom panel with LLM interaction
│   ├── AudioSourcePanel.tsx - Left panel for audio source selection
│   └── index.ts - Exports all layout components
├── state/
│   ├── store.ts - Redux store configuration
│   ├── visualizationSlice.ts - State for visualization components
│   ├── controlsSlice.ts - State for UI control components
│   ├── audioProcessingSlice.ts - State for audio processing
│   └── chatSlice.ts - State for chat interaction
└── index.ts - Main entry point exporting all UI components
```

## Key Features

### Visualization Components

- **SpectralVisualization3D**: Large 3D Graphic EQ display showing frequency spectrum with:
  - Interactive frequency selection/modification
  - Pattern visualization overlay
  - XenakisLDM gravitational field visualization
  - Camera controls and view presets

- **PatternVisualizer**: Component for visualizing detected patterns with:
  - Force-directed graph layout
  - Pattern relationship visualization
  - Interactive pattern selection

- **PerformanceMetricsDisplay**: Real-time performance visualization showing:
  - FPS monitoring
  - Memory usage
  - Processing latency

### Control Panels

- **PatternControlPanel**: Controls for pattern browser, migration status, and similarity threshold
- **GAMAControlPanel**: Controls for GAMA parameters (feature extraction, recognition sensitivity)
- **XenakisLDMPanel**: Controls for spatial-spectral parameters and musical concept mapping
- **SystemControlPanel**: Controls for orchestration, memory allocation, and caching

### Layout Components

- **MainLayout**: Primary layout with 3D visualization center, controls on sides
- **DashboardBar**: Top bar with system status indicators
- **ChatInterface**: Bottom panel with LLM interaction
- **AudioSourcePanel**: Left panel for audio source selection

### State Management

The application uses Redux for state management with the following slices:

- **visualizationSlice**: Manages state for the visualization components
- **controlsSlice**: Manages state for the UI control components
- **audioProcessingSlice**: Manages state for audio processing
- **chatSlice**: Manages state for chat interaction

## Technologies Used

- React for UI components
- Redux for state management
- Three.js and React Three Fiber for 3D visualization
- TypeScript for type safety

## Usage

Import components from the main index file:

```typescript
import {
  SpectralVisualization3D,
  PatternControlPanel,
  MainLayout
} from 'src/ui';
```

## Color Coordination

The UI uses a consistent color scheme for different parameters:

- **Frequency/Spectral**: Blue gradient (low frequencies) to red gradient (high frequencies)
- **Pattern Relationships**: Purple to blue gradients based on similarity
- **System Status**: Green (optimal), Yellow (warning), Red (critical)
- **Musical Concepts**:
  - Rhythm: Red
  - Harmony: Blue
  - Timbre: Purple
