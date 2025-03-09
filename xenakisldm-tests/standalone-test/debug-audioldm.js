const AudioLDMMock = require('./mocks/audioldm-service');
const fs = require('fs');

async function debugAudioLDM() {
    console.log('Starting AudioLDM Debug Test\n');
    console.log('Node version:', process.version);
    console.log('Working directory:', process.cwd(), '\n');

    try {
        // Create instance with debug configuration
        console.log('Initializing AudioLDM Mock...');
        const audioldm = new AudioLDMMock({
            sampleRate: 44100,
            baseLatency: 50,
            variance: 0.05
        });

        console.log('Configuration:', JSON.stringify(audioldm.config, null, 2), '\n');

        // Test 1: Generate simple audio
        console.log('Test 1: Simple Audio Generation');
        console.log('Generating audio with test prompt...\n');

        const startTime = Date.now();
        const buffer = await audioldm.generateAudio('test tone', { duration: 1.0 });
        const endTime = Date.now();

        console.log('Buffer properties:');
        console.log('- Sample rate:', buffer.sampleRate);
        console.log('- Channels:', buffer.numberOfChannels);
        console.log('- Duration:', buffer.duration);
        console.log('- Length:', buffer.length);
        console.log('- Generation time:', endTime - startTime, 'ms\n');

        // Analyze each channel
        const channelAnalysis = [];
        for (let c = 0; c < buffer.numberOfChannels; c++) {
            console.log(`Analyzing channel ${c}...`);
            const channelData = buffer.getChannelData(c);

            // Basic signal analysis
            const stats = analyzeSignal(channelData);
            channelAnalysis.push(stats);

            console.log('Channel statistics:');
            console.log('- Length:', channelData.length);
            console.log('- First 5 samples:', Array.from(channelData.slice(0, 5)).map(v => v.toFixed(4)));
            console.log('- Min:', stats.min.toFixed(4));
            console.log('- Max:', stats.max.toFixed(4));
            console.log('- RMS:', stats.rms.toFixed(4));
            console.log('- Zero crossings:', stats.zeroCrossings);
            console.log('- DC offset:', stats.dcOffset.toFixed(4));
            console.log('- Peak locations:', stats.peakLocations.slice(0, 5).map(i => i.toFixed(0)));
            console.log('');
        }

        // Create comprehensive debug data
        const debugData = {
            environment: {
                nodeVersion: process.version,
                timestamp: new Date().toISOString()
            },
            config: audioldm.config,
            bufferProperties: {
                sampleRate: buffer.sampleRate,
                channels: buffer.numberOfChannels,
                duration: buffer.duration,
                length: buffer.length,
                generationTime: endTime - startTime
            },
            channelAnalysis: channelAnalysis.map((stats, idx) => ({
                channel: idx,
                stats: {
                    min: stats.min,
                    max: stats.max,
                    rms: stats.rms,
                    zeroCrossings: stats.zeroCrossings,
                    dcOffset: stats.dcOffset,
                    peakCount: stats.peakLocations.length
                },
                firstSamples: Array.from(buffer.getChannelData(idx).slice(0, 10))
            })),
            performance: {
                memory: process.memoryUsage(),
                timing: {
                    total: endTime - startTime
                }
            }
        };

        // Save debug data
        const debugPath = 'audioldm-debug.json';
        fs.writeFileSync(debugPath, JSON.stringify(debugData, null, 2));
        console.log(`Debug data saved to ${debugPath}`);

        return true;
    } catch (error) {
        console.error('\nTest failed with error:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

function analyzeSignal(samples) {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let sumSquares = 0;
    let zeroCrossings = 0;
    const peakLocations = [];
    let lastValue = samples[0];

    for (let i = 0; i < samples.length; i++) {
        const value = samples[i];

        // Basic stats
        min = Math.min(min, value);
        max = Math.max(max, value);
        sum += value;
        sumSquares += value * value;

        // Zero crossings
        if (i > 0 && Math.sign(value) !== Math.sign(lastValue)) {
            zeroCrossings++;
        }

        // Peak detection (local maxima/minima)
        if (i > 0 && i < samples.length - 1) {
            if ((value > samples[i-1] && value > samples[i+1]) ||
                (value < samples[i-1] && value < samples[i+1])) {
                peakLocations.push(i);
            }
        }

        lastValue = value;
    }

    return {
        min,
        max,
        rms: Math.sqrt(sumSquares / samples.length),
        zeroCrossings,
        dcOffset: sum / samples.length,
        peakLocations
    };
}

// Run debug if this is the main module
if (require.main === module) {
    debugAudioLDM()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Debug execution failed:', error);
            process.exit(1);
        });
}

module.exports = { debugAudioLDM, analyzeSignal };
