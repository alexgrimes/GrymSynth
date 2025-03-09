# URL Processing System

## Overview

The URL Processing System is a core component of the Audio-Learning-Hub that enables users to process audio content from external URLs. It provides secure URL validation, metadata extraction, streaming capabilities, and integration with the Stagehand service for enhanced content processing and security.

## Components

### Core Services

- **URLProcessor**: Main service for handling audio URLs with validation, security checks, and error handling
- **URLMetadataExtractor**: Service for extracting metadata from URLs
- **URLHistoryManager**: Service for managing URL history
- **URLStreamingManager**: Service for handling streaming URLs
- **URLProcessingIntegration**: Integration service that connects URL processing with other hub components

### Stagehand Integration

- **StagehandClient**: Client for interacting with Stagehand API
- **StagehandValidator**: Validator for URL security using Stagehand
- **StagehandConfiguration**: Configuration for Stagehand integration
- **StagehandAuthProvider**: Authentication provider for Stagehand

### UI Components

- **URLInputForm**: Form for entering and validating URLs
- **URLHistoryList**: Component for displaying URL history
- **URLStatusIndicator**: Component for showing URL processing status
- **StreamControls**: Controls for audio streaming

## Getting Started

### Prerequisites

- Node.js 16+
- Stagehand API key (set as environment variable `BROWSERBASE_API_KEY`)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Stagehand:
   - Set the `BROWSERBASE_API_KEY` environment variable
   - Update `stagehand.config.ts` if needed

### Usage

#### Processing a URL

```typescript
import { URLProcessor } from './services/url/URLProcessor';

// Initialize URL processor
const urlProcessor = new URLProcessor({
  id: 'main-url-processor',
  maxRetries: 3,
  retryDelay: 1000,
  timeoutMs: 30000,
  securityCheckEnabled: true
});

// Initialize the processor
await urlProcessor.initialize();

// Process a URL
const result = await urlProcessor.processURL('https://example.com/audio.mp3');

if (result.success) {
  console.log('URL processed successfully:', result.data);
} else {
  console.error('URL processing failed:', result.error);
}
```

#### Streaming Audio

```typescript
// Prepare URL for streaming
const streamingResult = await urlProcessor.prepareForStreaming('https://example.com/audio.mp3');

if (streamingResult.success) {
  // Get streaming manager
  const streamingManager = (urlProcessor as any).streamingManager;

  // Start streaming
  await streamingManager.startStreaming(streamingResult.data.id);

  // Control playback
  await streamingManager.pauseStreaming(streamingResult.data.id);
  await streamingManager.seekTo(streamingResult.data.id, 30); // Seek to 30 seconds
  await streamingManager.startStreaming(streamingResult.data.id);

  // Stop streaming
  await streamingManager.stopStreaming(streamingResult.data.id);
}
```

#### Using UI Components

```tsx
import React from 'react';
import { URLInputForm } from './ui/components/url/URLInputForm';
import { URLStatusIndicator } from './ui/components/url/URLStatusIndicator';
import { URLHistoryList } from './ui/components/url/URLHistoryList';
import { StreamControls } from './ui/components/url/StreamControls';

const AudioURLProcessor: React.FC = () => {
  return (
    <div className="audio-url-processor">
      <h2>Process Audio URL</h2>

      <URLInputForm
        placeholder="Enter audio URL..."
        buttonText="Process"
      />

      <URLStatusIndicator showDetails={true} />

      <div className="streaming-controls">
        <h3>Playback Controls</h3>
        <StreamControls showVolumeControl={true} showProgressBar={true} />
      </div>

      <div className="history-section">
        <h3>URL History</h3>
        <URLHistoryList maxItems={5} />
      </div>
    </div>
  );
};

export default AudioURLProcessor;
```

## Testing

Run the tests with:

```bash
npm test -- --testPathPattern=url-processing
```

This will run both the service tests and UI component tests.

## Security Considerations

- The URL processor performs security checks on all URLs using Stagehand
- URLs are validated for format and structure
- Domain allowlists and blocklists can be configured
- Suspicious patterns in URLs are detected and flagged

## Configuration

The URL processing system can be configured through the following files:

- `stagehand.config.ts`: Configuration for Stagehand integration
- Service configuration objects when initializing services

## Integration with Audio-Learning-Hub

The URL processing system integrates with the rest of the Audio-Learning-Hub through:

1. **Service Registry**: Services are registered with the service registry
2. **Redux State**: URL processing state is integrated into the Redux store
3. **Audio Processing Pipeline**: Processed URLs are passed to the audio processing pipeline
4. **Error Handling**: URL processing errors are integrated with the hub's error handling system

## Further Documentation

For more detailed documentation, see:

- [URL Processing System Documentation](../../docs/URL-PROCESSING-SYSTEM.md)
- [Stagehand API Documentation](https://stagehand.example.com/docs)
