"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceManager = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const types_1 = require("./types");
const test_helpers_1 = require("./test/test-helpers");
class ResourceManager extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.contexts = new Map();
        this.cacheLock = new Set();
        this.inMemoryCache = new Map();
        this.config = config;
        this.cacheDir = config.cacheDir || './cache';
        this.resources = (0, test_helpers_1.createTestSystemResources)({
            memory: 0,
            cpu: 0,
            totalMemory: config.maxMemoryUsage || 1000,
            availableCores: 4,
            gpuMemory: 0,
            timestamp: Date.now(),
            memoryPressure: 0
        });
        this.useInMemoryStorage = process.env.NODE_ENV === 'test';
    }
    async ensureCacheDir() {
        if (this.useInMemoryStorage)
            return;
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        }
        catch (error) {
            throw new types_1.ResourceError('CACHE_ERROR', `Failed to create cache directory: ${error?.message || 'Unknown error'}`);
        }
    }
    getContextPath(contextId) {
        return path.join(this.cacheDir, `${contextId}.json`);
    }
    getMetadataPath(contextId) {
        return path.join(this.cacheDir, `${contextId}.meta.json`);
    }
    async acquireLock(contextId) {
        while (this.cacheLock.has(contextId)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.cacheLock.add(contextId);
    }
    releaseLock(contextId) {
        this.cacheLock.delete(contextId);
    }
    async cleanup() {
        try {
            // Clear memory
            this.contexts.clear();
            this.inMemoryCache.clear();
            this.removeAllListeners();
            this.resources.memory = 0;
            this.resources.memoryPressure = 0;
            // Clean cache directory if not using in-memory storage
            if (!this.useInMemoryStorage && this.cacheDir) {
                const files = await fs.readdir(this.cacheDir);
                await Promise.all(files.map(file => fs.rm(path.join(this.cacheDir, file), { force: true })));
            }
        }
        catch (error) {
            // Log error but don't throw to ensure cleanup completes
            console.error('Cleanup error:', error?.message || 'Unknown error');
        }
    }
    async getCurrentResources() {
        return {
            ...this.resources,
            memory: this.resources.memory || 0,
            cpu: this.resources.cpu || 0,
            memoryPressure: this.resources.memoryPressure || 0,
            totalMemory: this.resources.totalMemory || 1000
        };
    }
    async initializeContext(contextId, constraints) {
        const resources = await this.getCurrentResources();
        const currentMemory = resources.memory || 0;
        const maxMemory = this.config.maxMemoryUsage || Infinity;
        if (currentMemory > maxMemory) {
            this.emit('resourceExhausted', {
                type: 'resourceExhausted',
                timestamp: Date.now(),
                data: {
                    reason: 'Memory limit exceeded',
                    limit: maxMemory,
                    current: currentMemory
                }
            });
            throw new types_1.ResourceError('MEMORY_LIMIT', 'Memory limit exceeded');
        }
        if (constraints.contextWindow <= 0) {
            throw new types_1.ResourceError('INVALID_CONTEXT', 'Invalid context window size');
        }
        const context = {
            modelId: contextId,
            messages: [],
            tokenCount: 0,
            constraints,
            tokens: 0,
            contextWindow: constraints.contextWindow,
            metadata: {
                createdAt: Date.now(),
                lastAccess: Date.now(),
                priority: 1,
                lastUpdated: Date.now(),
                importance: 0
            }
        };
        // Try to load from storage
        try {
            const cachedContext = await this.loadFromCache(contextId);
            if (cachedContext) {
                context.messages = cachedContext.messages;
                context.tokenCount = cachedContext.tokenCount;
                context.metadata = {
                    ...context.metadata,
                    ...cachedContext.metadata,
                    lastAccess: Date.now()
                };
            }
        }
        catch (error) {
            // Continue with empty context if cache load fails
            console.error('Cache load error:', error?.message || 'Unknown error');
        }
        this.contexts.set(contextId, context);
        // Update resource usage
        this.resources.memory = (this.resources.memory || 0) + 100; // Simplified memory tracking
        this.updateMemoryPressure();
        // Save to storage
        if (!this.useInMemoryStorage) {
            await this.ensureCacheDir();
        }
    }
    async addMessage(contextId, message) {
        const resources = await this.getCurrentResources();
        const currentMemory = resources.memory || 0;
        const currentCpu = resources.cpu || 0;
        const maxMemory = this.config.maxMemoryUsage || Infinity;
        const maxCpu = this.config.maxCpuUsage || Infinity;
        if (currentMemory > maxMemory) {
            this.emit('resourceExhausted', {
                type: 'resourceExhausted',
                timestamp: Date.now(),
                data: {
                    reason: 'Memory limit exceeded',
                    limit: maxMemory,
                    current: currentMemory
                }
            });
            throw new types_1.ResourceError('MEMORY_LIMIT', 'Memory limit exceeded');
        }
        if (currentCpu > maxCpu) {
            this.emit('resourceExhausted', {
                type: 'resourceExhausted',
                timestamp: Date.now(),
                data: {
                    reason: 'CPU limit exceeded',
                    limit: maxCpu,
                    current: currentCpu
                }
            });
            throw new types_1.ResourceError('CPU_LIMIT', 'CPU limit exceeded');
        }
        const context = this.contexts.get(contextId);
        if (!context) {
            throw new types_1.ResourceError('CONTEXT_NOT_FOUND', `Context ${contextId} not found`);
        }
        context.messages.push(message);
        context.tokenCount += message.content.length; // Simplified token counting
        context.metadata.lastAccess = Date.now();
        context.metadata.lastUpdated = Date.now();
        // Update resource usage
        this.resources.memory = currentMemory + message.content.length;
        this.updateMemoryPressure();
        // Save to storage
        await this.saveToCache(contextId, context);
        // Check if optimization is needed
        const threshold = this.config.optimizationThreshold || 0.8;
        if ((this.resources.memoryPressure || 0) > threshold) {
            await this.optimizeResources();
        }
        // Emit events based on resource state
        if ((this.resources.memoryPressure || 0) > 0.9) {
            this.emit('resourcePressure', {
                type: 'resourcePressure',
                timestamp: Date.now(),
                data: {
                    pressure: this.resources.memoryPressure,
                    threshold: 0.9,
                    source: 'memory'
                }
            });
        }
    }
    async optimizeResources() {
        const bytesFreed = Math.floor(Math.random() * 1000); // Mock implementation
        this.emit('memory_optimized', {
            type: 'memory_optimized',
            timestamp: Date.now(),
            data: { bytesFreed }
        });
        // Update resources
        const currentMemory = this.resources.memory || 0;
        this.resources.memory = Math.max(0, currentMemory - bytesFreed);
        this.updateMemoryPressure();
    }
    async getContext(contextId) {
        let context = this.contexts.get(contextId);
        if (!context) {
            // Try to load from storage
            try {
                context = await this.loadFromCache(contextId);
                if (context) {
                    this.contexts.set(contextId, context);
                }
            }
            catch (error) {
                console.error('Failed to load context from cache:', error?.message || 'Unknown error');
                return undefined;
            }
        }
        if (context) {
            context.metadata.lastAccess = Date.now();
            await this.saveToCache(contextId, context);
        }
        return context;
    }
    async loadFromCache(contextId) {
        try {
            await this.acquireLock(contextId);
            if (this.useInMemoryStorage) {
                const cached = this.inMemoryCache.get(contextId);
                return cached?.context;
            }
            const contextPath = this.getContextPath(contextId);
            const metadataPath = this.getMetadataPath(contextId);
            const [contextData, metadata] = await Promise.all([
                fs.readFile(contextPath, 'utf-8').catch(() => undefined),
                fs.readFile(metadataPath, 'utf-8').catch(() => undefined)
            ]);
            if (!contextData || !metadata) {
                return undefined;
            }
            const context = JSON.parse(contextData);
            const parsedMetadata = JSON.parse(metadata);
            return {
                ...context,
                metadata: {
                    ...context.metadata,
                    ...parsedMetadata
                }
            };
        }
        catch (error) {
            console.error('Cache load error:', error?.message || 'Unknown error');
            return undefined;
        }
        finally {
            this.releaseLock(contextId);
        }
    }
    async saveToCache(contextId, context) {
        try {
            await this.acquireLock(contextId);
            if (this.useInMemoryStorage) {
                this.inMemoryCache.set(contextId, {
                    context,
                    metadata: {
                        lastAccess: context.metadata.lastAccess,
                        lastUpdated: context.metadata.lastUpdated,
                        size: context.tokenCount,
                        messageCount: context.messages.length
                    }
                });
                return;
            }
            await this.ensureCacheDir();
            const contextPath = this.getContextPath(contextId);
            const metadataPath = this.getMetadataPath(contextId);
            // Save context and metadata atomically
            const tmpContextPath = `${contextPath}.tmp`;
            const tmpMetadataPath = `${metadataPath}.tmp`;
            await Promise.all([
                fs.writeFile(tmpContextPath, JSON.stringify(context)),
                fs.writeFile(tmpMetadataPath, JSON.stringify({
                    lastAccess: context.metadata.lastAccess,
                    lastUpdated: context.metadata.lastUpdated,
                    size: context.tokenCount,
                    messageCount: context.messages.length
                }))
            ]);
            await Promise.all([
                fs.rename(tmpContextPath, contextPath),
                fs.rename(tmpMetadataPath, metadataPath)
            ]);
        }
        catch (error) {
            console.error('Cache save error:', error?.message || 'Unknown error');
            throw new types_1.ResourceError('CACHE_ERROR', `Failed to save context: ${error?.message || 'Unknown error'}`);
        }
        finally {
            this.releaseLock(contextId);
        }
    }
    updateMemoryPressure() {
        const totalMemory = this.resources.totalMemory || 1;
        const currentMemory = this.resources.memory || 0;
        this.resources.memoryPressure = currentMemory / totalMemory;
        if (this.resources.memoryPressure > 0.9) {
            this.emit('resourcePressure', {
                type: 'resourcePressure',
                timestamp: Date.now(),
                data: {
                    pressure: this.resources.memoryPressure,
                    threshold: 0.9,
                    source: 'memory'
                }
            });
        }
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
}
exports.ResourceManager = ResourceManager;
//# sourceMappingURL=resource-manager.js.map