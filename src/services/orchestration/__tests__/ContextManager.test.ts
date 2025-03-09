import { ContextManager, ContextTransformOptions } from '../ContextManager';
import { ContextManager as BaseContextManager } from '../../../context/context-manager';

// Mock the base ContextManager
jest.mock('../../../context/context-manager');

describe('ContextManager', () => {
  let contextManager: ContextManager;
  let mockBaseContextManager: jest.Mocked<BaseContextManager>;

  beforeEach(() => {
    // Create a mock base ContextManager
    mockBaseContextManager = new BaseContextManager() as jest.Mocked<BaseContextManager>;

    // Create a ContextManager with the mock base ContextManager
    contextManager = new ContextManager(mockBaseContextManager, {
      maxSize: 1024 * 1024, // 1MB
      ttl: 60 * 1000, // 1 minute
      pruneInterval: 30 * 1000 // 30 seconds
    });

    // Mock the createContextSizeEstimator method
    (contextManager as any).createContextSizeEstimator = jest.fn().mockReturnValue(() => 1000);

    // Mock the startAutomaticPruning method
    (contextManager as any).startAutomaticPruning = jest.fn();
  });

  afterEach(() => {
    // Clean up
    contextManager.dispose();
  });

  describe('getContextForModel', () => {
    it('should get context from the base context manager when not in cache', async () => {
      // Mock the base context manager's getContextForModel method
      const mockContext = { key: 'value' };
      mockBaseContextManager.getContextForModel.mockResolvedValue(mockContext);

      // Call the method
      const result = await contextManager.getContextForModel('gama', {
        types: ['audio_parameters'],
        minPriority: 1
      });

      // Verify the result
      expect(result).toEqual(mockContext);
      expect(mockBaseContextManager.getContextForModel).toHaveBeenCalledWith('gama', {
        types: ['audio_parameters'],
        minPriority: 1
      });
    });

    it('should return cached context when available', async () => {
      // Mock the base context manager's getContextForModel method
      const mockContext = { key: 'value' };
      mockBaseContextManager.getContextForModel.mockResolvedValue(mockContext);

      // Call the method once to cache the result
      await contextManager.getContextForModel('gama', {
        types: ['audio_parameters'],
        minPriority: 1
      });

      // Call the method again
      const result = await contextManager.getContextForModel('gama', {
        types: ['audio_parameters'],
        minPriority: 1
      });

      // Verify the result
      expect(result).toEqual(mockContext);

      // Verify that the base context manager was only called once
      expect(mockBaseContextManager.getContextForModel).toHaveBeenCalledTimes(1);
    });

    it('should remove expired items from cache', async () => {
      // Mock the base context manager's getContextForModel method
      const mockContext = { key: 'value' };
      mockBaseContextManager.getContextForModel.mockResolvedValue(mockContext);

      // Mock Date.now to control time
      const originalDateNow = Date.now;
      const mockNow = jest.fn();
      Date.now = mockNow;

      // Set initial time
      mockNow.mockReturnValue(1000);

      // Call the method once to cache the result
      await contextManager.getContextForModel('gama', {
        types: ['audio_parameters'],
        minPriority: 1
      });

      // Advance time beyond TTL
      mockNow.mockReturnValue(1000 + 61 * 1000); // 61 seconds later

      // Call the method again
      await contextManager.getContextForModel('gama', {
        types: ['audio_parameters'],
        minPriority: 1
      });

      // Verify that the base context manager was called twice
      expect(mockBaseContextManager.getContextForModel).toHaveBeenCalledTimes(2);

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('getTransformedContext', () => {
    it('should transform context using registered transformer', async () => {
      // Create a source context
      const sourceContext = {
        audioParameters: {
          sampleRate: 44100,
          channels: 2,
          format: 'wav'
        },
        processingRequirements: {
          quality: 'high'
        }
      };

      // Register a transformer
      contextManager.registerContextTransformer('wav2vec2', 'gama', (context) => ({
        ...context,
        audioParameters: {
          ...context.audioParameters,
          format: 'float32',
          normalized: true
        }
      }));

      // Call the method
      const result = await contextManager.getTransformedContext('wav2vec2', 'gama', sourceContext);

      // Verify the result
      expect(result.audioParameters.format).toBe('float32');
      expect(result.audioParameters.normalized).toBe(true);
      expect(result.audioParameters.sampleRate).toBe(44100);
      expect(result.processingRequirements.quality).toBe('high');
    });

    it('should return source context if no transformer is found', async () => {
      // Create a source context
      const sourceContext = {
        audioParameters: {
          sampleRate: 44100,
          channels: 2,
          format: 'wav'
        }
      };

      // Call the method with no registered transformer
      const result = await contextManager.getTransformedContext('wav2vec2', 'gama', sourceContext);

      // Verify the result is the same as the source context
      expect(result).toEqual(sourceContext);
    });

    it('should cache transformed contexts', async () => {
      // Create a source context
      const sourceContext = {
        audioParameters: {
          sampleRate: 44100,
          channels: 2,
          format: 'wav'
        }
      };

      // Create a spy for the transformer
      const transformerSpy = jest.fn((context) => ({
        ...context,
        audioParameters: {
          ...context.audioParameters,
          format: 'float32'
        }
      }));

      // Register the transformer
      contextManager.registerContextTransformer('wav2vec2', 'gama', transformerSpy);

      // Call the method twice
      await contextManager.getTransformedContext('wav2vec2', 'gama', sourceContext);
      await contextManager.getTransformedContext('wav2vec2', 'gama', sourceContext);

      // Verify that the transformer was only called once
      expect(transformerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('createTransformer', () => {
    it('should create a transformer that applies the specified transformations', () => {
      // Create transformation options
      const options: ContextTransformOptions = {
        sourceModelType: 'wav2vec2',
        targetModelType: 'gama',
        transformations: {
          audioParameters: (params) => ({
            ...params,
            format: 'float32',
            normalized: true
          })
        }
      };

      // Create the transformer
      const transformer = contextManager.createTransformer(options);

      // Create a source context
      const sourceContext = {
        audioParameters: {
          sampleRate: 44100,
          channels: 2,
          format: 'wav'
        },
        processingRequirements: {
          quality: 'high'
        }
      };

      // Apply the transformer
      const result = transformer(sourceContext);

      // Verify the result
      expect(result.audioParameters.format).toBe('float32');
      expect(result.audioParameters.normalized).toBe(true);
      expect(result.audioParameters.sampleRate).toBe(44100);
      expect(result.processingRequirements.quality).toBe('high');
      expect(result._transformationMetadata).toBeDefined();
      expect(result._transformationMetadata.sourceModelType).toBe('wav2vec2');
      expect(result._transformationMetadata.targetModelType).toBe('gama');
    });

    it('should filter keys if filterKeys is specified', () => {
      // Create transformation options
      const options: ContextTransformOptions = {
        sourceModelType: 'wav2vec2',
        targetModelType: 'gama',
        filterKeys: ['processingRequirements']
      };

      // Create the transformer
      const transformer = contextManager.createTransformer(options);

      // Create a source context
      const sourceContext = {
        audioParameters: {
          sampleRate: 44100,
          channels: 2,
          format: 'wav'
        },
        processingRequirements: {
          quality: 'high'
        }
      };

      // Apply the transformer
      const result = transformer(sourceContext);

      // Verify the result
      expect(result.audioParameters).toBeDefined();
      expect(result.processingRequirements).toBeUndefined();
    });

    it('should preserve only specified keys if preserveKeys is specified', () => {
      // Create transformation options
      const options: ContextTransformOptions = {
        sourceModelType: 'wav2vec2',
        targetModelType: 'gama',
        preserveKeys: ['audioParameters']
      };

      // Create the transformer
      const transformer = contextManager.createTransformer(options);

      // Create a source context
      const sourceContext = {
        audioParameters: {
          sampleRate: 44100,
          channels: 2,
          format: 'wav'
        },
        processingRequirements: {
          quality: 'high'
        }
      };

      // Apply the transformer
      const result = transformer(sourceContext);

      // Verify the result
      expect(result.audioParameters).toBeDefined();
      expect(result.processingRequirements).toBeUndefined();
    });
  });

  describe('registerDefaultTransformers', () => {
    it('should register transformers for common model pairs', () => {
      // Spy on the registerContextTransformer method
      const spy = jest.spyOn(contextManager, 'registerContextTransformer');

      // Call the method
      contextManager.registerDefaultTransformers();

      // Verify that transformers were registered
      expect(spy).toHaveBeenCalledWith('wav2vec2', 'gama', expect.any(Function));
      expect(spy).toHaveBeenCalledWith('audioldm', 'gama', expect.any(Function));
      expect(spy).toHaveBeenCalledWith('gama', 'wav2vec2', expect.any(Function));
      expect(spy).toHaveBeenCalledWith('*', 'reasoning', expect.any(Function));
    });
  });

  describe('pruneCache', () => {
    it('should remove items from cache to free up space', () => {
      // Mock the cache with some items
      (contextManager as any).contextCache.set('key1', {
        context: { data: 'value1' },
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now() - 5000,
        size: 500
      });

      (contextManager as any).contextCache.set('key2', {
        context: { data: 'value2' },
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now() - 10000,
        size: 500
      });

      (contextManager as any).totalCacheSize = 1000;

      // Call the method to free up 600 bytes
      (contextManager as any).pruneCache(600);

      // Verify that the oldest item was removed
      expect((contextManager as any).contextCache.has('key2')).toBe(false);
      expect((contextManager as any).contextCache.has('key1')).toBe(true);
      expect((contextManager as any).totalCacheSize).toBe(500);
    });
  });

  describe('getStats', () => {
    it('should return statistics about the context manager', () => {
      // Add some items to the cache
      (contextManager as any).contextCache.set('key1', {
        context: { data: 'value1' },
        timestamp: Date.now(),
        accessCount: 2,
        lastAccessed: Date.now(),
        size: 500
      });

      (contextManager as any).totalCacheSize = 500;

      // Register some transformers
      contextManager.registerContextTransformer('wav2vec2', 'gama', () => ({}));
      contextManager.registerContextTransformer('audioldm', 'gama', () => ({}));

      // Call the method
      const stats = contextManager.getStats();

      // Verify the result
      expect(stats.cacheSize).toBe(500);
      expect(stats.cacheItemCount).toBe(1);
      expect(stats.transformerCount).toBe(2);
      expect(stats.cacheHitRate).toBe(0.5); // 1 hit out of 2 accesses
    });
  });
});
