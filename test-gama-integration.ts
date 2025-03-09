// TypeScript test script for GAMA integration

import { GAMAService } from './src/services/audio/GAMAService';
import { GAMAAdapter } from './src/services/audio/GAMAAdapter';
import { SimpleAudioBuffer } from './src/interfaces/audio';

// Mock feature memory provider for testing
class MockFeatureMemory {
  async storePattern(features: Float32Array): Promise<string> {
    console.log(`Storing pattern with ${features.length} features`);
    return `pattern-${Date.now()}`;
  }

  async findSimilarPatterns(
    features: Float32Array,
    options: { threshold: number; maxResults: number }
  ): Promise<Array<{ id: string; similarity: number }>> {
    console.log(`Finding patterns similar to vector with ${features.length} features`);
    console.log(`Options: threshold=${options.threshold}, maxResults=${options.maxResults}`);

    // Return mock matches
    return [
      { id: 'pattern-1', similarity: 0.95 },
      { id: 'pattern-2', similarity: 0.85 },
      { id: 'pattern-3', similarity: 0.75 }
    ].slice(0, options.maxResults);
  }
}

// Create a simple audio buffer for testing
function createTestAudio(duration = 1, sampleRate = 16000): SimpleAudioBuffer {
  const samples = duration * sampleRate;
  const data = new Float32Array(samples);

  // Generate a simple sine wave
  for (let i = 0; i < samples; i++) {
    data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
  }

  return {
    data,
    channels: 1,
    sampleRate
  };
}

async function runTest(): Promise<void> {
  try {
    console.log('Initializing GAMA service...');

    // Initialize GAMA service
    const gamaService = new GAMAService({
      id: 'gama-test',
      modelPath: './models/gama',
      maxMemory: '4GB',
      device: 'cpu', // Use CPU for testing
      quantization: '8bit'
    });

    // Initialize GAMA adapter
    const gamaAdapter = new GAMAAdapter({
      gamaService,
      featureMemory: new MockFeatureMemory()
    });

    // Initialize service
    await gamaService.initialize();
    console.log('GAMA service initialized successfully');

    // Create test audio
    const audio = createTestAudio(2); // 2 seconds of audio
    console.log(`Created test audio: ${audio.data.length} samples, ${audio.channels} channels, ${audio.sampleRate}Hz`);

    // Process audio
    console.log('\nProcessing audio...');
    const processResult = await gamaService.process(audio);
    console.log('Process result:');
    console.log(`- Transcription: "${processResult.transcription}"`);
    console.log(`- Confidence: ${processResult.confidence}`);
    console.log(`- Segments: ${processResult.segments?.length || 0}`);

    // Extract features
    console.log('\nExtracting features...');
    const features = await gamaService.extractFeatures(audio);
    console.log(`Extracted feature vector with ${features.length} dimensions`);

    // Test adapter with a task
    console.log('\nTesting adapter with a task...');
    const task = {
      id: 'test-task',
      type: 'audio.process' as any, // Type assertion to avoid TaskType enum issues
      timestamp: Date.now(),
      data: {
        audio,
        options: {}
      }
    };

    const taskResult = await gamaAdapter.handleTask(task as any); // Type assertion
    console.log('Task result:');
    console.log(`- Success: ${taskResult.success}`);
    if (taskResult.data && taskResult.data.transcription) {
      console.log(`- Transcription: "${taskResult.data.transcription}"`);
    }

    // Test pattern recognition
    console.log('\nTesting pattern recognition...');
    const patternId = await gamaAdapter.extractAndStoreFeatures(audio);
    console.log(`Stored pattern with ID: ${patternId}`);

    // Shutdown service
    console.log('\nShutting down GAMA service...');
    await gamaService.shutdown();
    console.log('GAMA service shut down successfully');

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runTest();
