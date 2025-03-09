// Standalone test script for GAMA integration
// This script doesn't rely on the TypeScript codebase

const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Mock Logger
class Logger {
  constructor(options) {
    this.namespace = options.namespace || 'default';
  }

  info(message, data) {
    console.log(`[INFO] [${this.namespace}] ${message}`, data || '');
  }

  error(message, data) {
    console.error(`[ERROR] [${this.namespace}] ${message}`, data || '');
  }

  warn(message, data) {
    console.warn(`[WARN] [${this.namespace}] ${message}`, data || '');
  }

  debug(message, data) {
    console.debug(`[DEBUG] [${this.namespace}] ${message}`, data || '');
  }
}

// Mock MemoryManager
class MemoryManager {
  constructor(config) {
    this.maxBytes = this.parseMemoryString(config.maxMemory);
    this.operations = new Map();
  }

  parseMemoryString(memoryStr) {
    const match = memoryStr.match(/^(\d+)(KB|MB|GB|B)$/);
    if (!match) {
      throw new Error(`Invalid memory string format: ${memoryStr}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "KB": return value * 1024;
      case "MB": return value * 1024 * 1024;
      case "GB": return value * 1024 * 1024 * 1024;
      case "B": return value;
      default: throw new Error(`Invalid memory unit: ${unit}`);
    }
  }

  startOperation(operation) {
    const now = Date.now();
    this.operations.set(operation, {
      startTime: now,
      count: (this.operations.get(operation)?.count || 0) + 1
    });
    return now;
  }

  endOperation(operation, startTime) {
    // No-op for this test
  }

  getMemoryUsage() {
    return {
      used: process.memoryUsage().heapUsed,
      max: this.maxBytes,
      percentage: (process.memoryUsage().heapUsed / this.maxBytes) * 100
    };
  }

  getOperationStats() {
    const stats = {};
    this.operations.forEach((value, key) => {
      stats[key] = {
        count: value.count,
        lastUsed: new Date(value.startTime)
      };
    });
    return stats;
  }
}

// Mock GAMABridge
class GAMABridge {
  constructor() {
    this.logger = new Logger({ namespace: 'gama-bridge' });
    this.pythonProcess = null;
    this.requestQueue = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.logger.info('Starting Python process');

      // Start Python process
      this.pythonProcess = spawn('python', ['-m', 'gama_operations']);

      if (!this.pythonProcess || !this.pythonProcess.stdin || !this.pythonProcess.stdout) {
        throw new Error('Failed to start Python process');
      }

      // Set up communication
      this.setupCommunication();

      // Wait for ready signal
      await this.waitForReady();

      this.isInitialized = true;
      this.logger.info('GAMA bridge initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize GAMA bridge', { error: error.message });
      throw error;
    }
  }

  setupCommunication() {
    // Handle stdout for responses
    this.pythonProcess.stdout.on('data', (data) => {
      try {
        const lines = data.toString().split('\n').filter(Boolean);

        for (const line of lines) {
          const response = JSON.parse(line);
          this.handleResponse(response);
        }
      } catch (error) {
        this.logger.error('Error parsing Python response', {
          error: error.message,
          data: data.toString()
        });
      }
    });

    // Handle stderr for errors
    this.pythonProcess.stderr.on('data', (data) => {
      this.logger.info('Python output:', data.toString());
    });

    // Handle process exit
    this.pythonProcess.on('exit', (code) => {
      if (code !== 0) {
        this.logger.error(`Python process exited with code ${code}`);
      }

      this.isInitialized = false;
      this.pythonProcess = null;
    });
  }

  handleResponse(response) {
    const { id, result, error } = response;

    // Find pending request
    const pendingRequest = this.requestQueue.get(id);

    if (!pendingRequest) {
      this.logger.error(`No pending request found for ID: ${id}`);
      return;
    }

    // Remove from queue
    this.requestQueue.delete(id);

    // Resolve or reject promise
    if (error) {
      pendingRequest.reject(new Error(error));
    } else {
      pendingRequest.resolve(result);
    }
  }

  async executeOperation(operation, data) {
    if (!this.isInitialized || !this.pythonProcess) {
      throw new Error('Bridge not initialized');
    }

    // Create unique request ID
    const requestId = uuidv4();

    // Create promise for response
    const responsePromise = new Promise((resolve, reject) => {
      this.requestQueue.set(requestId, { resolve, reject });
    });

    // Send operation to Python process
    if (this.pythonProcess.stdin) {
      this.pythonProcess.stdin.write(
        JSON.stringify({
          id: requestId,
          operation,
          data
        }) + '\n'
      );
    } else {
      throw new Error('Python process stdin not available');
    }

    // Wait for response
    return responsePromise;
  }

  async waitForReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for Python process to be ready'));
      }, 30000);

      const checkReady = async () => {
        try {
          await this.executeOperation('ping', {});
          clearTimeout(timeout);
          resolve();
        } catch (error) {
          setTimeout(checkReady, 500);
        }
      };

      checkReady();
    });
  }

  async shutdown() {
    if (!this.isInitialized || !this.pythonProcess) {
      return;
    }

    try {
      // Send shutdown signal
      await this.executeOperation('shutdown', {});
    } catch (error) {
      // Ignore errors during shutdown
      this.logger.warn('Error during bridge shutdown', { error: error.message });
    }

    // Kill process if still running
    if (this.pythonProcess && !this.pythonProcess.killed) {
      this.pythonProcess.kill();
    }

    this.isInitialized = false;
    this.pythonProcess = null;
    this.logger.info('GAMA bridge shut down successfully');
  }
}

// Mock GAMAModelManager
class GAMAModelManager {
  constructor(config) {
    this.modelPath = config.modelPath;
    this.checkpointPath = config.checkpointPath || '';
    this.config = config;
    this.logger = new Logger({ namespace: 'gama-model-manager' });
  }

  async downloadModel() {
    // Check if model exists locally
    if (await this.modelExists()) {
      this.logger.info('Model already exists locally', { path: this.modelPath });
      return;
    }

    this.logger.info('Downloading model', { modelPath: this.modelPath });

    // In a real implementation, this would download from HuggingFace
    // For now, we'll just create the directory
    try {
      if (!fs.existsSync(this.modelPath)) {
        fs.mkdirSync(this.modelPath, { recursive: true });
      }

      // Create a dummy config.json file to indicate the model exists
      if (!fs.existsSync(path.join(this.modelPath, 'config.json'))) {
        fs.writeFileSync(
          path.join(this.modelPath, 'config.json'),
          JSON.stringify({ model_type: 'gama', version: '1.0.0' })
        );
      }

      this.logger.info('Model downloaded successfully');
    } catch (error) {
      this.logger.error('Failed to download model', { error: error.message });
      throw error;
    }
  }

  async verifyModel() {
    try {
      // Check if model files exist
      const configExists = await this.fileExists(path.join(this.modelPath, 'config.json'));

      if (!configExists) {
        this.logger.error('Model verification failed: config.json not found');
        return false;
      }

      this.logger.info('Model verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Model verification failed', { error: error.message });
      return false;
    }
  }

  async loadModel(bridge) {
    try {
      this.logger.info('Loading model', { modelPath: this.modelPath });

      // Load model with optimizations
      await bridge.executeOperation('load_model', {
        model_path: this.modelPath,
        checkpoint_path: this.checkpointPath,
        options: {
          device: this.config.device || 'cuda',
          quantization: this.config.quantization || '8bit',
          use_fp16: this.config.useFp16 !== false,
          use_gradient_checkpointing: this.config.useGradientCheckpointing || false
        }
      });

      this.logger.info('Model loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load model', { error: error.message });
      throw error;
    }
  }

  async modelExists() {
    // Check if model files exist
    try {
      return await this.fileExists(path.join(this.modelPath, 'config.json'));
    } catch (error) {
      return false;
    }
  }

  async fileExists(filePath) {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    } catch (error) {
      return false;
    }
  }
}

// Mock GAMAService
class GAMAService {
  constructor(config) {
    if (!config.maxMemory) {
      throw new Error('Maximum memory must be specified');
    }

    this.config = config;
    this.memoryManager = new MemoryManager({ maxMemory: config.maxMemory });
    this.logger = new Logger({ namespace: 'gama-service' });
    this.modelManager = new GAMAModelManager(config);
    this.bridge = new GAMABridge();
    this.initialized = false;
    this.status = { state: 'initializing', timestamp: Date.now() };
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.logger.info('Initializing GAMA service');

      // Download and verify model if needed
      await this.modelManager.downloadModel();
      const isVerified = await this.modelManager.verifyModel();

      if (!isVerified) {
        throw new Error('Model verification failed');
      }

      // Initialize Python bridge
      await this.bridge.initialize();

      // Load model through bridge
      await this.modelManager.loadModel(this.bridge);

      this.initialized = true;
      this.status = { state: 'ready', timestamp: Date.now() };

      this.logger.info('GAMA service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize GAMA service', { error: error.message });

      this.status = {
        state: 'error',
        message: 'Initialization failed',
        error,
        timestamp: Date.now()
      };

      throw error;
    }
  }

  async shutdown() {
    try {
      if (!this.initialized) return;

      this.logger.info('Shutting down GAMA service');

      // Shutdown bridge
      await this.bridge.shutdown();

      this.initialized = false;
      this.status = { state: 'shutdown', timestamp: Date.now() };

      this.logger.info('GAMA service shut down successfully');
    } catch (error) {
      this.logger.error('Failed to shut down GAMA service', { error: error.message });
      throw error;
    }
  }

  getStatus() {
    return this.status;
  }

  async process(audio) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!audio?.data) {
      throw new Error('Invalid audio data provided');
    }

    const startTime = this.memoryManager.startOperation('process');

    try {
      // Process audio with GAMA model
      const result = await this.bridge.executeOperation('process_audio', {
        audio: this.serializeAudio(audio),
        options: {
          use_fp16: true,
          batch_size: 1,
          use_gradient_checkpointing: false
        }
      });

      // Transform result to ProcessedAudio format
      const processedAudio = {
        transcription: result.transcription || '',
        confidence: result.confidence || 0.0,
        segments: result.segments || [],
        metadata: {
          model: 'GAMA',
          duration: result.duration || 0,
          wordCount: result.word_count
        }
      };

      return processedAudio;
    } catch (error) {
      this.logger.error('Audio processing failed', { error: error.message });
      throw error;
    } finally {
      this.memoryManager.endOperation('process', startTime);
    }
  }

  async extractFeatures(audio) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!audio?.data) {
      throw new Error('Invalid audio data provided');
    }

    const startTime = this.memoryManager.startOperation('extractFeatures');

    try {
      // Extract features with GAMA model
      const result = await this.bridge.executeOperation('extract_features', {
        audio: this.serializeAudio(audio),
        options: {
          use_fp16: true,
          batch_size: 1,
          use_gradient_checkpointing: false,
          return_vector: true
        }
      });

      // Return the feature vector
      return new Float32Array(result.feature_vector);
    } catch (error) {
      this.logger.error('Feature extraction failed', { error: error.message });
      throw error;
    } finally {
      this.memoryManager.endOperation('extractFeatures', startTime);
    }
  }

  isInitialized() {
    return this.initialized;
  }

  serializeAudio(audio) {
    // Convert audio to format expected by Python bridge
    return {
      data: Array.from(audio.data),
      channels: audio.channels,
      sample_rate: audio.sampleRate,
      metadata: audio.metadata
    };
  }
}

// Create a simple audio buffer for testing
function createTestAudio(duration = 1, sampleRate = 16000) {
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

async function runTest() {
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
    console.log(`- Segments: ${processResult.segments.length}`);

    // Extract features
    console.log('\nExtracting features...');
    const features = await gamaService.extractFeatures(audio);
    console.log(`Extracted feature vector with ${features.length} dimensions`);

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
