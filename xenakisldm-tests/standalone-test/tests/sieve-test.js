const XenakisLDMPipeline = require('../lib/xenakis-pipeline');

function visualizePattern(pattern, width = 50) {
    return pattern.map(value => {
        const barLength = Math.round(value * width);
        return `${(value * 100).toFixed(1).padStart(5)}% ${'█'.repeat(barLength)}${'.'.repeat(width - barLength)}`;
    }).join('\n');
}

function analyzeSievePattern(data, blockSize) {
    const pattern = new Array(blockSize).fill(0);
    let blockCount = 0;
    let totalEnergy = 0;
    let sieveEnergy = 0;

    // Analyze multiple blocks
    for (let blockStart = 0; blockStart < Math.min(data.length, blockSize * 20); blockStart += blockSize) {
        blockCount++;
        const blockEnd = Math.min(blockStart + blockSize, data.length);

        for (let i = blockStart; i < blockEnd; i++) {
            const value = Math.abs(data[i]);
            const positionInBlock = i - blockStart;

            totalEnergy += value;
            pattern[positionInBlock] += value;
        }
    }

    // Normalize pattern
    const maxValue = Math.max(...pattern);
    if (maxValue > 0) {
        pattern.forEach((value, i) => {
            pattern[i] = value / (blockCount * maxValue);
        });
    }

    return pattern;
}

async function testSieveTransform() {
    console.log('Testing Sieve Transform\n');

    try {
        const pipeline = new XenakisLDMPipeline();
        const parameters = {
            sieve: {
                intervals: [2, 3, 5]
            },
            duration: 0.2 // Short duration for quick testing
        };

        console.log('Test parameters:');
        console.log('- Intervals:', parameters.sieve.intervals);
        console.log('- Duration:', parameters.duration, 'seconds\n');

        // Generate and process audio
        const { rawAudio, processedAudio } = await pipeline.generate(
            'test sieve pattern',
            parameters
        );

        // Analyze first channel
        const rawData = rawAudio.getChannelData(0);
        const processedData = processedAudio.getChannelData(0);

        // Calculate energy statistics
        let rawEnergy = 0, processedEnergy = 0;
        let rawPeakCount = 0, processedPeakCount = 0;
        const threshold = 0.1;

        for (let i = 0; i < rawData.length; i++) {
            rawEnergy += Math.abs(rawData[i]);
            processedEnergy += Math.abs(processedData[i]);

            if (Math.abs(rawData[i]) > threshold) rawPeakCount++;
            if (Math.abs(processedData[i]) > threshold) processedPeakCount++;
        }

        console.log('Energy Analysis:');
        console.log('Raw Audio:');
        console.log(`- Total energy: ${rawEnergy.toFixed(2)}`);
        console.log(`- Peak count: ${rawPeakCount}`);
        console.log(`- Peak ratio: ${(rawPeakCount / rawData.length).toFixed(4)}`);

        console.log('\nProcessed Audio:');
        console.log(`- Total energy: ${processedEnergy.toFixed(2)}`);
        console.log(`- Peak count: ${processedPeakCount}`);
        console.log(`- Peak ratio: ${(processedPeakCount / processedData.length).toFixed(4)}`);
        console.log(`- Energy retention: ${((processedEnergy / rawEnergy) * 100).toFixed(1)}%`);

        // Analyze sieve pattern
        const blockSize = Math.max(...parameters.sieve.intervals);
        const pattern = analyzeSievePattern(processedData, blockSize);

        console.log('\nSieve Pattern Analysis:');
        console.log('Block size:', blockSize);
        console.log('\nAmplitude distribution by position:');
        console.log(visualizePattern(pattern));

        // Print interval points
        console.log('\nInterval points:');
        for (let i = 0; i < blockSize; i++) {
            const matchingIntervals = parameters.sieve.intervals
                .filter(interval => i % interval === 0)
                .join(', ');

            if (matchingIntervals) {
                console.log(`Position ${i}: matches intervals [${matchingIntervals}]`);
            }
        }

        // Verify sieve effect
        const retainedEnergyRatio = processedEnergy / rawEnergy;
        const expectedRatio = parameters.sieve.intervals.length / blockSize;

        console.log('\nVerification:');
        console.log(`Retained energy ratio: ${(retainedEnergyRatio * 100).toFixed(1)}%`);
        console.log(`Expected ratio: ${(expectedRatio * 100).toFixed(1)}%`);

        const tolerance = 0.3; // Allow 30% deviation from expected ratio
        if (Math.abs(retainedEnergyRatio - expectedRatio) > tolerance) {
            throw new Error(
                `Sieve effect not matching expected pattern. ` +
                `Expected ~${(expectedRatio * 100).toFixed(1)}% energy retention, ` +
                `got ${(retainedEnergyRatio * 100).toFixed(1)}%`
            );
        }

        console.log('\n✓ Sieve transform test passed');
        return true;
    } catch (error) {
        console.error('\n✗ Sieve transform test failed:', error.message);
        return false;
    }
}

// Run test if this is the main module
if (require.main === module) {
    testSieveTransform()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { testSieveTransform, analyzeSievePattern };
