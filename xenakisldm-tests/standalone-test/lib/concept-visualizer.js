/**
 * Concept Visualizer for XenakisLDM
 *
 * This module provides visualization tools for the Musical Concept Mapper,
 * helping users understand the relationships between musical concepts and
 * mathematical parameters.
 */

class ConceptVisualizer {
    /**
     * Create a new Concept Visualizer
     *
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            canvasWidth: 800,
            canvasHeight: 400,
            padding: 40,
            colors: {
                background: '#f8f9fa',
                axis: '#343a40',
                grid: '#dee2e6',
                primary: '#007bff',
                secondary: '#6c757d',
                highlight: '#fd7e14'
            },
            ...config
        };

        this.canvas = null;
        this.ctx = null;
    }

    /**
     * Initialize the visualizer with a canvas element
     *
     * @param {HTMLCanvasElement} canvas - The canvas element to draw on
     */
    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas dimensions
        this.canvas.width = this.config.canvasWidth;
        this.canvas.height = this.config.canvasHeight;

        // Clear canvas
        this._clearCanvas();
    }

    /**
     * Visualize the mapping between a musical concept and parameters
     *
     * @param {MusicalConceptMapper} mapper - The Musical Concept Mapper instance
     * @param {string} concept - The musical concept to visualize
     */
    visualizeConceptMapping(mapper, concept) {
        if (!this.canvas || !this.ctx) {
            throw new Error('Visualizer not initialized. Call initialize() first.');
        }

        // Get visualization data for the concept
        const visualizationData = mapper.getVisualizationData(concept);
        const { samplePoints, mappingResults } = visualizationData;

        // Clear canvas
        this._clearCanvas();

        // Draw title
        this._drawTitle(`${concept.toUpperCase()} MAPPING`);

        // Get parameter targets for this concept
        const conceptInfo = mapper.getConceptInfo(concept);
        const parameterTargets = conceptInfo.parameters.map(p => p.target);

        // Draw parameter curves
        this._drawParameterCurves(samplePoints, mappingResults, parameterTargets);

        // Draw axes and grid
        this._drawAxes('Concept Value', 'Parameter Value');

        // Draw legend
        this._drawLegend(parameterTargets);
    }

    /**
     * Visualize multiple concepts and their relationships
     *
     * @param {MusicalConceptMapper} mapper - The Musical Concept Mapper instance
     * @param {Array} concepts - Array of concept names to visualize
     */
    visualizeConceptRelationships(mapper, concepts) {
        if (!this.canvas || !this.ctx) {
            throw new Error('Visualizer not initialized. Call initialize() first.');
        }

        // Clear canvas
        this._clearCanvas();

        // Draw title
        this._drawTitle('CONCEPT RELATIONSHIPS');

        // Create a matrix of relationships
        const matrix = this._createRelationshipMatrix(mapper, concepts);

        // Draw the relationship matrix
        this._drawRelationshipMatrix(matrix, concepts);
    }

    /**
     * Visualize parameter space with concept influences
     *
     * @param {MusicalConceptMapper} mapper - The Musical Concept Mapper instance
     * @param {string} xAxisConcept - The concept for the X axis
     * @param {string} yAxisConcept - The concept for the Y axis
     * @param {string} parameter - The parameter to visualize
     */
    visualizeParameterSpace(mapper, xAxisConcept, yAxisConcept, parameter) {
        if (!this.canvas || !this.ctx) {
            throw new Error('Visualizer not initialized. Call initialize() first.');
        }

        // Clear canvas
        this._clearCanvas();

        // Draw title
        this._drawTitle(`PARAMETER SPACE: ${parameter}`);

        // Create a 2D grid of parameter values
        const grid = this._createParameterGrid(mapper, xAxisConcept, yAxisConcept, parameter);

        // Draw the parameter space
        this._drawParameterSpace(grid, xAxisConcept, yAxisConcept);

        // Draw axes
        this._drawAxes(xAxisConcept, yAxisConcept);
    }

    /**
     * Clear the canvas
     *
     * @private
     */
    _clearCanvas() {
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw the title
     *
     * @param {string} title - The title to draw
     * @private
     */
    _drawTitle(title) {
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.canvas.width / 2, 25);
    }

    /**
     * Draw parameter curves
     *
     * @param {Array} samplePoints - Array of sample points (0-1)
     * @param {Array} mappingResults - Array of mapping results
     * @param {Array} parameterTargets - Array of parameter targets
     * @private
     */
    _drawParameterCurves(samplePoints, mappingResults, parameterTargets) {
        const width = this.canvas.width - 2 * this.config.padding;
        const height = this.canvas.height - 2 * this.config.padding;
        const startX = this.config.padding;
        const startY = this.canvas.height - this.config.padding;

        // For each parameter
        parameterTargets.forEach((target, paramIndex) => {
            // Get values for this parameter
            const values = mappingResults.map(result => {
                // Extract the value from the nested structure
                const path = target.split('.');
                let current = result._raw;
                return current[target];
            });

            // Normalize values if they're not arrays
            if (!Array.isArray(values[0])) {
                const min = Math.min(...values);
                const max = Math.max(...values);
                const range = max - min;

                // Set color based on parameter index
                this.ctx.strokeStyle = this._getParameterColor(paramIndex);
                this.ctx.lineWidth = 2;

                // Begin path
                this.ctx.beginPath();

                // Draw curve
                samplePoints.forEach((point, i) => {
                    const x = startX + point * width;
                    const normalizedValue = range > 0 ? (values[i] - min) / range : 0.5;
                    const y = startY - normalizedValue * height;

                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                });

                // Stroke path
                this.ctx.stroke();

                // Draw points
                samplePoints.forEach((point, i) => {
                    const x = startX + point * width;
                    const normalizedValue = range > 0 ? (values[i] - min) / range : 0.5;
                    const y = startY - normalizedValue * height;

                    this.ctx.fillStyle = this._getParameterColor(paramIndex);
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    this.ctx.fill();
                });
            } else {
                // For array values, draw a bar for each sample point
                // showing the length of the array
                const lengths = values.map(arr => arr.length);
                const maxLength = Math.max(...lengths);

                // Set color based on parameter index
                this.ctx.fillStyle = this._getParameterColor(paramIndex);

                // Draw bars
                samplePoints.forEach((point, i) => {
                    const x = startX + point * width - 5;
                    const barHeight = (lengths[i] / maxLength) * height;
                    const y = startY - barHeight;

                    this.ctx.fillRect(x, y, 10, barHeight);
                });
            }
        });
    }

    /**
     * Draw axes and grid
     *
     * @param {string} xLabel - Label for the X axis
     * @param {string} yLabel - Label for the Y axis
     * @private
     */
    _drawAxes(xLabel, yLabel) {
        const width = this.canvas.width - 2 * this.config.padding;
        const height = this.canvas.height - 2 * this.config.padding;
        const startX = this.config.padding;
        const startY = this.canvas.height - this.config.padding;

        // Draw grid
        this.ctx.strokeStyle = this.config.colors.grid;
        this.ctx.lineWidth = 0.5;

        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = startX + (i / 10) * width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, startY - height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        for (let i = 0; i <= 10; i++) {
            const y = startY - (i / 10) * height;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(startX + width, y);
            this.ctx.stroke();
        }

        // Draw axes
        this.ctx.strokeStyle = this.config.colors.axis;
        this.ctx.lineWidth = 2;

        // X axis
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(startX + width, startY);
        this.ctx.stroke();

        // Y axis
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(startX, startY - height);
        this.ctx.stroke();

        // Draw labels
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.font = '14px Arial';

        // X axis label
        this.ctx.textAlign = 'center';
        this.ctx.fillText(xLabel, startX + width / 2, startY + 30);

        // Y axis label
        this.ctx.save();
        this.ctx.translate(startX - 30, startY - height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(yLabel, 0, 0);
        this.ctx.restore();

        // Draw tick marks and values
        this.ctx.font = '10px Arial';

        // X axis ticks
        for (let i = 0; i <= 10; i++) {
            const x = startX + (i / 10) * width;
            const value = (i / 10).toFixed(1);

            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, startY + 5);
            this.ctx.stroke();

            this.ctx.textAlign = 'center';
            this.ctx.fillText(value, x, startY + 15);
        }

        // Y axis ticks
        for (let i = 0; i <= 10; i++) {
            const y = startY - (i / 10) * height;
            const value = (i / 10).toFixed(1);

            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(startX - 5, y);
            this.ctx.stroke();

            this.ctx.textAlign = 'right';
            this.ctx.fillText(value, startX - 10, y + 3);
        }
    }

    /**
     * Draw legend
     *
     * @param {Array} parameterTargets - Array of parameter targets
     * @private
     */
    _drawLegend(parameterTargets) {
        const startX = this.canvas.width - this.config.padding - 200;
        const startY = this.config.padding + 20;

        // Draw legend box
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(startX, startY, 200, parameterTargets.length * 20 + 10);

        this.ctx.strokeStyle = this.config.colors.axis;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(startX, startY, 200, parameterTargets.length * 20 + 10);

        // Draw legend items
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';

        parameterTargets.forEach((target, i) => {
            const x = startX + 10;
            const y = startY + 20 * (i + 1);

            // Draw color box
            this.ctx.fillStyle = this._getParameterColor(i);
            this.ctx.fillRect(x, y - 10, 15, 10);

            // Draw parameter name
            this.ctx.fillStyle = this.config.colors.axis;
            this.ctx.fillText(target, x + 25, y);
        });
    }

    /**
     * Create a relationship matrix between concepts
     *
     * @param {MusicalConceptMapper} mapper - The Musical Concept Mapper instance
     * @param {Array} concepts - Array of concept names
     * @returns {Array} - 2D array of relationship values
     * @private
     */
    _createRelationshipMatrix(mapper, concepts) {
        const matrix = [];

        // For each concept pair, calculate relationship strength
        for (let i = 0; i < concepts.length; i++) {
            matrix[i] = [];

            for (let j = 0; j < concepts.length; j++) {
                if (i === j) {
                    // Self-relationship is 1.0
                    matrix[i][j] = 1.0;
                } else {
                    // Calculate relationship based on parameter overlap
                    const conceptInfoI = mapper.getConceptInfo(concepts[i]);
                    const conceptInfoJ = mapper.getConceptInfo(concepts[j]);

                    const paramsI = conceptInfoI.parameters.map(p => p.target);
                    const paramsJ = conceptInfoJ.parameters.map(p => p.target);

                    // Count overlapping parameters
                    const overlap = paramsI.filter(p => paramsJ.includes(p)).length;

                    // Calculate relationship strength
                    matrix[i][j] = overlap / Math.max(paramsI.length, paramsJ.length);
                }
            }
        }

        return matrix;
    }

    /**
     * Draw a relationship matrix
     *
     * @param {Array} matrix - 2D array of relationship values
     * @param {Array} concepts - Array of concept names
     * @private
     */
    _drawRelationshipMatrix(matrix, concepts) {
        const size = concepts.length;
        const cellSize = Math.min(
            (this.canvas.width - 2 * this.config.padding - 100) / size,
            (this.canvas.height - 2 * this.config.padding - 100) / size
        );

        const startX = this.config.padding + 100;
        const startY = this.config.padding + 100;

        // Draw matrix cells
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                const x = startX + j * cellSize;
                const y = startY + i * cellSize;

                // Calculate color based on relationship strength
                const value = matrix[i][j];
                const r = Math.floor(255 * (1 - value));
                const g = Math.floor(255 * (1 - Math.abs(value - 0.5) * 2));
                const b = Math.floor(255 * value);

                // Fill cell
                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.ctx.fillRect(x, y, cellSize, cellSize);

                // Draw cell value
                this.ctx.fillStyle = 'white';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(value.toFixed(2), x + cellSize / 2, y + cellSize / 2 + 4);
            }
        }

        // Draw concept labels
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.font = '12px Arial';

        // Row labels (Y axis)
        for (let i = 0; i < size; i++) {
            const y = startY + i * cellSize + cellSize / 2;

            this.ctx.textAlign = 'right';
            this.ctx.fillText(concepts[i], startX - 10, y + 4);
        }

        // Column labels (X axis)
        for (let j = 0; j < size; j++) {
            const x = startX + j * cellSize + cellSize / 2;

            this.ctx.textAlign = 'center';
            this.ctx.save();
            this.ctx.translate(x, startY - 10);
            this.ctx.rotate(-Math.PI / 4);
            this.ctx.fillText(concepts[j], 0, 0);
            this.ctx.restore();
        }
    }

    /**
     * Create a parameter grid for 2D visualization
     *
     * @param {MusicalConceptMapper} mapper - The Musical Concept Mapper instance
     * @param {string} xAxisConcept - The concept for the X axis
     * @param {string} yAxisConcept - The concept for the Y axis
     * @param {string} parameter - The parameter to visualize
     * @returns {Array} - 2D array of parameter values
     * @private
     */
    _createParameterGrid(mapper, xAxisConcept, yAxisConcept, parameter) {
        const gridSize = 20;
        const grid = [];

        // For each grid point, calculate parameter value
        for (let y = 0; y < gridSize; y++) {
            grid[y] = [];

            for (let x = 0; x < gridSize; x++) {
                const xValue = x / (gridSize - 1);
                const yValue = y / (gridSize - 1);

                // Map concepts to parameters
                const params = mapper.mapMultipleConcepts({
                    [xAxisConcept]: xValue,
                    [yAxisConcept]: yValue
                });

                // Extract parameter value
                const path = parameter.split('.');
                let value = params;

                for (const key of path) {
                    if (value && value[key] !== undefined) {
                        value = value[key];
                    } else {
                        value = null;
                        break;
                    }
                }

                // Store parameter value
                grid[y][x] = value;
            }
        }

        return grid;
    }

    /**
     * Draw a parameter space visualization
     *
     * @param {Array} grid - 2D array of parameter values
     * @param {string} xAxisConcept - The concept for the X axis
     * @param {string} yAxisConcept - The concept for the Y axis
     * @private
     */
    _drawParameterSpace(grid, xAxisConcept, yAxisConcept) {
        const gridSize = grid.length;
        const cellSize = Math.min(
            (this.canvas.width - 2 * this.config.padding) / gridSize,
            (this.canvas.height - 2 * this.config.padding) / gridSize
        );

        const startX = this.config.padding;
        const startY = this.config.padding;

        // Find min and max values
        let min = Infinity;
        let max = -Infinity;

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const value = grid[y][x];

                if (value !== null && !isNaN(value)) {
                    min = Math.min(min, value);
                    max = Math.max(max, value);
                }
            }
        }

        // Draw grid cells
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cellX = startX + x * cellSize;
                const cellY = startY + (gridSize - y - 1) * cellSize;

                const value = grid[y][x];

                if (value !== null && !isNaN(value)) {
                    // Normalize value
                    const normalizedValue = (value - min) / (max - min);

                    // Calculate color
                    const r = Math.floor(255 * (1 - normalizedValue));
                    const g = Math.floor(255 * (1 - Math.abs(normalizedValue - 0.5) * 2));
                    const b = Math.floor(255 * normalizedValue);

                    // Fill cell
                    this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    this.ctx.fillRect(cellX, cellY, cellSize, cellSize);
                } else {
                    // Fill with gray for null or NaN values
                    this.ctx.fillStyle = '#cccccc';
                    this.ctx.fillRect(cellX, cellY, cellSize, cellSize);
                }
            }
        }

        // Draw color scale
        this._drawColorScale(min, max);
    }

    /**
     * Draw a color scale
     *
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @private
     */
    _drawColorScale(min, max) {
        const width = 20;
        const height = this.canvas.height - 2 * this.config.padding;
        const startX = this.canvas.width - this.config.padding - width;
        const startY = this.config.padding;

        // Draw scale gradient
        for (let y = 0; y < height; y++) {
            const normalizedValue = 1 - (y / height);

            // Calculate color
            const r = Math.floor(255 * (1 - normalizedValue));
            const g = Math.floor(255 * (1 - Math.abs(normalizedValue - 0.5) * 2));
            const b = Math.floor(255 * normalizedValue);

            // Draw line
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.fillRect(startX, startY + y, width, 1);
        }

        // Draw scale border
        this.ctx.strokeStyle = this.config.colors.axis;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(startX, startY, width, height);

        // Draw scale labels
        this.ctx.fillStyle = this.config.colors.axis;
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';

        // Max value
        this.ctx.fillText(max.toFixed(2), startX + width + 5, startY + 10);

        // Middle value
        this.ctx.fillText(((max + min) / 2).toFixed(2), startX + width + 5, startY + height / 2);

        // Min value
        this.ctx.fillText(min.toFixed(2), startX + width + 5, startY + height - 5);
    }

    /**
     * Get a color for a parameter based on its index
     *
     * @param {number} index - Parameter index
     * @returns {string} - Color string
     * @private
     */
    _getParameterColor(index) {
        const colors = [
            '#007bff', // blue
            '#fd7e14', // orange
            '#28a745', // green
            '#dc3545', // red
            '#6f42c1', // purple
            '#20c997', // teal
            '#17a2b8', // cyan
            '#6c757d'  // gray
        ];

        return colors[index % colors.length];
    }
}

module.exports = ConceptVisualizer;
