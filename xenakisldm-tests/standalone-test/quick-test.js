const AudioLDMMock = require('./mocks/audioldm-service');

async function quickTest() {
    try {
        console.log('Creating AudioLDM Mock instance...');
        const audioldm = new AudioLDMMock({
            sampleRate: 44100,
            baseLatency: 10,
            variance: 0.01
        });

        console.log('\nGenerating test audio...');
        const buffer = await audioldm.generateAudio('test', { duration: 0.1 });

        console.log('\nBuffer properties:');
        console.log('Sample rate:', buffer.sampleRate);
        console.log('Channels:', buffer.numberOfChannels);
        console.log('Duration:', buffer.duration);
        console.log('Length:', buffer.length);

        console.log('\nAnalyzing channel data...');
        for (let c = 0; c < buffer.numberOfChannels; c++) {
            try {
                const data = buffer.getChannelData(c);
                console.log(`\nChannel ${c}:`);
                console.log('Data type:', Object.prototype.toString.call(data));
                console.log('Length:', data.length);
                console.log('First 5 samples:', Array.from(data.slice(0, 5)).map(v => v.toFixed(6)));

                // Calculate basic statistics
                let min = Infinity, max = -Infinity;
                let zeroCrossings = 0;
                let prevSample = 0;

                for (let i = 0; i < data.length; i++) {
                    const sample = data[i];
                    min = Math.min(min, sample);
                    max = Math.max(max, sample);

                    if (i > 0 && Math.sign(sample) !== Math.sign(prevSample)) {
                        zeroCrossings++;
                    }
                    prevSample = sample;
                }

                console.log('Min:', min.toFixed(6));
                console.log('Max:', max.toFixed(6));
                console.log('Zero crossings:', zeroCrossings);
            } catch (error) {
                console.error(`Error analyzing channel ${c}:`, error);
            }
        }

        console.log('\nTest completed successfully');
        return true;
    } catch (error) {
        console.error('\nTest failed:', error);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run test
quickTest().then(success => {
    console.log('\nTest result:', success ? 'PASS' : 'FAIL');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
