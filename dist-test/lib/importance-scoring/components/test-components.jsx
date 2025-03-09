"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@testing-library/react");
const weight_configurator_1 = require("./weight-configurator");
const ml_insights_panel_1 = require("./ml-insights-panel");
const hybrid_score_visualizer_1 = require("./hybrid-score-visualizer");
describe('WeightConfigurator', () => {
    const mockWeights = {
        recency: 0.2,
        relevance: 0.2,
        interaction: 0.2,
        complexity: 0.1,
        theme: 0.2,
        keyTerms: 0.1,
    };
    const mockProps = {
        weights: mockWeights,
        onWeightChange: jest.fn(),
        mlWeight: 0.3,
        onMLWeightChange: jest.fn(),
    };
    it('renders all weight categories', () => {
        (0, react_2.render)(<weight_configurator_1.WeightConfigurator {...mockProps}/>);
        Object.keys(mockWeights).forEach(key => {
            expect(react_2.screen.getByText(key.charAt(0).toUpperCase() + key.slice(1))).toBeInTheDocument();
        });
    });
    it('displays current weight values', () => {
        (0, react_2.render)(<weight_configurator_1.WeightConfigurator {...mockProps}/>);
        Object.values(mockWeights).forEach(value => {
            expect(react_2.screen.getByText(`${(value * 100).toFixed(0)}%`)).toBeInTheDocument();
        });
    });
    it('calls onWeightChange when slider changes', () => {
        (0, react_2.render)(<weight_configurator_1.WeightConfigurator {...mockProps}/>);
        const slider = react_2.screen.getAllByRole('slider')[0];
        react_2.fireEvent.change(slider, { target: { value: '50' } });
        expect(mockProps.onWeightChange).toHaveBeenCalled();
    });
});
describe('MLInsightsPanel', () => {
    const mockPerformanceMetrics = {
        accuracy: 0.85,
        confidence: 0.8,
        learningRate: 0.1,
    };
    const mockRecentPredictions = [
        {
            predicted: 0.7,
            actual: 0.8,
            timestamp: new Date(),
        },
    ];
    it('displays performance metrics', () => {
        (0, react_2.render)(<ml_insights_panel_1.MLInsightsPanel performanceMetrics={mockPerformanceMetrics} recentPredictions={mockRecentPredictions}/>);
        expect(react_2.screen.getByText('85.0%')).toBeInTheDocument(); // Accuracy
        expect(react_2.screen.getByText('80.0%')).toBeInTheDocument(); // Confidence
        expect(react_2.screen.getByText('10.0%')).toBeInTheDocument(); // Learning Rate
    });
    it('shows recent predictions', () => {
        (0, react_2.render)(<ml_insights_panel_1.MLInsightsPanel performanceMetrics={mockPerformanceMetrics} recentPredictions={mockRecentPredictions}/>);
        expect(react_2.screen.getByText('Predicted: 70.0%')).toBeInTheDocument();
        expect(react_2.screen.getByText('Actual: 80.0%')).toBeInTheDocument();
    });
});
describe('HybridScoreVisualizer', () => {
    const mockMessage = {
        id: 'test-1',
        content: 'Test message content',
        timestamp: new Date(),
        references: ['ref-1'],
        hasResponse: true,
        participantCount: 2,
    };
    const mockProps = {
        message: mockMessage,
        userScore: 0.7,
        mlScore: 0.8,
        confidence: 0.85,
        weight: 0.3,
    };
    it('displays message content', () => {
        (0, react_2.render)(<hybrid_score_visualizer_1.HybridScoreVisualizer {...mockProps}/>);
        expect(react_2.screen.getByText(mockMessage.content)).toBeInTheDocument();
    });
    it('shows all score components', () => {
        (0, react_2.render)(<hybrid_score_visualizer_1.HybridScoreVisualizer {...mockProps}/>);
        expect(react_2.screen.getByText('70.0%')).toBeInTheDocument(); // User Score
        expect(react_2.screen.getByText('80.0%')).toBeInTheDocument(); // ML Score
        expect(react_2.screen.getByText('85.0%')).toBeInTheDocument(); // Confidence
    });
    it('displays metadata', () => {
        (0, react_2.render)(<hybrid_score_visualizer_1.HybridScoreVisualizer {...mockProps}/>);
        expect(react_2.screen.getByText(`ID: ${mockMessage.id}`)).toBeInTheDocument();
        expect(react_2.screen.getByText('References: 1')).toBeInTheDocument();
    });
    it('calculates and displays final score', () => {
        (0, react_2.render)(<hybrid_score_visualizer_1.HybridScoreVisualizer {...mockProps}/>);
        // Final score = (userScore * (1 - weight)) + (mlScore * weight)
        // = (0.7 * 0.7) + (0.8 * 0.3) = 0.49 + 0.24 = 0.73
        expect(react_2.screen.getByText('73.0%')).toBeInTheDocument();
    });
});
// Test utilities
const createMockMessage = (overrides = {}) => ({
    id: 'test-id',
    content: 'Test content',
    timestamp: new Date(),
    references: [],
    hasResponse: false,
    participantCount: 1,
    ...overrides,
});
//# sourceMappingURL=test-components.jsx.map