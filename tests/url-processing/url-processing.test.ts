import { URLProcessor } from '../../src/services/url/URLProcessor';
import { URLMetadataExtractor } from '../../src/services/url/URLMetadataExtractor';
import { URLHistoryManager } from '../../src/services/url/URLHistoryManager';
import { URLStreamingManager } from '../../src/services/url/URLStreamingManager';
import { StagehandClient } from '../../src/services/url/stagehand/StagehandClient';
import { URLProcessingIntegration } from '../../src/services/url/URLProcessingIntegration';
import { ServiceRegistry } from '../../src/services/service-registry';

// Mock dependencies
jest.mock('../../src/utils/logger');
jest.mock('../../src/services/url/stagehand/StagehandClient');
jest.mock('../../src/services/url/URLMetadataExtractor');
jest.mock('../../src/services/url/URLHistoryManager');
jest.mock('../../src/services/url/URLStreamingManager');
jest.mock('../../src/services/service-registry');

describe('URL Processing System', () => {
  let urlProcessor: URLProcessor;
  let stagehandClient: jest.Mocked<StagehandClient>;
  let metadataExtractor: jest.Mocked<URLMetadataExtractor>;
  let historyManager: jest.Mocked<URLHistoryManager>;
  let streamingManager: jest.Mocked<URLStreamingManager>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    stagehandClient = new StagehandClient({
      id: 'test-stagehand-client',
      browserbaseApiKey: 'test-api-key'
    }) as jest.Mocked<StagehandClient>;

    metadataExtractor = new URLMetadataExtractor({
      id: 'test-metadata-extractor'
    }) as jest.Mocked<URLMetadataExtractor>;

    historyManager = new URLHistoryManager({
      id: 'test-history-manager'
    }) as jest.Mocked<URLHistoryManager>;

    streamingManager = new URLStreamingManager({
      id: 'test-streaming-manager'
    }) as jest.Mocked<URLStreamingManager>;

    // Setup mock implementations
    stagehandClient.initialize.mockResolvedValue();
    stagehandClient.shutdown.mockResolvedValue();
    stagehandClient.getStatus.mockReturnValue({ state: 'ready', timestamp: Date.now() });
    stagehandClient.isInitialized.mockReturnValue(true);
    stagehandClient.checkURLSecurity.mockResolvedValue({
      status: 'safe',
      details: { confidence: 0.9 }
    });

    metadataExtractor.initialize.mockResolvedValue();
    metadataExtractor.shutdown.mockResolvedValue();
    metadataExtractor.getStatus.mockReturnValue({ state: 'ready', timestamp: Date.now() });
    metadataExtractor.isInitialized.mockReturnValue(true);
    metadataExtractor.extractMetadata.mockResolvedValue({
      url: 'https://example.com/audio.mp3',
      domain: 'example.com',
      extractedAt: Date.now(),
      audio: {
        format: 'mp3',
        duration: 180
      }
    });

    historyManager.initialize.mockResolvedValue();
    historyManager.shutdown.mockResolvedValue();
    historyManager.getStatus.mockReturnValue({ state: 'ready', timestamp: Date.now() });
    historyManager.isInitialized.mockReturnValue(true);
    historyManager.addToHistory.mockResolvedValue();
    historyManager.getHistory.mockResolvedValue([]);

    streamingManager.initialize.mockResolvedValue();
    streamingManager.shutdown.mockResolvedValue();
    streamingManager.getStatus.mockReturnValue({ state: 'ready', timestamp: Date.now() });
    streamingManager.isInitialized.mockReturnValue(true);
    streamingManager.isStreamingURL.mockResolvedValue(false);

    // Create URL processor with mocked dependencies
    urlProcessor = new URLProcessor({
      id: 'test-url-processor',
      maxRetries: 3,
      retryDelay: 100,
      timeoutMs: 1000,
      securityCheckEnabled: true
    });

    // Replace private properties with mocks
    (urlProcessor as any).stagehandClient = stagehandClient;
    (urlProcessor as any).metadataExtractor = metadataExtractor;
    (urlProcessor as any).historyManager = historyManager;
    (urlProcessor as any).streamingManager = streamingManager;
  });

  describe('Initialization and Shutdown', () => {
    test('should initialize all dependencies', async () => {
      await urlProcessor.initialize();

      expect(stagehandClient.initialize).toHaveBeenCalled();
      expect(metadataExtractor.initialize).toHaveBeenCalled();
      expect(historyManager.initialize).toHaveBeenCalled();
      expect(streamingManager.initialize).toHaveBeenCalled();
      expect(urlProcessor.getStatus().state).toBe('ready');
    });

    test('should handle initialization errors', async () => {
      stagehandClient.initialize.mockRejectedValue(new Error('Initialization error'));

      await expect(urlProcessor.initialize()).rejects.toThrow('Initialization error');
      expect(urlProcessor.getStatus().state).toBe('error');
    });

    test('should shutdown all dependencies', async () => {
      await urlProcessor.initialize();
      await urlProcessor.shutdown();

      expect(stagehandClient.shutdown).toHaveBeenCalled();
      expect(metadataExtractor.shutdown).toHaveBeenCalled();
      expect(historyManager.shutdown).toHaveBeenCalled();
      expect(streamingManager.shutdown).toHaveBeenCalled();
      expect(urlProcessor.getStatus().state).toBe('shutdown');
    });
  });

  describe('URL Validation', () => {
    beforeEach(async () => {
      await urlProcessor.initialize();
    });

    test('should validate a valid URL', async () => {
      const result = await urlProcessor.validateURL('https://example.com/audio.mp3');

      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/audio.mp3');
    });

    test('should add protocol if missing', async () => {
      const result = await urlProcessor.validateURL('example.com/audio.mp3');

      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/audio.mp3');
    });

    test('should reject invalid URLs', async () => {
      const result = await urlProcessor.validateURL('not a url');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should check security if enabled', async () => {
      await urlProcessor.validateURL('https://example.com/audio.mp3');

      expect(stagehandClient.checkURLSecurity).toHaveBeenCalledWith('https://example.com/audio.mp3');
    });

    test('should reject malicious URLs', async () => {
      stagehandClient.checkURLSecurity.mockResolvedValue({
        status: 'malicious',
        details: { threatType: 'malware', confidence: 0.95 }
      });

      const result = await urlProcessor.validateURL('https://malware-example.com/audio.mp3');

      expect(result.isValid).toBe(false);
      expect(result.securityStatus).toBe('malicious');
      expect(result.error).toBeDefined();
    });
  });

  describe('URL Processing', () => {
    beforeEach(async () => {
      await urlProcessor.initialize();
    });

    test('should process a valid URL successfully', async () => {
      streamingManager.isStreamingURL.mockResolvedValue(false);

      const result = await urlProcessor.processURL('https://example.com/audio.mp3');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.url).toBe('https://example.com/audio.mp3');
      expect(result.data?.isStreaming).toBe(false);
      expect(result.data?.metadata).toBeDefined();
      expect(historyManager.addToHistory).toHaveBeenCalled();
    });

    test('should detect streaming URLs', async () => {
      streamingManager.isStreamingURL.mockResolvedValue(true);

      const result = await urlProcessor.processURL('https://example.com/audio.mp3');

      expect(result.success).toBe(true);
      expect(result.data?.isStreaming).toBe(true);
    });

    test('should retry on failure', async () => {
      metadataExtractor.extractMetadata
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          url: 'https://example.com/audio.mp3',
          domain: 'example.com',
          extractedAt: Date.now()
        });

      const result = await urlProcessor.processURL('https://example.com/audio.mp3');

      expect(result.success).toBe(true);
      expect(metadataExtractor.extractMetadata).toHaveBeenCalledTimes(2);
    });

    test('should fail after max retries', async () => {
      metadataExtractor.extractMetadata.mockRejectedValue(new Error('Persistent error'));

      const result = await urlProcessor.processURL('https://example.com/audio.mp3');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(metadataExtractor.extractMetadata).toHaveBeenCalledTimes(3); // maxRetries
    });
  });

  describe('Streaming', () => {
    beforeEach(async () => {
      await urlProcessor.initialize();
      streamingManager.isStreamingURL.mockResolvedValue(true);
      streamingManager.prepareStreaming.mockResolvedValue({
        id: 'test-session',
        url: 'https://example.com/audio.mp3',
        startedAt: Date.now(),
        status: 'paused',
        currentTime: 0,
        duration: 180,
        bufferLevel: 30,
        options: { quality: 'medium' }
      });
    });

    test('should prepare a URL for streaming', async () => {
      const result = await urlProcessor.prepareForStreaming('https://example.com/audio.mp3');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('test-session');
      expect(streamingManager.prepareStreaming).toHaveBeenCalledWith('https://example.com/audio.mp3');
    });

    test('should validate URL before streaming', async () => {
      await urlProcessor.prepareForStreaming('https://example.com/audio.mp3');

      // The validateURL method should be called internally
      expect(stagehandClient.checkURLSecurity).toHaveBeenCalled();
    });

    test('should fail if URL is not suitable for streaming', async () => {
      streamingManager.isStreamingURL.mockResolvedValue(false);

      const result = await urlProcessor.prepareForStreaming('https://example.com/audio.mp3');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

describe('URL Processing Integration', () => {
  let urlProcessingIntegration: URLProcessingIntegration;
  let serviceRegistry: jest.Mocked<ServiceRegistry>;
  let mockAudioProcessingService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock service registry
    serviceRegistry = new ServiceRegistry() as jest.Mocked<ServiceRegistry>;

    // Create mock audio processing service
    mockAudioProcessingService = {
      processAudioFromURL: jest.fn().mockResolvedValue({}),
      setupStreamingAudio: jest.fn().mockResolvedValue({})
    };

    // Setup service registry mock
    serviceRegistry.registerService.mockImplementation();
    serviceRegistry.getService.mockResolvedValue(mockAudioProcessingService);

    // Create integration service with mocked dependencies
    urlProcessingIntegration = new URLProcessingIntegration(
      {
        id: 'test-url-integration',
        audioProcessingServiceId: 'audio-service',
        visualizationServiceId: 'visualization-service'
      },
      serviceRegistry
    );

    // Mock URL processor
    const mockUrlProcessor = {
      initialize: jest.fn().mockResolvedValue({}),
      shutdown: jest.fn().mockResolvedValue({}),
      getStatus: jest.fn().mockReturnValue({ state: 'ready', timestamp: Date.now() }),
      isInitialized: jest.fn().mockReturnValue(true),
      processURL: jest.fn().mockResolvedValue({
        success: true,
        data: {
          url: 'https://example.com/audio.mp3',
          normalizedUrl: 'https://example.com/audio.mp3',
          isStreaming: false,
          securityStatus: 'safe',
          metadata: { audio: { format: 'mp3' } },
          processingTime: 100
        },
        metadata: {
          duration: 100,
          timestamp: Date.now()
        }
      }),
      prepareForStreaming: jest.fn().mockResolvedValue({
        success: true,
        data: {
          id: 'test-session',
          url: 'https://example.com/audio.mp3',
          startedAt: Date.now(),
          status: 'paused'
        },
        metadata: {
          duration: 50,
          timestamp: Date.now()
        }
      })
    };

    // Replace URL processor with mock
    (urlProcessingIntegration as any).urlProcessor = mockUrlProcessor;
  });

  test('should initialize and register with service registry', async () => {
    await urlProcessingIntegration.initialize();

    expect(serviceRegistry.registerService).toHaveBeenCalledWith(
      'test-url-integration',
      urlProcessingIntegration
    );
    expect((urlProcessingIntegration as any).urlProcessor.initialize).toHaveBeenCalled();
  });

  test('should process URL and integrate with audio processing', async () => {
    await urlProcessingIntegration.initialize();

    const result = await urlProcessingIntegration.processURLAndIntegrate('https://example.com/audio.mp3');

    expect(result.success).toBe(true);
    expect((urlProcessingIntegration as any).urlProcessor.processURL).toHaveBeenCalledWith('https://example.com/audio.mp3');
    expect(serviceRegistry.getService).toHaveBeenCalledWith('audio-service');
    expect(mockAudioProcessingService.processAudioFromURL).toHaveBeenCalled();
  });

  test('should prepare streaming and integrate with audio processing', async () => {
    await urlProcessingIntegration.initialize();

    // Mock URL processor to return streaming URL
    (urlProcessingIntegration as any).urlProcessor.processURL.mockResolvedValue({
      success: true,
      data: {
        url: 'https://example.com/audio.mp3',
        normalizedUrl: 'https://example.com/audio.mp3',
        isStreaming: true,
        securityStatus: 'safe',
        metadata: { audio: { format: 'mp3' } },
        processingTime: 100
      },
      metadata: {
        duration: 100,
        timestamp: Date.now()
      }
    });

    const result = await urlProcessingIntegration.processURLAndIntegrate('https://example.com/audio.mp3');

    expect(result.success).toBe(true);
    expect((urlProcessingIntegration as any).urlProcessor.prepareForStreaming).toHaveBeenCalled();
  });

  test('should handle errors in URL processing', async () => {
    await urlProcessingIntegration.initialize();

    // Mock URL processor to return error
    (urlProcessingIntegration as any).urlProcessor.processURL.mockResolvedValue({
      success: false,
      error: new Error('Processing error'),
      metadata: {
        duration: 100,
        timestamp: Date.now()
      }
    });

    const result = await urlProcessingIntegration.processURLAndIntegrate('https://example.com/audio.mp3');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockAudioProcessingService.processAudioFromURL).not.toHaveBeenCalled();
  });

  test('should handle errors in audio processing integration', async () => {
    await urlProcessingIntegration.initialize();

    // Mock audio processing service to throw error
    mockAudioProcessingService.processAudioFromURL.mockRejectedValue(new Error('Integration error'));

    const result = await urlProcessingIntegration.processURLAndIntegrate('https://example.com/audio.mp3');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
