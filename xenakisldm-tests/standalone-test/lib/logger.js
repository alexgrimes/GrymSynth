/**
 * Debug logging utility for XenakisLDM tests
 */
class Logger {
    static debug = true;

    static section(title) {
        if (!this.debug) return;
        console.log('\n' + '='.repeat(50));
        console.log(title);
        console.log('='.repeat(50));
    }

    static info(message, data = null) {
        if (!this.debug) return;
        console.log(message);
        if (data !== null) {
            if (typeof data === 'object') {
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(data);
            }
        }
    }

    static error(message, data = null) {
        if (!this.debug) return;
        console.error(message);
        if (data !== null) {
            if (typeof data === 'object') {
                console.error(JSON.stringify(data, null, 2));
            } else {
                console.error(data);
            }
        }
    }

    static spectrum(frequencies, magnitudes, label = 'Spectrum Analysis') {
        if (!this.debug) return;
        console.log(`\n${label}:`);

        // Find significant peaks
        const peaks = [];
        const threshold = Math.max(...magnitudes) * 0.1;

        for (let i = 1; i < magnitudes.length - 1; i++) {
            if (magnitudes[i] > threshold &&
                magnitudes[i] > magnitudes[i-1] &&
                magnitudes[i] > magnitudes[i+1]) {
                peaks.push({
                    frequency: frequencies[i],
                    magnitude: magnitudes[i]
                });
            }
        }

        // Sort peaks by magnitude
        peaks.sort((a, b) => b.magnitude - a.magnitude);

        // Print top peaks
        console.log('Significant peaks:');
        peaks.slice(0, 5).forEach(peak => {
            console.log(`  ${peak.frequency.toFixed(1)} Hz: ${peak.magnitude.toFixed(3)}`);
        });

        // Calculate basic statistics
        const totalEnergy = magnitudes.reduce((sum, m) => sum + m, 0);
        const avgEnergy = totalEnergy / magnitudes.length;

        console.log('\nSpectral Statistics:');
        console.log(`- Total energy: ${totalEnergy.toFixed(3)}`);
        console.log(`- Average energy: ${avgEnergy.toFixed(3)}`);
        console.log(`- Peak count: ${peaks.length}`);

        if (peaks.length > 1) {
            const ratios = peaks.slice(1).map(p => (p.frequency / peaks[0].frequency).toFixed(3));
            console.log(`- Frequency ratios: ${ratios.join(', ')}`);
        }
    }

    static comparePeaks(label, peaks1, peaks2) {
        if (!this.debug) return;
        console.log(`\n${label}:`);

        const format = peaks => peaks.map(p =>
            `${p.frequency.toFixed(1)}Hz (${p.magnitude.toFixed(3)})`
        ).join(', ');

        console.log('Before:', format(peaks1));
        console.log('After:', format(peaks2));

        if (peaks1.length > 0 && peaks2.length > 0) {
            const ratios1 = peaks1.slice(1).map(p => (p.frequency / peaks1[0].frequency).toFixed(3));
            const ratios2 = peaks2.slice(1).map(p => (p.frequency / peaks2[0].frequency).toFixed(3));

            console.log('Before ratios:', ratios1.join(', '));
            console.log('After ratios:', ratios2.join(', '));
        }
    }
}

module.exports = Logger;
