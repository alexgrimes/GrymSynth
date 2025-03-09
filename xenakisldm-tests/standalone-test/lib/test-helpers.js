/**
 * Test helpers for XenakisLDM tests
 */
const Logger = require('./logger');

class TestHelpers {
    /**
     * Compare and visualize parameter differences
     */
    static compareParameters(original, normalized, prefix = '') {
        const changes = [];
        const indent = prefix ? '  ' : '';

        function compareValues(path, orig, norm) {
            if (orig === norm) return;

            const change = {
                path: path,
                original: orig,
                normalized: norm,
                type: typeof norm
            };

            // Classify the change
            if (orig === undefined || orig === null) {
                change.kind = 'default';
            } else if (Array.isArray(orig) && Array.isArray(norm)) {
                change.kind = 'array';
            } else if (typeof orig === 'number' && typeof norm === 'number') {
                change.kind = orig > norm ? 'clamped_down' : 'clamped_up';
            } else {
                change.kind = 'changed';
            }

            changes.push(change);
        }

        function traverse(origObj, normObj, path = '') {
            if (!origObj || !normObj) {
                compareValues(path, origObj, normObj);
                return;
            }

            if (typeof origObj !== 'object' || typeof normObj !== 'object') {
                compareValues(path, origObj, normObj);
                return;
            }

            for (const key in normObj) {
                const newPath = path ? `${path}.${key}` : key;

                if (typeof normObj[key] === 'object' && normObj[key] !== null) {
                    traverse(origObj[key], normObj[key], newPath);
                } else {
                    compareValues(newPath, origObj?.[key], normObj[key]);
                }
            }
        }

        // Compare the objects
        traverse(original, normalized);

        // Log the changes
        if (changes.length > 0) {
            Logger.info(`${prefix}Parameter Changes:`);

            changes.forEach(change => {
                let message = `${indent}${change.path}: `;

                switch (change.kind) {
                    case 'default':
                        message += `default value ${formatValue(change.normalized)}`;
                        break;
                    case 'clamped_down':
                        message += `clamped ${formatValue(change.original)} → ${formatValue(change.normalized)}`;
                        break;
                    case 'clamped_up':
                        message += `increased ${formatValue(change.original)} → ${formatValue(change.normalized)}`;
                        break;
                    case 'array':
                        message += `array modified [${change.original}] → [${change.normalized}]`;
                        break;
                    default:
                        message += `${formatValue(change.original)} → ${formatValue(change.normalized)}`;
                }

                Logger.info(message);
            });
        } else {
            Logger.info(`${prefix}No parameter changes needed`);
        }

        return changes;
    }

    /**
     * Compare audio characteristics
     */
    static compareAudioCharacteristics(original, processed, label = '') {
        if (!original || !processed) {
            Logger.info(`${label}Invalid audio buffers for comparison`);
            return;
        }

        const characteristics = {
            duration: {
                original: original.duration,
                processed: processed.duration
            },
            channels: {
                original: original.numberOfChannels,
                processed: processed.numberOfChannels
            },
            rms: {
                original: [],
                processed: []
            },
            peakAmplitude: {
                original: [],
                processed: []
            }
        };

        // Calculate per-channel statistics
        for (let c = 0; c < original.numberOfChannels; c++) {
            const origData = original.getChannelData(c);
            const procData = processed.getChannelData(c);

            // RMS calculation
            const origRms = Math.sqrt(
                origData.reduce((sum, x) => sum + x * x, 0) / origData.length
            );
            const procRms = Math.sqrt(
                procData.reduce((sum, x) => sum + x * x, 0) / procData.length
            );

            characteristics.rms.original.push(origRms);
            characteristics.rms.processed.push(procRms);

            // Peak amplitude
            characteristics.peakAmplitude.original.push(
                Math.max(...origData.map(Math.abs))
            );
            characteristics.peakAmplitude.processed.push(
                Math.max(...procData.map(Math.abs))
            );
        }

        // Log comparison
        Logger.info(`\n${label}Audio Characteristics:`);
        Logger.info('Duration:', {
            original: characteristics.duration.original.toFixed(3),
            processed: characteristics.duration.processed.toFixed(3),
            ratio: (characteristics.duration.processed /
                   characteristics.duration.original).toFixed(3)
        });

        Logger.info('Channels:', {
            original: characteristics.channels.original,
            processed: characteristics.channels.processed
        });

        for (let c = 0; c < characteristics.channels.original; c++) {
            Logger.info(`Channel ${c}:`, {
                rmsOriginal: characteristics.rms.original[c].toFixed(3),
                rmsProcessed: characteristics.rms.processed[c].toFixed(3),
                rmsRatio: (characteristics.rms.processed[c] /
                          characteristics.rms.original[c]).toFixed(3),
                peakOriginal: characteristics.peakAmplitude.original[c].toFixed(3),
                peakProcessed: characteristics.peakAmplitude.processed[c].toFixed(3),
                peakRatio: (characteristics.peakAmplitude.processed[c] /
                           characteristics.peakAmplitude.original[c]).toFixed(3)
            });
        }

        return characteristics;
    }
}

function formatValue(value) {
    if (typeof value === 'number') {
        return value.toFixed(3);
    }
    return String(value);
}

module.exports = TestHelpers;
