/**
 * Visualization tools for spectral field evolution
 */
class EvolutionVisualizer {
    static visualizeEvolution(evolutionData, width = 80, height = 15) {
        console.log('\nField Evolution Visualization:');

        // Create time-based visualization grid
        const grid = this._createTimeGrid(evolutionData, width, height);
        console.log(this._gridToString(grid));

        // Show field metrics over time
        this._showEvolutionMetrics(evolutionData);

        // Show harmonic relationships
        this._showHarmonicRelationships(evolutionData);
    }

    static _createTimeGrid(evolutionData, width, height) {
        const grid = Array(height).fill().map(() => Array(width).fill(' '));

        // Scale factors for plotting
        const timeScale = (width - 1) / evolutionData.length;
        const maxStrength = Math.max(
            ...evolutionData.flatMap(data =>
                data.fields.map(f => f.strength)
            )
        );

        // Plot each field's evolution
        evolutionData[0].fields.forEach((_, fieldIndex) => {
            const symbol = ['█', '▓', '▒', '░'][fieldIndex % 4];

            for (let t = 0; t < evolutionData.length - 1; t++) {
                const x1 = Math.floor(t * timeScale);
                const x2 = Math.floor((t + 1) * timeScale);

                const y1 = Math.floor((1 - evolutionData[t].fields[fieldIndex].strength / maxStrength) * (height - 1));
                const y2 = Math.floor((1 - evolutionData[t + 1].fields[fieldIndex].strength / maxStrength) * (height - 1));

                this._drawLine(grid, x1, y1, x2, y2, symbol);
            }
        });

        return grid;
    }

    static _drawLine(grid, x1, y1, x2, y2, symbol) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (y1 >= 0 && y1 < grid.length && x1 >= 0 && x1 < grid[0].length) {
                grid[y1][x1] = symbol;
            }

            if (x1 === x2 && y1 === y2) break;
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
        }
    }

    static _gridToString(grid) {
        return '\n' + grid.map(row => row.join('')).join('\n') + '\n';
    }

    static _showEvolutionMetrics(evolutionData) {
        console.log('\nEvolution Metrics Over Time:');
        console.log('Time  | Avg Strength | Max Strength | Interaction | Bandwidth');
        console.log('-'.repeat(60));

        evolutionData.forEach(({ time, metrics }) => {
            console.log(
                `${time.toFixed(2).padStart(5)} | ` +
                `${metrics.averageStrength.toFixed(3).padStart(11)} | ` +
                `${metrics.maxStrength.toFixed(3).padStart(11)} | ` +
                `${metrics.totalInteraction.toFixed(3).padStart(10)} | ` +
                `${metrics.averageBandwidth.toFixed(1).padStart(8)}`
            );
        });
    }

    static _showHarmonicRelationships(evolutionData) {
        console.log('\nHarmonic Relationships:');

        evolutionData.forEach(({ time, fields }) => {
            console.log(`\nTime: ${time.toFixed(2)}`);

            // Show frequency ratios between fields
            console.log('Frequency Ratios:');
            for (let i = 0; i < fields.length; i++) {
                for (let j = i + 1; j < fields.length; j++) {
                    const ratio = fields[i].frequency / fields[j].frequency;
                    const isHarmonic = Math.abs(Math.round(ratio * 2) / 2 - ratio) < 0.1;
                    console.log(
                        `  ${fields[i].frequency}Hz : ${fields[j].frequency}Hz = ` +
                        `${ratio.toFixed(3)} ${isHarmonic ? '(harmonic)' : ''}`
                    );
                }
            }

            // Show field strengths
            console.log('Field Strengths:');
            fields.forEach((field, i) => {
                console.log(
                    `  Field ${i + 1}: ${field.strength.toFixed(3)} ` +
                    `(${field.evolutionState?.strengthMod?.toFixed(3) || 'N/A'} mod)`
                );
            });
        });
    }

    static visualizeFieldDistribution(fields, minFreq = 20, maxFreq = 20000, points = 60) {
        console.log('\nSpectral Field Distribution:');

        // Create frequency axis (logarithmic)
        const freqPoints = [];
        const step = Math.exp(Math.log(maxFreq/minFreq)/(points-1));
        let freq = minFreq;
        for (let i = 0; i < points; i++) {
            freqPoints.push(freq);
            freq *= step;
        }

        // Calculate field effects
        const effects = freqPoints.map(f => {
            let totalEffect = 0;
            fields.forEach(field => {
                const distance = Math.abs(Math.log2(f/field.frequency));
                const effect = field.strength * Math.exp(-distance * distance / 2);
                totalEffect += effect;
            });
            return totalEffect;
        });

        // Normalize effects
        const maxEffect = Math.max(...effects);
        const normalizedEffects = effects.map(e => e / maxEffect);

        // Create visualization
        const height = 10;
        const grid = Array(height).fill().map(() => Array(points).fill(' '));

        normalizedEffects.forEach((effect, x) => {
            const y = Math.floor((1 - effect) * (height - 1));
            for (let i = y; i < height; i++) {
                grid[i][x] = '█';
            }
        });

        // Add frequency markers
        console.log('Hz ' + '-'.repeat(points));
        console.log(this._gridToString(grid));
        console.log(
            `${minFreq}Hz`.padEnd(Math.floor(points/4)) +
            `${Math.sqrt(minFreq*maxFreq)}Hz`.padEnd(Math.floor(points/2)) +
            `${maxFreq}Hz`
        );
    }
}

module.exports = EvolutionVisualizer;
