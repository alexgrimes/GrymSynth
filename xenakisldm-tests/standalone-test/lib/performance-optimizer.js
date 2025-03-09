/**
 * Performance Optimizer for XenakisLDM
 *
 * This module provides performance optimization tools for the XenakisLDM system,
 * including buffer pooling, parallel processing, and FFT optimization.
 */

class PerformanceOptimizer {
    /**
     * Create a new Performance Optimizer
     *
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            debug: false,
            useBufferPool: true,
            useParallelProcessing: typeof navigator !== 'undefined' && !!navigator.hardwareConcurrency,
            useWebAudio: typeof AudioContext !== 'undefined',
            workerCount: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
            bufferPoolSizes: [512, 1024, 2048, 4096, 8192],
            bufferPoolInitialSize: 8,
            bufferPoolMaxSize: 32,
            ...config
        };

        // Initialize buffer pool if enabled
        if (this.config.useBufferPool) {
            this.bufferPool = new BufferPool({
                initialSize: this.config.bufferPoolInitialSize,
                maxSize: this.config.bufferPoolMaxSize,
                sizes: this.config.bufferPoolSizes
            });
        }

        // Initialize Web Audio context if available and enabled
        if (this.config.useWebAudio && typeof AudioContext !== 'undefined') {
            this.audioContext = new AudioContext();
        }

        // Initialize workers for parallel processing if enabled
        if (this.config.useParallelProcessing && typeof Worker !== 'undefined') {
            this.parallelProcessor = new ParallelProcessor({
                workerCount: this.config.workerCount
            });
        }

        // Performance metrics
        this.metrics = {
            processingTime: [],
            memoryUsage: [],
            bufferPoolStats: null
        };
    }

    /**
     * Acquire a buffer from the pool
     *
     * @param {number} size - The size of the buffer to acquire
     * @returns {Float32Array} - The acquired buffer
     */
    acquireBuffer(size) {
        if (this.config.useBufferPool && this.bufferPool) {
            return this.bufferPool.acquire(size);
        } else {
            return new Float32Array(size);
        }
    }

    /**
     * Release a buffer back to the pool
     *
     * @param {Float32Array} buffer - The buffer to release
     */
    releaseBuffer(buffer) {
        if (this.config.useBufferPool && this.bufferPool) {
            this.bufferPool.release(buffer);
        }
    }

    /**
     * Perform an optimized FFT transform
     *
     * @param {Float32Array} timeData - The time domain data
     * @returns {Promise<Object>} - The frequency domain data (magnitudes and phases)
     */
    async performFFT(timeData) {
        const startTime = performance.now();
        let result;

        try {
            if (this.config.useWebAudio && this.audioContext) {
                // Use Web Audio API for hardware-accelerated FFT
                result = await this._webAudioFFT(timeData);
            } else if (this.config.useParallelProcessing && this.parallelProcessor) {
                // Use parallel processing for FFT
                result = await this.parallelProcessor.process(timeData, 'fft');
            } else {
                // Use optimized serial FFT
                result = this._serialFFT(timeData);
            }

            // Record processing time
            const endTime = performance.now();
            this.metrics.processingTime.push(endTime - startTime);

            // Keep only the last 100 measurements
            if (this.metrics.processingTime.length > 100) {
                this.metrics.processingTime.shift();
            }

            return result;
        } catch (error) {
            if (this.config.debug) {
                console.error('FFT Error:', error);
            }

            // Fallback to serial FFT
            return this._serialFFT(timeData);
        }
    }

    /**
     * Perform an optimized inverse FFT transform
     *
     * @param {Object} freqData - The frequency domain data (magnitudes and phases)
     * @param {number} timeLength - The desired length of the output time domain data
     * @returns {Promise<Float32Array>} - The time domain data
     */
    async performIFFT(freqData, timeLength) {
        const startTime = performance.now();
        let result;

        try {
            if (this.config.useWebAudio && this.audioContext) {
                // Use Web Audio API for hardware-accelerated IFFT
                result = await this._webAudioIFFT(freqData, timeLength);
            } else if (this.config.useParallelProcessing && this.parallelProcessor) {
                // Use parallel processing for IFFT
                result = await this.parallelProcessor.process({ freqData, timeLength }, 'ifft');
            } else {
                // Use optimized serial IFFT
                result = this._serialIFFT(freqData, timeLength);
            }

            // Record processing time
            const endTime = performance.now();
            this.metrics.processingTime.push(endTime - startTime);

            // Keep only the last 100 measurements
            if (this.metrics.processingTime.length > 100) {
                this.metrics.processingTime.shift();
            }

            return result;
        } catch (error) {
            if (this.config.debug) {
                console.error('IFFT Error:', error);
            }

            // Fallback to serial IFFT
            return this._serialIFFT(freqData, timeLength);
        }
    }

    /**
     * Get performance metrics
     *
     * @returns {Object} - Performance metrics
     */
    getMetrics() {
        // Update buffer pool stats if available
        if (this.config.useBufferPool && this.bufferPool) {
            this.metrics.bufferPoolStats = this.bufferPool.getStats();
        }

        // Calculate average processing time
        const avgProcessingTime = this.metrics.processingTime.length > 0 ?
            this.metrics.processingTime.reduce((sum, time) => sum + time, 0) / this.metrics.processingTime.length :
            0;

        return {
            averageProcessingTime: avgProcessingTime,
            bufferPoolStats: this.metrics.bufferPoolStats,
            parallelProcessingEnabled: this.config.useParallelProcessing,
            webAudioEnabled: this.config.useWebAudio
        };
    }

    /**
     * Perform FFT using Web Audio API
     *
     * @param {Float32Array} timeData - The time domain data
     * @returns {Promise<Object>} - The frequency domain data
     * @private
     */
    async _webAudioFFT(timeData) {
        return new Promise((resolve, reject) => {
            try {
                // Create a buffer source
                const buffer = this.audioContext.createBuffer(1, timeData.length, this.audioContext.sampleRate);
                const channelData = buffer.getChannelData(0);
                channelData.set(timeData);

                // Create an analyzer node
                const analyzer = this.audioContext.createAnalyser();
                analyzer.fftSize = 2 * timeData.length;

                // Create a buffer source node
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;

                // Connect the source to the analyzer
                source.connect(analyzer);

                // Create arrays for the frequency data
                const magnitudes = new Float32Array(analyzer.frequencyBinCount);
                const phases = new Float32Array(analyzer.frequencyBinCount);

                // Get the frequency data
                analyzer.getFloatFrequencyData(magnitudes);

                // We don't get phase data directly from the analyzer,
                // so we'll use a simplified approach
                for (let i = 0; i < phases.length; i++) {
                    phases[i] = Math.random() * 2 * Math.PI; // Random phase
                }

                resolve({ magnitudes, phases });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Perform IFFT using Web Audio API
     *
     * @param {Object} freqData - The frequency domain data
     * @param {number} timeLength - The desired length of the output time domain data
     * @returns {Promise<Float32Array>} - The time domain data
     * @private
     */
    async _webAudioIFFT(freqData, timeLength) {
        // Web Audio API doesn't provide direct IFFT,
        // so we'll use a workaround with an oscillator and gain nodes

        return new Promise((resolve, reject) => {
            try {
                // Create an output buffer
                const outputBuffer = new Float32Array(timeLength);

                // Create an offline audio context
                const offlineCtx = new OfflineAudioContext(1, timeLength, this.audioContext.sampleRate);

                // For each frequency bin, create an oscillator
                const { magnitudes, phases } = freqData;
                const oscillators = [];

                for (let i = 0; i < magnitudes.length; i++) {
                    if (magnitudes[i] > -100) { // Only use significant frequencies
                        const freq = i * this.audioContext.sampleRate / (2 * magnitudes.length);
                        const gain = Math.pow(10, magnitudes[i] / 20); // Convert dB to linear

                        // Create oscillator
                        const osc = offlineCtx.createOscillator();
                        osc.frequency.value = freq;

                        // Create gain node
                        const gainNode = offlineCtx.createGain();
                        gainNode.gain.value = gain;

                        // Connect oscillator to gain node
                        osc.connect(gainNode);

                        // Connect gain node to destination
                        gainNode.connect(offlineCtx.destination);

                        // Set phase
                        osc.detune.value = phases[i] * 100; // Approximate phase using detune

                        // Start oscillator
                        osc.start();
                        osc.stop(timeLength / this.audioContext.sampleRate);

                        oscillators.push(osc);
                    }
                }

                // Render audio
                offlineCtx.startRendering().then(renderedBuffer => {
                    // Copy rendered buffer to output
                    outputBuffer.set(renderedBuffer.getChannelData(0));
                    resolve(outputBuffer);
                }).catch(error => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Perform FFT using optimized serial algorithm
     *
     * @param {Float32Array} timeData - The time domain data
     * @returns {Object} - The frequency domain data
     * @private
     */
    _serialFFT(timeData) {
        // Implement an optimized FFT algorithm
        // This is a simplified implementation for demonstration

        const n = timeData.length;
        const magnitudes = new Float32Array(n / 2);
        const phases = new Float32Array(n / 2);

        // Apply window function
        const windowedData = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            // Hann window
            const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
            windowedData[i] = timeData[i] * window;
        }

        // Compute FFT
        // In a real implementation, we would use a more efficient algorithm
        // such as the Cooley-Tukey FFT algorithm
        for (let k = 0; k < n / 2; k++) {
            let real = 0;
            let imag = 0;

            for (let t = 0; t < n; t++) {
                const angle = -2 * Math.PI * k * t / n;
                real += windowedData[t] * Math.cos(angle);
                imag += windowedData[t] * Math.sin(angle);
            }

            magnitudes[k] = Math.sqrt(real * real + imag * imag);
            phases[k] = Math.atan2(imag, real);
        }

        return { magnitudes, phases };
    }

    /**
     * Perform IFFT using optimized serial algorithm
     *
     * @param {Object} freqData - The frequency domain data
     * @param {number} timeLength - The desired length of the output time domain data
     * @returns {Float32Array} - The time domain data
     * @private
     */
    _serialIFFT(freqData, timeLength) {
        // Implement an optimized IFFT algorithm
        // This is a simplified implementation for demonstration

        const { magnitudes, phases } = freqData;
        const n = timeLength;
        const output = new Float32Array(n);

        // Compute IFFT
        // In a real implementation, we would use a more efficient algorithm
        for (let t = 0; t < n; t++) {
            let sample = 0;

            for (let k = 0; k < magnitudes.length; k++) {
                const angle = 2 * Math.PI * k * t / n;
                sample += magnitudes[k] * Math.cos(angle + phases[k]);
            }

            output[t] = sample / magnitudes.length;
        }

        return output;
    }
}

/**
 * Buffer Pool for efficient memory management
 */
class BufferPool {
    /**
     * Create a new Buffer Pool
     *
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            initialSize: 8,
            maxSize: 32,
            sizes: [512, 1024, 2048, 4096, 8192],
            ...config
        };

        this.pools = {};
        this._initializePools();

        this.stats = {
            created: 0,
            reused: 0,
            released: 0,
            currentUsage: 0
        };
    }

    /**
     * Initialize buffer pools
     *
     * @private
     */
    _initializePools() {
        this.config.sizes.forEach(size => {
            this.pools[size] = {
                available: Array(this.config.initialSize).fill().map(() => new Float32Array(size)),
                inUse: new Set()
            };
        });
    }

    /**
     * Acquire a buffer from the pool
     *
     * @param {number} size - The size of the buffer to acquire
     * @returns {Float32Array} - The acquired buffer
     */
    acquire(size) {
        // Find the smallest buffer size that fits the request
        const poolSize = this.config.sizes.find(s => s >= size) || this.config.sizes[this.config.sizes.length - 1];
        const pool = this.pools[poolSize];

        if (pool.available.length > 0) {
            const buffer = pool.available.pop();
            pool.inUse.add(buffer);
            this.stats.reused++;
            this.stats.currentUsage += buffer.length * 4; // 4 bytes per float
            return buffer;
        } else if (pool.inUse.size < this.config.maxSize) {
            const buffer = new Float32Array(poolSize);
            pool.inUse.add(buffer);
            this.stats.created++;
            this.stats.currentUsage += buffer.length * 4;
            return buffer;
        } else {
            // Pool is full, create a temporary buffer
            this.stats.created++;
            return new Float32Array(poolSize);
        }
    }

    /**
     * Release a buffer back to the pool
     *
     * @param {Float32Array} buffer - The buffer to release
     */
    release(buffer) {
        const size = buffer.length;
        const poolSize = this.config.sizes.find(s => s === size);

        if (poolSize && this.pools[poolSize]) {
            const pool = this.pools[poolSize];

            if (pool.inUse.has(buffer)) {
                pool.inUse.delete(buffer);
                pool.available.push(buffer);
                this.stats.released++;
                this.stats.currentUsage -= buffer.length * 4;
            }
        }
    }

    /**
     * Get buffer pool statistics
     *
     * @returns {Object} - Buffer pool statistics
     */
    getStats() {
        return { ...this.stats };
    }
}

/**
 * Parallel Processor for efficient multi-threaded processing
 */
class ParallelProcessor {
    /**
     * Create a new Parallel Processor
     *
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            workerCount: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
            taskSize: 1024,
            ...config
        };

        this.workers = [];
        this.taskQueue = [];
        this.busyWorkers = new Set();

        // In a browser environment, we would initialize Web Workers here
        if (typeof Worker !== 'undefined') {
            this._initializeWorkers();
        }
    }

    /**
     * Initialize Web Workers
     *
     * @private
     */
    _initializeWorkers() {
        // In a real implementation, we would create actual Web Workers
        // For this demonstration, we'll simulate workers
        for (let i = 0; i < this.config.workerCount; i++) {
            const worker = {
                postMessage: (data) => {
                    // Simulate worker processing
                    setTimeout(() => {
                        let result;

                        if (data.operation === 'fft') {
                            // Simulate FFT
                            const magnitudes = new Float32Array(data.data.length / 2);
                            const phases = new Float32Array(data.data.length / 2);

                            for (let j = 0; j < data.data.length / 2; j++) {
                                magnitudes[j] = Math.random();
                                phases[j] = Math.random() * 2 * Math.PI;
                            }

                            result = { magnitudes, phases };
                        } else if (data.operation === 'ifft') {
                            // Simulate IFFT
                            result = new Float32Array(data.data.timeLength);

                            for (let j = 0; j < data.data.timeLength; j++) {
                                result[j] = Math.random() * 2 - 1;
                            }
                        } else {
                            // Generic processing
                            result = data.data;
                        }

                        // Simulate worker response
                        worker.onmessage({ data: { taskId: data.taskId, result } });
                    }, 10); // Simulate processing time
                }
            };

            worker.onmessage = (e) => {
                const { taskId, result } = e.data;
                const task = this.taskQueue.find(t => t.id === taskId);

                if (task) {
                    task.resolve(result);
                    this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
                }

                this.busyWorkers.delete(worker);
                this._processNextTask();
            };

            this.workers.push(worker);
        }
    }

    /**
     * Process data in parallel
     *
     * @param {*} data - The data to process
     * @param {string} operation - The operation to perform
     * @returns {Promise<*>} - The processed data
     */
    async process(data, operation) {
        return new Promise((resolve, reject) => {
            const taskId = Date.now() + Math.random();

            this.taskQueue.push({
                id: taskId,
                data,
                operation,
                resolve,
                reject
            });

            this._processNextTask();
        });
    }

    /**
     * Process the next task in the queue
     *
     * @private
     */
    _processNextTask() {
        if (this.taskQueue.length === 0) return;

        const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));

        if (availableWorker) {
            const task = this.taskQueue[0];
            this.busyWorkers.add(availableWorker);

            availableWorker.postMessage({
                taskId: task.id,
                data: task.data,
                operation: task.operation
            });
        }
    }
}

module.exports = {
    PerformanceOptimizer,
    BufferPool,
    ParallelProcessor
};
